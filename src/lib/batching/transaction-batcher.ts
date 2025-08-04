export interface Transaction {
  id: string
  from: string
  to: string
  amount: number
  data: any
  signature: string
  gasLimit: number
  gasPrice: number
  nonce: number
  timestamp: string
}

export interface BatchConfig {
  maxSize: number
  maxGasLimit: number
  timeout: number // in milliseconds
  aggregationStrategy: 'size' | 'gas' | 'time' | 'hybrid'
  validationStrategy: 'parallel' | 'sequential' | 'adaptive'
}

export interface TransactionBatch {
  id: string
  transactions: Transaction[]
  totalAmount: number
  totalGas: number
  aggregatedSignature?: string
  validationTime: number
  processingTime: number
  status: 'pending' | 'validating' | 'validated' | 'committed' | 'failed'
  createdAt: string
  validatedAt?: string
  committedAt?: string
  error?: string
}

export interface SignatureAggregation {
  batchId: string
  algorithm: 'ML-DSA' | 'SPHINCS+' | 'Falcon' | 'BLS'
  aggregatedSignature: string
  individualSignatures: string[]
  aggregationTime: number
  verificationTime: number
  sizeReduction: number // percentage
  verificationReduction: number // percentage
}

export interface BatchMetrics {
  batchId: string
  transactionCount: number
  batchSize: number // in bytes
  gasSavings: number // percentage
  timeSavings: number // percentage
  throughput: number // transactions per second
  validationEfficiency: number // percentage
  networkOverhead: number // percentage
}

export interface BatchingPerformance {
  totalTransactions: number
  totalBatches: number
  averageBatchSize: number
  averageValidationTime: number
  gasEfficiency: number // percentage
  throughput: number
  signatureAggregationEfficiency: number // percentage
  networkOptimization: number // percentage
}

class TransactionBatcher {
  private pendingTransactions: Transaction[] = []
  private activeBatches: Map<string, TransactionBatch> = new Map()
  private completedBatches: TransactionBatch[] = []
  private signatureAggregations: Map<string, SignatureAggregation> = new Map()
  private batchMetrics: Map<string, BatchMetrics[]> = new Map()
  private config: BatchConfig
  private isRunning = false
  private processingInterval?: NodeJS.Timeout

  constructor(config?: Partial<BatchConfig>) {
    this.config = {
      maxSize: config?.maxSize || 100,
      maxGasLimit: config?.maxGasLimit || 1000000,
      timeout: config?.timeout || 5000,
      aggregationStrategy: config?.aggregationStrategy || 'hybrid',
      validationStrategy: config?.validationStrategy || 'adaptive'
    }
  }

  public async start(): Promise<void> {
    if (this.isRunning) return
    
    this.isRunning = true
    console.log('Starting transaction batcher...')

    // Start batch processing
    this.startBatchProcessing()

    // Start metrics collection
    this.startMetricsCollection()
  }

  public async stop(): Promise<void> {
    this.isRunning = false
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
    }
    console.log('Stopping transaction batcher...')
  }

  private startBatchProcessing(): void {
    this.processingInterval = setInterval(() => {
      if (!this.isRunning) return

      // Create new batches from pending transactions
      this.createBatches()

      // Process active batches
      this.processBatches()

      // Clean up completed batches
      this.cleanupBatches()
    }, 1000)
  }

  private createBatches(): void {
    while (this.pendingTransactions.length >= this.config.maxSize || 
           (this.pendingTransactions.length > 0 && this.shouldCreateBatch())) {
      
      const batch = this.createBatch()
      if (batch) {
        this.activeBatches.set(batch.id, batch)
      }
    }
  }

  private shouldCreateBatch(): boolean {
    if (this.pendingTransactions.length === 0) return false

    const oldestTransaction = this.pendingTransactions[0]
    const transactionAge = Date.now() - new Date(oldestTransaction.timestamp).getTime()
    
    return transactionAge >= this.config.timeout
  }

  private createBatch(): TransactionBatch | null {
    if (this.pendingTransactions.length === 0) return null

    const batchTransactions: Transaction[] = []
    let totalGas = 0
    let totalAmount = 0

    // Select transactions based on aggregation strategy
    const selectedTransactions = this.selectTransactionsForBatch()
    
    for (const tx of selectedTransactions) {
      if (batchTransactions.length >= this.config.maxSize) break
      if (totalGas + tx.gasLimit > this.config.maxGasLimit) break
      
      batchTransactions.push(tx)
      totalGas += tx.gasLimit
      totalAmount += tx.amount
      
      // Remove from pending
      const index = this.pendingTransactions.findIndex(t => t.id === tx.id)
      if (index !== -1) {
        this.pendingTransactions.splice(index, 1)
      }
    }

    if (batchTransactions.length === 0) return null

    const batch: TransactionBatch = {
      id: this.generateBatchId(),
      transactions: batchTransactions,
      totalAmount,
      totalGas,
      validationTime: 0,
      processingTime: 0,
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    return batch
  }

  private selectTransactionsForBatch(): Transaction[] {
    switch (this.config.aggregationStrategy) {
      case 'size':
        return this.selectBySize()
      case 'gas':
        return this.selectByGas()
      case 'time':
        return this.selectByTime()
      case 'hybrid':
        return this.selectHybrid()
      default:
        return this.selectHybrid()
    }
  }

  private selectBySize(): Transaction[] {
    // Select transactions to minimize batch size
    return [...this.pendingTransactions]
      .sort((a, b) => JSON.stringify(a).length - JSON.stringify(b).length)
  }

  private selectByGas(): Transaction[] {
    // Select transactions to optimize gas usage
    return [...this.pendingTransactions]
      .sort((a, b) => a.gasLimit - b.gasLimit)
  }

  private selectByTime(): Transaction[] {
    // Select oldest transactions first
    return [...this.pendingTransactions]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }

  private selectHybrid(): Transaction[] {
    // Hybrid approach considering multiple factors
    return [...this.pendingTransactions]
      .sort((a, b) => {
        const scoreA = this.calculateTransactionScore(a)
        const scoreB = this.calculateTransactionScore(b)
        return scoreA - scoreB
      })
  }

  private calculateTransactionScore(tx: Transaction): number {
    const sizeScore = JSON.stringify(tx).length
    const gasScore = tx.gasLimit
    const timeScore = Date.now() - new Date(tx.timestamp).getTime()
    
    // Weighted combination (lower score is better)
    return (sizeScore * 0.3) + (gasScore * 0.5) + (timeScore * 0.2)
  }

  private async processBatches(): Promise<void> {
    const processingPromises: Promise<void>[] = []

    for (const [batchId, batch] of this.activeBatches) {
      if (batch.status === 'pending') {
        processingPromises.push(this.processBatch(batch))
      }
    }

    await Promise.allSettled(processingPromises)
  }

  private async processBatch(batch: TransactionBatch): Promise<void> {
    batch.status = 'validating'
    const startTime = Date.now()

    try {
      // Validate transactions in batch
      const validationResult = await this.validateBatch(batch)
      
      if (validationResult.isValid) {
        // Aggregate signatures
        const aggregationResult = await this.aggregateSignatures(batch)
        
        batch.aggregatedSignature = aggregationResult.aggregatedSignature
        batch.validationTime = validationResult.validationTime
        batch.processingTime = Date.now() - startTime
        batch.status = 'validated'
        batch.validatedAt = new Date().toISOString()

        // Store signature aggregation
        this.signatureAggregations.set(batch.id, aggregationResult)

        // Update metrics
        this.updateBatchMetrics(batch, aggregationResult)

        // Move to completed batches
        setTimeout(() => {
          batch.status = 'committed'
          batch.committedAt = new Date().toISOString()
          this.completedBatches.push(batch)
          this.activeBatches.delete(batch.id)
        }, 100) // Simulate commit delay

      } else {
        batch.status = 'failed'
        batch.error = validationResult.error
        batch.processingTime = Date.now() - startTime
      }
    } catch (error) {
      batch.status = 'failed'
      batch.error = error instanceof Error ? error.message : 'Unknown error'
      batch.processingTime = Date.now() - startTime
    }
  }

  private async validateBatch(batch: TransactionBatch): Promise<{
    isValid: boolean
    validationTime: number
    error?: string
  }> {
    const startTime = Date.now()
    
    try {
      // Simulate batch validation based on validation strategy
      let validationTime = 0
      
      switch (this.config.validationStrategy) {
        case 'parallel':
          validationTime = this.calculateParallelValidationTime(batch)
          break
        case 'sequential':
          validationTime = this.calculateSequentialValidationTime(batch)
          break
        case 'adaptive':
          validationTime = this.calculateAdaptiveValidationTime(batch)
          break
      }

      // Simulate validation delay
      await new Promise(resolve => setTimeout(resolve, validationTime))

      // Simulate validation result (99% success rate)
      const isValid = Math.random() < 0.99

      return {
        isValid,
        validationTime: Date.now() - startTime,
        error: isValid ? undefined : 'Batch validation failed'
      }
    } catch (error) {
      return {
        isValid: false,
        validationTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Validation error'
      }
    }
  }

  private calculateParallelValidationTime(batch: TransactionBatch): number {
    const baseTime = 1 // Base validation time per transaction
    const parallelEfficiency = 0.7 // 70% efficiency due to parallel overhead
    return (baseTime * batch.transactions.length) / (batch.transactions.length * parallelEfficiency)
  }

  private calculateSequentialValidationTime(batch: TransactionBatch): number {
    const baseTime = 1.2 // Slightly higher base time for sequential
    return baseTime * batch.transactions.length
  }

  private calculateAdaptiveValidationTime(batch: TransactionBatch): number {
    // Adaptive: use parallel for large batches, sequential for small ones
    const threshold = 10 // Switch at 10 transactions
    if (batch.transactions.length > threshold) {
      return this.calculateParallelValidationTime(batch)
    } else {
      return this.calculateSequentialValidationTime(batch)
    }
  }

  private async aggregateSignatures(batch: TransactionBatch): Promise<SignatureAggregation> {
    const startTime = Date.now()
    
    // Select aggregation algorithm
    const algorithm = this.selectAggregationAlgorithm(batch)
    
    // Simulate signature aggregation
    const individualSignatures = batch.transactions.map(tx => tx.signature)
    const aggregatedSignature = this.generateAggregatedSignature(individualSignatures)
    
    const aggregationTime = 5 + Math.random() * 10 // 5-15ms
    const verificationTime = 2 + Math.random() * 5 // 2-7ms
    
    await new Promise(resolve => setTimeout(resolve, aggregationTime))
    
    // Calculate efficiency metrics
    const individualSize = individualSignatures.reduce((sum, sig) => sum + sig.length, 0)
    const aggregatedSize = aggregatedSignature.length
    const sizeReduction = ((individualSize - aggregatedSize) / individualSize) * 100
    
    const individualVerificationTime = individualSignatures.length * 3 // 3ms per signature
    const verificationReduction = ((individualVerificationTime - verificationTime) / individualVerificationTime) * 100

    return {
      batchId: batch.id,
      algorithm,
      aggregatedSignature,
      individualSignatures,
      aggregationTime: Date.now() - startTime,
      verificationTime,
      sizeReduction,
      verificationReduction
    }
  }

  private selectAggregationAlgorithm(batch: TransactionBatch): 'ML-DSA' | 'SPHINCS+' | 'Falcon' | 'BLS' {
    const algorithms = ['ML-DSA', 'SPHINCS+', 'Falcon', 'BLS'] as const
    
    // Select based on batch size and characteristics
    if (batch.transactions.length > 50) {
      return 'BLS' // Best for large batches
    } else if (batch.transactions.length > 20) {
      return 'ML-DSA' // Good for medium batches
    } else if (batch.transactions.length > 10) {
      return 'Falcon' // Efficient for smaller batches
    } else {
      return 'SPHINCS+' // Secure for small batches
    }
  }

  private generateAggregatedSignature(signatures: string[]): string {
    // Simulate aggregated signature generation
    const combined = signatures.join('')
    return `agg_${combined.slice(0, 32)}_${Math.random().toString(36).substr(2, 16)}`
  }

  private updateBatchMetrics(batch: TransactionBatch, aggregation: SignatureAggregation): void {
    const individualGas = batch.transactions.reduce((sum, tx) => sum + tx.gasLimit, 0)
    const batchGas = batch.totalGas
    const gasSavings = ((individualGas - batchGas) / individualGas) * 100

    const individualValidationTime = batch.transactions.length * 3 // 3ms per transaction
    const timeSavings = ((individualValidationTime - batch.validationTime) / individualValidationTime) * 100

    const throughput = batch.transactions.length / (batch.processingTime / 1000) // transactions per second

    const validationEfficiency = Math.min(100, (batch.validationTime / individualValidationTime) * 100)

    const networkOverhead = (JSON.stringify(batch).length / 
      (batch.transactions.reduce((sum, tx) => sum + JSON.stringify(tx).length, 0))) * 100

    const metrics: BatchMetrics = {
      batchId: batch.id,
      transactionCount: batch.transactions.length,
      batchSize: JSON.stringify(batch).length,
      gasSavings,
      timeSavings,
      throughput,
      validationEfficiency,
      networkOverhead
    }

    const existingMetrics = this.batchMetrics.get(batch.id) || []
    existingMetrics.push(metrics)
    this.batchMetrics.set(batch.id, existingMetrics)
  }

  private cleanupBatches(): void {
    // Keep only recent completed batches
    const cutoffTime = Date.now() - 60000 // Keep batches from last minute
    this.completedBatches = this.completedBatches.filter(
      batch => new Date(batch.createdAt).getTime() > cutoffTime
    )
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      if (!this.isRunning) return
      // Metrics are updated in real-time during batch processing
    }, 5000)
  }

  private generateBatchId(): string {
    return `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Public API methods
  public addTransaction(transaction: Transaction): void {
    this.pendingTransactions.push(transaction)
  }

  public addTransactions(transactions: Transaction[]): void {
    this.pendingTransactions.push(...transactions)
  }

  public getPendingTransactions(): Transaction[] {
    return [...this.pendingTransactions]
  }

  public getActiveBatches(): TransactionBatch[] {
    return Array.from(this.activeBatches.values())
  }

  public getCompletedBatches(): TransactionBatch[] {
    return [...this.completedBatches]
  }

  public getBatchMetrics(batchId: string): BatchMetrics[] {
    return this.batchMetrics.get(batchId) || []
  }

  public getSignatureAggregation(batchId: string): SignatureAggregation | undefined {
    return this.signatureAggregations.get(batchId)
  }

  public getOverallPerformance(): BatchingPerformance {
    const allBatches = [...this.completedBatches, ...this.activeBatches.values()]
    const allMetrics = Array.from(this.batchMetrics.values()).flat()
    
    const totalTransactions = allBatches.reduce((sum, batch) => sum + batch.transactions.length, 0)
    const totalBatches = allBatches.length
    const averageBatchSize = totalBatches > 0 ? 
      allBatches.reduce((sum, batch) => sum + batch.transactions.length, 0) / totalBatches : 0
    const averageValidationTime = allBatches.length > 0 ?
      allBatches.reduce((sum, batch) => sum + batch.validationTime, 0) / allBatches.length : 0
    
    const gasEfficiency = allMetrics.length > 0 ?
      allMetrics.reduce((sum, m) => sum + m.gasSavings, 0) / allMetrics.length : 0
    
    const throughput = allMetrics.length > 0 ?
      allMetrics.reduce((sum, m) => sum + m.throughput, 0) / allMetrics.length : 0
    
    const signatureAggregationEfficiency = Array.from(this.signatureAggregations.values())
      .reduce((sum, agg) => sum + agg.sizeReduction, 0) / 
      (this.signatureAggregations.size || 1)
    
    const networkOptimization = allMetrics.length > 0 ?
      allMetrics.reduce((sum, m) => sum + (100 - m.networkOverhead), 0) / allMetrics.length : 0

    return {
      totalTransactions,
      totalBatches,
      averageBatchSize,
      averageValidationTime,
      gasEfficiency,
      throughput,
      signatureAggregationEfficiency,
      networkOptimization
    }
  }

  public updateConfig(newConfig: Partial<BatchConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  public benchmarkBatching(transactionCount: number = 1000): Promise<{
    batchingEnabled: {
      totalTime: number
      throughput: number
      gasUsage: number
    }
    batchingDisabled: {
      totalTime: number
      throughput: number
      gasUsage: number
    }
    improvement: {
      timeImprovement: number
      throughputImprovement: number
      gasImprovement: number
    }
  }> {
    return new Promise((resolve) => {
      // Generate test transactions
      const testTransactions: Transaction[] = []
      for (let i = 0; i < transactionCount; i++) {
        testTransactions.push({
          id: `tx-${i}`,
          from: `addr-${i % 100}`,
          to: `addr-${(i + 1) % 100}`,
          amount: Math.floor(Math.random() * 1000) + 1,
          data: { type: 'transfer' },
          signature: `sig-${Math.random().toString(36).substr(2, 32)}`,
          gasLimit: 21000 + Math.floor(Math.random() * 10000),
          gasPrice: 20 + Math.floor(Math.random() * 50),
          nonce: i,
          timestamp: new Date().toISOString()
        })
      }

      // Benchmark with batching enabled
      const batchingStartTime = Date.now()
      this.addTransactions(testTransactions)
      
      const batchingInterval = setInterval(() => {
        if (this.pendingTransactions.length === 0) {
          clearInterval(batchingInterval)
          const batchingEndTime = Date.now()
          const batchingTime = batchingEndTime - batchingStartTime
          
          // Calculate batching metrics
          const batchingGasUsage = this.completedBatches.reduce((sum, batch) => sum + batch.totalGas, 0)
          const batchingThroughput = transactionCount / (batchingTime / 1000)

          // Benchmark without batching (simulation)
          const individualTime = testTransactions.length * 3 // 3ms per transaction
          const individualGasUsage = testTransactions.reduce((sum, tx) => sum + tx.gasLimit, 0)
          const individualThroughput = testTransactions.length / (individualTime / 1000)

          resolve({
            batchingEnabled: {
              totalTime: batchingTime,
              throughput: batchingThroughput,
              gasUsage: batchingGasUsage
            },
            batchingDisabled: {
              totalTime: individualTime,
              throughput: individualThroughput,
              gasUsage: individualGasUsage
            },
            improvement: {
              timeImprovement: ((individualTime - batchingTime) / individualTime) * 100,
              throughputImprovement: ((batchingThroughput - individualThroughput) / individualThroughput) * 100,
              gasImprovement: ((individualGasUsage - batchingGasUsage) / individualGasUsage) * 100
            }
          })
        }
      }, 100)
    })
  }
}

export default TransactionBatcher
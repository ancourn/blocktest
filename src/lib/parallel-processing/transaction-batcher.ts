import { EventEmitter } from 'events'

interface Transaction {
  id: string
  from: string
  to: string
  amount: number
  data: string
  gasLimit: number
  quantumSignature: string
  timestamp: number
  priority: number
}

interface BatchConfig {
  maxSize: number
  maxWaitTime: number
  minSize: number
  priorityThreshold: number
}

interface Batch {
  id: string
  transactions: Transaction[]
  createdAt: number
  size: number
  totalGas: number
  priority: number
}

interface BatchingStats {
  totalBatches: number
  totalTransactions: number
  averageBatchSize: number
  averageWaitTime: number
  throughput: number
  currentQueueSize: number
}

export class TransactionBatcher extends EventEmitter {
  private transactionQueue: Transaction[]
  private currentBatch: Batch | null
  private config: BatchConfig
  private stats: BatchingStats
  private batchTimer: NodeJS.Timeout | null
  private isProcessing: boolean

  constructor(config: Partial<BatchConfig> = {}) {
    super()
    
    this.config = {
      maxSize: config.maxSize || 100,
      maxWaitTime: config.maxWaitTime || 1000, // 1 second
      minSize: config.minSize || 10,
      priorityThreshold: config.priorityThreshold || 5
    }

    this.transactionQueue = []
    this.currentBatch = null
    this.isProcessing = false

    this.stats = {
      totalBatches: 0,
      totalTransactions: 0,
      averageBatchSize: 0,
      averageWaitTime: 0,
      throughput: 0,
      currentQueueSize: 0
    }

    this.startBatchTimer()
  }

  public addTransaction(transaction: Omit<Transaction, 'timestamp'>): Promise<string> {
    return new Promise((resolve, reject) => {
      const fullTransaction: Transaction = {
        ...transaction,
        timestamp: Date.now()
      }

      // Validate transaction
      if (!this.validateTransaction(fullTransaction)) {
        return reject(new Error('Invalid transaction'))
      }

      // Add to queue
      this.transactionQueue.push(fullTransaction)
      this.stats.currentQueueSize = this.transactionQueue.length

      // Sort queue by priority (higher priority first)
      this.transactionQueue.sort((a, b) => b.priority - a.priority)

      // Set up event listener for this transaction
      const batchCompleteHandler = (batchId: string, transactionIds: string[]) => {
        if (transactionIds.includes(fullTransaction.id)) {
          this.removeListener('batch_complete', batchCompleteHandler)
          this.removeListener('batch_error', batchErrorHandler)
          resolve(batchId)
        }
      }

      const batchErrorHandler = (error: Error) => {
        this.removeListener('batch_complete', batchCompleteHandler)
        this.removeListener('batch_error', batchErrorHandler)
        reject(error)
      }

      this.on('batch_complete', batchCompleteHandler)
      this.on('batch_error', batchErrorHandler)

      // Check if we should create a batch immediately
      this.checkBatchCreation()
    })
  }

  private validateTransaction(transaction: Transaction): boolean {
    // Basic validation
    if (!transaction.id || !transaction.from || !transaction.to) {
      return false
    }

    if (transaction.amount <= 0) {
      return false
    }

    if (transaction.gasLimit < 21000) {
      return false
    }

    if (!transaction.quantumSignature || transaction.quantumSignature.length < 100) {
      return false
    }

    return true
  }

  private startBatchTimer(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
    }

    this.batchTimer = setTimeout(() => {
      this.forceBatchCreation()
    }, this.config.maxWaitTime)
  }

  private checkBatchCreation(): void {
    if (this.isProcessing || this.transactionQueue.length === 0) {
      return
    }

    // Check if we have enough transactions or high priority transactions
    const shouldCreateBatch = 
      this.transactionQueue.length >= this.config.maxSize ||
      (this.transactionQueue.length >= this.config.minSize && 
       this.transactionQueue[0].priority >= this.config.priorityThreshold)

    if (shouldCreateBatch) {
      this.createBatch()
    }
  }

  private forceBatchCreation(): void {
    if (this.isProcessing || this.transactionQueue.length === 0) {
      this.startBatchTimer()
      return
    }

    if (this.transactionQueue.length >= this.config.minSize) {
      this.createBatch()
    } else {
      this.startBatchTimer()
    }
  }

  private createBatch(): void {
    if (this.isProcessing || this.transactionQueue.length === 0) {
      return
    }

    this.isProcessing = true

    // Determine batch size
    const batchSize = Math.min(
      this.transactionQueue.length,
      this.config.maxSize
    )

    // Select transactions for this batch
    const transactions = this.transactionQueue.splice(0, batchSize)
    this.stats.currentQueueSize = this.transactionQueue.length

    // Calculate batch metrics
    const totalGas = transactions.reduce((sum, tx) => sum + tx.gasLimit, 0)
    const avgPriority = transactions.reduce((sum, tx) => sum + tx.priority, 0) / transactions.length
    const createdAt = Date.now()

    const batch: Batch = {
      id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      transactions,
      createdAt,
      size: transactions.length,
      totalGas,
      priority: avgPriority
    }

    this.currentBatch = batch

    // Calculate wait time for transactions
    const avgWaitTime = transactions.reduce((sum, tx) => {
      return sum + (createdAt - tx.timestamp)
    }, 0) / transactions.length

    // Update stats
    this.stats.totalBatches++
    this.stats.totalTransactions += transactions.length
    this.stats.averageBatchSize = 
      (this.stats.averageBatchSize * (this.stats.totalBatches - 1) + transactions.length) / 
      this.stats.totalBatches
    this.stats.averageWaitTime = 
      (this.stats.averageWaitTime * (this.stats.totalBatches - 1) + avgWaitTime) / 
      this.stats.totalBatches
    this.stats.throughput = this.stats.totalTransactions / (Date.now() / 1000)

    // Emit batch created event
    this.emit('batch_created', batch)

    // Process the batch
    this.processBatch(batch)
  }

  private async processBatch(batch: Batch): Promise<void> {
    try {
      // Simulate batch processing
      await this.simulateBatchProcessing(batch)

      // Calculate processing time
      const processingTime = Date.now() - batch.createdAt

      // Emit batch complete event
      this.emit('batch_complete', batch.id, batch.transactions.map(tx => tx.id))

      // Log batch processing
      console.log(`Batch ${batch.id} processed: ${batch.size} transactions, ${processingTime}ms`)

    } catch (error) {
      console.error(`Error processing batch ${batch.id}:`, error)
      this.emit('batch_error', error as Error)
    } finally {
      this.currentBatch = null
      this.isProcessing = false
      this.startBatchTimer()
      this.checkBatchCreation()
    }
  }

  private async simulateBatchProcessing(batch: Batch): Promise<void> {
    // Simulate processing time based on batch size
    const processingTime = 50 + (batch.size * 2) + Math.random() * 100
    await new Promise(resolve => setTimeout(resolve, processingTime))

    // Simulate quantum signature validation for all transactions
    for (const transaction of batch.transactions) {
      await this.validateQuantumSignature(transaction)
    }

    // Simulate DAG updates
    await this.updateDAG(batch)

    // Simulate network propagation
    await this.propagateToNetwork(batch)
  }

  private async validateQuantumSignature(transaction: Transaction): Promise<void> {
    // Simulate quantum signature validation
    await new Promise(resolve => setTimeout(resolve, 1 + Math.random() * 2))
  }

  private async updateDAG(batch: Batch): Promise<void> {
    // Simulate DAG update operations
    await new Promise(resolve => setTimeout(resolve, 5 + Math.random() * 10))
  }

  private async propagateToNetwork(batch: Batch): Promise<void> {
    // Simulate network propagation
    await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 20))
  }

  public getStats(): BatchingStats {
    return { ...this.stats }
  }

  public getCurrentBatch(): Batch | null {
    return this.currentBatch
  }

  public getQueueSize(): number {
    return this.transactionQueue.length
  }

  public async shutdown(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
    }

    // Process remaining transactions
    while (this.transactionQueue.length > 0) {
      await this.createBatch()
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    this.removeAllListeners()
  }
}

export default TransactionBatcher
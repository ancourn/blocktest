import { EventEmitter } from 'events'
import ParallelProcessor from './parallel-processor'
import TransactionBatcher from './transaction-batcher'
import LoadBalancer from './load-balancer'

interface ProcessingConfig {
  maxWorkers: number
  batchSize: number
  batchWaitTime: number
  healthCheckInterval: number
  loadBalancingStrategy: 'round-robin' | 'least-connections' | 'weighted' | 'region-aware'
  enableQuantumAwareness: boolean
}

interface ProcessingMetrics {
  tps: number
  avgLatency: number
  throughput: number
  successRate: number
  activeWorkers: number
  queueSize: number
  nodeCount: number
  quantumNodes: number
  cpuUsage: number
  memoryUsage: number
  networkBandwidth: number
}

interface PerformanceBenchmark {
  timestamp: number
  tps: number
  latency: number
  throughput: number
  successRate: number
  resourceUsage: {
    cpu: number
    memory: number
    network: number
  }
}

export class ParallelProcessingService extends EventEmitter {
  private processor: ParallelProcessor
  private batcher: TransactionBatcher
  private loadBalancer: LoadBalancer
  private config: ProcessingConfig
  private metrics: ProcessingMetrics
  private benchmarks: PerformanceBenchmark[]
  private isRunning: boolean
  private startTime: number

  constructor(config: Partial<ProcessingConfig> = {}) {
    super()
    
    this.config = {
      maxWorkers: config.maxWorkers || 4,
      batchSize: config.batchSize || 50,
      batchWaitTime: config.batchWaitTime || 1000,
      healthCheckInterval: config.healthCheckInterval || 30000,
      loadBalancingStrategy: config.loadBalancingStrategy || 'least-connections',
      enableQuantumAwareness: config.enableQuantumAwareness || true
    }

    this.initializeComponents()
    this.initializeMetrics()
    this.setupEventListeners()
    
    this.benchmarks = []
    this.isRunning = false
    this.startTime = Date.now()
  }

  private initializeComponents(): void {
    // Initialize parallel processor
    this.processor = new ParallelProcessor(this.config.maxWorkers)
    
    // Initialize transaction batcher
    this.batcher = new TransactionBatcher({
      maxSize: this.config.batchSize,
      maxWaitTime: this.config.batchWaitTime,
      minSize: Math.max(5, Math.floor(this.config.batchSize * 0.2))
    })
    
    // Initialize load balancer
    this.loadBalancer = new LoadBalancer({
      healthCheckInterval: this.config.healthCheckInterval,
      strategy: this.config.loadBalancingStrategy,
      enableQuantumAwareness: this.config.enableQuantumAwareness
    })

    // Add initial worker nodes to load balancer
    this.addInitialNodes()
  }

  private addInitialNodes(): void {
    for (let i = 0; i < this.config.maxWorkers; i++) {
      this.loadBalancer.addNode({
        id: `worker_${i}`,
        address: '127.0.0.1',
        port: 8000 + i,
        status: 'active',
        currentLoad: 0,
        maxCapacity: 100,
        responseTime: 45,
        region: i % 2 === 0 ? 'us-east' : 'us-west',
        quantumReady: true
      })
    }
  }

  private initializeMetrics(): void {
    this.metrics = {
      tps: 0,
      avgLatency: 0,
      throughput: 0,
      successRate: 100,
      activeWorkers: 0,
      queueSize: 0,
      nodeCount: this.config.maxWorkers,
      quantumNodes: this.config.maxWorkers,
      cpuUsage: 0,
      memoryUsage: 0,
      networkBandwidth: 0
    }
  }

  private setupEventListeners(): void {
    // Parallel processor events
    this.processor.on('job_complete', (jobId, result) => {
      this.updateMetrics('job_complete', result)
    })

    this.processor.on('job_error', (jobId, error) => {
      this.updateMetrics('job_error', { error })
    })

    // Transaction batcher events
    this.batcher.on('batch_complete', (batchId, transactionIds) => {
      this.updateMetrics('batch_complete', { batchId, transactionCount: transactionIds.length })
    })

    this.batcher.on('batch_error', (error) => {
      this.updateMetrics('batch_error', { error })
    })

    // Load balancer events
    this.loadBalancer.on('request_completed', (nodeId, request, result, responseTime) => {
      this.updateMetrics('request_completed', { nodeId, responseTime })
    })

    this.loadBalancer.on('request_failed', (nodeId, request, error) => {
      this.updateMetrics('request_failed', { nodeId, error })
    })
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      return
    }

    this.isRunning = true
    this.startTime = Date.now()
    
    this.emit('service_started')
    console.log('Parallel processing service started')
    
    // Start metrics collection
    this.startMetricsCollection()
  }

  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false
    
    // Shutdown all components
    await this.processor.shutdown()
    await this.batcher.shutdown()
    await this.loadBalancer.shutdown()
    
    this.emit('service_stopped')
    console.log('Parallel processing service stopped')
  }

  public async processTransaction(transaction: {
    id: string
    from: string
    to: string
    amount: number
    data: string
    gasLimit: number
    quantumSignature: string
    priority?: number
  }): Promise<{ batchId: string; result: any }> {
    if (!this.isRunning) {
      throw new Error('Service is not running')
    }

    try {
      // Add transaction to batcher
      const batchId = await this.batcher.addTransaction(transaction)
      
      // Process the transaction through parallel processor
      const result = await this.processor.submitJob('transaction_processing', {
        ...transaction,
        batchId
      }, transaction.priority || 0)

      return { batchId, result }
      
    } catch (error) {
      this.emit('transaction_error', transaction, error)
      throw error
    }
  }

  public async processBatch(transactions: any[]): Promise<{ batchId: string; results: any[] }> {
    if (!this.isRunning) {
      throw new Error('Service is not running')
    }

    try {
      const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const results = await Promise.all(
        transactions.map(async (tx) => {
          const result = await this.processor.submitJob('transaction_processing', {
            ...tx,
            batchId
          }, tx.priority || 0)
          return result
        })
      )

      return { batchId, results }
      
    } catch (error) {
      this.emit('batch_error', error)
      throw error
    }
  }

  public async processQuantumValidation(data: any): Promise<any> {
    if (!this.isRunning) {
      throw new Error('Service is not running')
    }

    return await this.processor.submitJob('quantum_signature_validation', data, 10)
  }

  public async processDAGTraversal(data: any): Promise<any> {
    if (!this.isRunning) {
      throw new Error('Service is not running')
    }

    return await this.processor.submitJob('dag_traversal', data, 5)
  }

  private updateMetrics(event: string, data: any): void {
    const now = Date.now()
    const uptime = now - this.startTime

    switch (event) {
      case 'job_complete':
        // Update TPS and throughput
        this.metrics.tps = this.processor.getStats().throughput
        this.metrics.throughput = this.processor.getStats().throughput
        this.metrics.activeWorkers = this.processor.getStats().activeWorkers
        break

      case 'job_error':
        // Update success rate
        const stats = this.processor.getStats()
        this.metrics.successRate = (stats.completedJobs / stats.totalJobs) * 100
        break

      case 'batch_complete':
        // Update queue size
        this.metrics.queueSize = this.batcher.getQueueSize()
        break

      case 'request_completed':
        // Update latency
        if (data.responseTime) {
          this.metrics.avgLatency = 
            (this.metrics.avgLatency + data.responseTime) / 2
        }
        break

      case 'request_failed':
        // Update success rate
        this.metrics.successRate = Math.max(0, this.metrics.successRate - 1)
        break
    }

    // Update resource usage (simulated)
    this.metrics.cpuUsage = 50 + Math.random() * 30
    this.metrics.memoryUsage = 60 + Math.random() * 20
    this.metrics.networkBandwidth = 30 + Math.random() * 40

    // Emit metrics update
    this.emit('metrics_updated', this.metrics)
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      if (!this.isRunning) return

      // Create benchmark snapshot
      const benchmark: PerformanceBenchmark = {
        timestamp: Date.now(),
        tps: this.metrics.tps,
        latency: this.metrics.avgLatency,
        throughput: this.metrics.throughput,
        successRate: this.metrics.successRate,
        resourceUsage: {
          cpu: this.metrics.cpuUsage,
          memory: this.metrics.memoryUsage,
          network: this.metrics.networkBandwidth
        }
      }

      this.benchmarks.push(benchmark)

      // Keep only last 1000 benchmarks
      if (this.benchmarks.length > 1000) {
        this.benchmarks = this.benchmarks.slice(-1000)
      }

      this.emit('benchmark_collected', benchmark)
    }, 1000) // Collect metrics every second
  }

  public getMetrics(): ProcessingMetrics {
    return { ...this.metrics }
  }

  public getBenchmarks(): PerformanceBenchmark[] {
    return [...this.benchmarks]
  }

  public getPerformanceSummary(): {
    currentTps: number
    targetTps: number
    progress: number
    avgLatency: number
    uptime: number
    totalProcessed: number
    successRate: number
  } {
    const uptime = Date.now() - this.startTime
    const processorStats = this.processor.getStats()
    const targetTps = 2000 // Interim target

    return {
      currentTps: this.metrics.tps,
      targetTps,
      progress: (this.metrics.tps / targetTps) * 100,
      avgLatency: this.metrics.avgLatency,
      uptime,
      totalProcessed: processorStats.completedJobs,
      successRate: this.metrics.successRate
    }
  }

  public async addWorkerNode(node: {
    id: string
    address: string
    port: number
    region: string
    quantumReady: boolean
  }): Promise<void> {
    this.loadBalancer.addNode({
      ...node,
      status: 'active',
      currentLoad: 0,
      maxCapacity: 100,
      responseTime: 45,
      lastHealthCheck: Date.now()
    })

    this.metrics.nodeCount++
    if (node.quantumReady) {
      this.metrics.quantumNodes++
    }

    this.emit('worker_node_added', node)
  }

  public async removeWorkerNode(nodeId: string): Promise<void> {
    const node = this.loadBalancer.getNodeStatus(nodeId)
    if (node) {
      this.loadBalancer.removeNode(nodeId)
      this.metrics.nodeCount--
      if (node.quantumReady) {
        this.metrics.quantumNodes--
      }
      this.emit('worker_node_removed', node)
    }
  }

  public getComponentStats(): {
    processor: any
    batcher: any
    loadBalancer: any
  } {
    return {
      processor: this.processor.getStats(),
      batcher: this.batcher.getStats(),
      loadBalancer: this.loadBalancer.getStats()
    }
  }
}

export default ParallelProcessingService
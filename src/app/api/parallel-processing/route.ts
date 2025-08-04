import { NextRequest, NextResponse } from 'next/server'
import ParallelProcessingService from '@/lib/parallel-processing/parallel-processing-service'

// Global service instance
let processingService: ParallelProcessingService | null = null

async function getProcessingService(): Promise<ParallelProcessingService> {
  if (!processingService) {
    processingService = new ParallelProcessingService({
      maxWorkers: 4,
      batchSize: 50,
      batchWaitTime: 1000,
      loadBalancingStrategy: 'least-connections',
      enableQuantumAwareness: true
    })
    
    await processingService.start()
  }
  
  return processingService
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    const service = await getProcessingService()

    switch (action) {
      case 'metrics':
        const metrics = service.getMetrics()
        return NextResponse.json(metrics)

      case 'summary':
        const summary = service.getPerformanceSummary()
        return NextResponse.json(summary)

      case 'benchmarks':
        const benchmarks = service.getBenchmarks()
        return NextResponse.json(benchmarks)

      case 'components':
        const componentStats = service.getComponentStats()
        return NextResponse.json(componentStats)

      default:
        return NextResponse.json({
          service: 'parallel-processing',
          status: 'running',
          metrics: service.getMetrics(),
          summary: service.getPerformanceSummary()
        })
    }
  } catch (error) {
    console.error('Error in parallel processing GET:', error)
    return NextResponse.json(
      { error: 'Failed to get parallel processing data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    const service = await getProcessingService()

    switch (action) {
      case 'process_transaction':
        const transactionResult = await service.processTransaction(data)
        return NextResponse.json(transactionResult)

      case 'process_batch':
        const batchResult = await service.processBatch(data.transactions || [])
        return NextResponse.json(batchResult)

      case 'quantum_validation':
        const quantumResult = await service.processQuantumValidation(data)
        return NextResponse.json(quantumResult)

      case 'dag_traversal':
        const dagResult = await service.processDAGTraversal(data)
        return NextResponse.json(dagResult)

      case 'add_worker':
        await service.addWorkerNode(data)
        return NextResponse.json({ message: 'Worker node added successfully' })

      case 'remove_worker':
        await service.removeWorkerNode(data.nodeId)
        return NextResponse.json({ message: 'Worker node removed successfully' })

      case 'performance_test':
        const performanceResult = await runPerformanceTest(service, data)
        return NextResponse.json(performanceResult)

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in parallel processing POST:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

async function runPerformanceTest(service: ParallelProcessingService, options: any): Promise<any> {
  const {
    transactionCount = 100,
    concurrentRequests = 10,
    duration = 10000
  } = options

  const startTime = Date.now()
  const results = {
    totalTransactions: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    averageTps: 0,
    averageLatency: 0,
    peakTps: 0,
    minLatency: Infinity,
    maxLatency: 0,
    duration: 0,
    errors: [] as string[]
  }

  const testPromises: Promise<void>[] = []
  const latencies: number[] = []

  // Generate test transactions
  const generateTestTransaction = (index: number) => ({
    id: `test_tx_${index}_${Date.now()}`,
    from: `0x${Math.random().toString(16).substr(2, 40)}`,
    to: `0x${Math.random().toString(16).substr(2, 40)}`,
    amount: Math.floor(Math.random() * 1000) + 1,
    data: '0x' + Math.random().toString(16).substr(2, 64),
    gasLimit: 21000 + Math.floor(Math.random() * 50000),
    quantumSignature: '0x' + Math.random().toString(16).substr(2, 128),
    priority: Math.floor(Math.random() * 10)
  })

  // Process transactions concurrently
  for (let i = 0; i < transactionCount; i++) {
    const transaction = generateTestTransaction(i)
    
    const promise = (async () => {
      try {
        const txStart = Date.now()
        await service.processTransaction(transaction)
        const txEnd = Date.now()
        
        const latency = txEnd - txStart
        latencies.push(latency)
        
        results.successfulTransactions++
        results.totalTransactions++
        
        // Update peak TPS
        const currentTps = results.successfulTransactions / ((txEnd - startTime) / 1000)
        results.peakTps = Math.max(results.peakTps, currentTps)
        
      } catch (error) {
        results.failedTransactions++
        results.totalTransactions++
        results.errors.push(error instanceof Error ? error.message : String(error))
      }
    })()

    testPromises.push(promise)
    
    // Control concurrency
    if (testPromises.length >= concurrentRequests) {
      await Promise.race(testPromises)
      testPromises.splice(testPromises.findIndex(p => 
        Promise.race([p, Promise.resolve()]).then(() => true)
      ), 1)
    }
  }

  // Wait for all transactions to complete
  await Promise.all(testPromises)
  
  const endTime = Date.now()
  results.duration = endTime - startTime

  // Calculate final metrics
  results.averageTps = (results.successfulTransactions / results.duration) * 1000
  results.averageLatency = latencies.length > 0 
    ? latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length 
    : 0
  results.minLatency = latencies.length > 0 ? Math.min(...latencies) : 0
  results.maxLatency = latencies.length > 0 ? Math.max(...latencies) : 0

  return results
}
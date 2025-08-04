import { NextRequest, NextResponse } from 'next/server'
import MultiShardProcessor, { 
  ShardConfig, 
  ShardState, 
  CrossShardTransaction, 
  ShardMetrics 
} from '@/lib/sharding/multi-shard-processor'

// Global instance of the processor
let processor: MultiShardProcessor | null = null

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (!processor) {
      processor = new MultiShardProcessor()
    }

    switch (action) {
      case 'states':
        const states = processor.getShardStates()
        return NextResponse.json({ states })

      case 'metrics':
        const shardId = searchParams.get('shardId')
        if (!shardId) {
          return NextResponse.json(
            { error: 'Shard ID is required' },
            { status: 400 }
          )
        }
        const metrics = processor.getShardMetrics(shardId)
        return NextResponse.json({ metrics })

      case 'cross-shard':
        const crossShardTxs = processor.getCrossShardTransactions()
        return NextResponse.json({ transactions: crossShardTxs })

      case 'overall':
        const overallMetrics = processor.getOverallMetrics()
        return NextResponse.json(overallMetrics)

      case 'total-tps':
        const totalTPS = processor.getTotalTPS()
        return NextResponse.json({ totalTPS })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Multi-shard GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    if (!processor) {
      processor = new MultiShardProcessor()
    }

    switch (action) {
      case 'start':
        await processor.startProcessing()
        return NextResponse.json({ message: 'Multi-shard processing started' })

      case 'stop':
        await processor.stopProcessing()
        return NextResponse.json({ message: 'Multi-shard processing stopped' })

      case 'add-shard':
        const shardConfig: ShardConfig = data.shardConfig
        if (!shardConfig) {
          return NextResponse.json(
            { error: 'Shard configuration is required' },
            { status: 400 }
          )
        }
        processor.addShard(shardConfig)
        return NextResponse.json({ message: 'Shard added successfully' })

      case 'remove-shard':
        const shardId = data.shardId
        if (!shardId) {
          return NextResponse.json(
            { error: 'Shard ID is required' },
            { status: 400 }
          )
        }
        processor.removeShard(shardId)
        return NextResponse.json({ message: 'Shard removed successfully' })

      case 'benchmark':
        const duration = data.duration || 30000
        const targetTPS = data.targetTPS || 10000
        
        // Start processing if not already running
        if (!processor['isRunning']) {
          await processor.startProcessing()
        }

        // Run benchmark for specified duration
        const startTime = Date.now()
        const benchmarkResults: any[] = []

        const benchmarkInterval = setInterval(() => {
          const metrics = processor.getOverallMetrics()
          benchmarkResults.push({
            timestamp: new Date().toISOString(),
            ...metrics
          })
        }, 1000)

        // Stop benchmark after duration
        setTimeout(() => {
          clearInterval(benchmarkInterval)
          if (data.autoStop !== false) {
            processor.stopProcessing()
          }
        }, duration)

        return NextResponse.json({
          message: 'Benchmark started',
          duration,
          targetTPS,
          estimatedShards: processor.getShardStates().length
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Multi-shard POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    if (processor) {
      await processor.stopProcessing()
      processor = null
      return NextResponse.json({ message: 'Multi-shard processor destroyed' })
    }
    return NextResponse.json({ message: 'No active processor found' })
  } catch (error) {
    console.error('Multi-shard DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
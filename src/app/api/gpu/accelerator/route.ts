import { NextRequest, NextResponse } from 'next/server'
import GPUAccelerator from '@/lib/gpu/gpu-accelerator'

// Global instance of the GPU accelerator
let accelerator: GPUAccelerator | null = null

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (!accelerator) {
      accelerator = new GPUAccelerator()
    }

    switch (action) {
      case 'devices':
        const devices = accelerator.getDevices()
        return NextResponse.json({ devices })

      case 'metrics':
        const deviceId = searchParams.get('deviceId')
        if (!deviceId) {
          return NextResponse.json(
            { error: 'Device ID is required' },
            { status: 400 }
          )
        }
        const metrics = accelerator.getDeviceMetrics(deviceId)
        return NextResponse.json({ metrics })

      case 'overall-metrics':
        const overallMetrics = accelerator.getOverallMetrics()
        return NextResponse.json(overallMetrics)

      case 'quantum-operations':
        const quantumOps = accelerator.getQuantumCryptoOperations()
        return NextResponse.json({ operations: Object.fromEntries(quantumOps) })

      case 'task':
        const taskId = searchParams.get('taskId')
        if (!taskId) {
          return NextResponse.json(
            { error: 'Task ID is required' },
            { status: 400 }
          )
        }
        const task = accelerator.getTask(taskId)
        return NextResponse.json({ task })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('GPU accelerator GET error:', error)
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

    if (!accelerator) {
      accelerator = new GPUAccelerator()
    }

    switch (action) {
      case 'start':
        await accelerator.start()
        return NextResponse.json({ message: 'GPU accelerator started' })

      case 'stop':
        await accelerator.stop()
        return NextResponse.json({ message: 'GPU accelerator stopped' })

      case 'submit-task':
        const { kernel, taskData, priority } = data
        if (!kernel) {
          return NextResponse.json(
            { error: 'Kernel is required' },
            { status: 400 }
          )
        }
        const taskId = accelerator.submitTask(kernel, taskData, priority)
        return NextResponse.json({ taskId })

      case 'benchmark':
        const { algorithm, operationCount } = data
        if (!algorithm) {
          return NextResponse.json(
            { error: 'Algorithm is required' },
            { status: 400 }
          )
        }
        const benchmarkResult = await accelerator.benchmarkQuantumCrypto(algorithm, operationCount)
        return NextResponse.json(benchmarkResult)

      case 'comprehensive-benchmark':
        const duration = data.duration || 30000
        
        // Start accelerator if not running
        if (!accelerator['isRunning']) {
          await accelerator.start()
        }

        // Run comprehensive benchmark
        const algorithms = ['ML-DSA', 'SPHINCS+', 'Falcon']
        const benchmarkResults: any = {}
        
        for (const algo of algorithms) {
          benchmarkResults[algo] = await accelerator.benchmarkQuantumCrypto(algo, 50)
        }

        // Get overall metrics
        const overall = accelerator.getOverallMetrics()

        return NextResponse.json({
          benchmarkResults,
          overallMetrics: overall,
          duration,
          message: 'Comprehensive benchmark completed'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('GPU accelerator POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    if (accelerator) {
      await accelerator.stop()
      accelerator = null
      return NextResponse.json({ message: 'GPU accelerator destroyed' })
    }
    return NextResponse.json({ message: 'No active accelerator found' })
  } catch (error) {
    console.error('GPU accelerator DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'

interface PerformanceMetrics {
  timestamp: string
  tps: number
  latency: {
    min: number
    max: number
    avg: number
    p95: number
    p99: number
  }
  throughput: {
    current: number
    peak: number
    average: number
  }
  network: {
    bandwidth: number
    packetLoss: number
    connectionCount: number
  }
  quantum: {
    signatureValidationTime: number
    keyExchangeTime: number
    encryptionOverhead: number
  }
  system: {
    cpuUsage: number
    memoryUsage: number
    diskUsage: number
  }
}

export async function GET(request: NextRequest) {
  try {
    // Simulate performance metrics
    const metrics: PerformanceMetrics = {
      timestamp: new Date().toISOString(),
      tps: 127.3,
      latency: {
        min: 12,
        max: 89,
        avg: 45,
        p95: 67,
        p99: 78
      },
      throughput: {
        current: 145.7,
        peak: 234.1,
        average: 132.8
      },
      network: {
        bandwidth: 45.7,
        packetLoss: 0.02,
        connectionCount: 1247
      },
      quantum: {
        signatureValidationTime: 2.3,
        keyExchangeTime: 1.8,
        encryptionOverhead: 0.15
      },
      system: {
        cpuUsage: 67.3,
        memoryUsage: 78.9,
        diskUsage: 45.2
      }
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Error fetching performance metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { timeframe = '1h' } = body

    // Simulate historical performance data based on timeframe
    const timePoints = timeframe === '1h' ? 60 : timeframe === '24h' ? 24 : 7
    const historicalData: PerformanceMetrics[] = []

    for (let i = 0; i < timePoints; i++) {
      historicalData.push({
        timestamp: new Date(Date.now() - (i * (timeframe === '1h' ? 60000 : timeframe === '24h' ? 3600000 : 86400000))).toISOString(),
        tps: 100 + Math.random() * 50,
        latency: {
          min: 10 + Math.random() * 10,
          max: 80 + Math.random() * 20,
          avg: 40 + Math.random() * 20,
          p95: 60 + Math.random() * 20,
          p99: 70 + Math.random() * 20
        },
        throughput: {
          current: 120 + Math.random() * 50,
          peak: 200 + Math.random() * 50,
          average: 130 + Math.random() * 30
        },
        network: {
          bandwidth: 40 + Math.random() * 20,
          packetLoss: Math.random() * 0.1,
          connectionCount: 1000 + Math.random() * 500
        },
        quantum: {
          signatureValidationTime: 2 + Math.random() * 1,
          keyExchangeTime: 1.5 + Math.random() * 0.5,
          encryptionOverhead: 0.1 + Math.random() * 0.1
        },
        system: {
          cpuUsage: 60 + Math.random() * 20,
          memoryUsage: 70 + Math.random() * 20,
          diskUsage: 40 + Math.random() * 20
        }
      })
    }

    return NextResponse.json(historicalData, { status: 200 })
  } catch (error) {
    console.error('Error fetching historical performance data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch historical performance data' },
      { status: 500 }
    )
  }
}
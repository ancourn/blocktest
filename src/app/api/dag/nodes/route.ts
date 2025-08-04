import { NextRequest, NextResponse } from 'next/server'

interface DAGNode {
  id: string
  address: string
  status: 'active' | 'inactive' | 'syncing'
  lastSeen: string
  connections: number
  throughput: number
  quantumSecurity: boolean
}

export async function GET(request: NextRequest) {
  try {
    // Simulate DAG nodes data
    const nodes: DAGNode[] = [
      {
        id: 'node_001',
        address: '192.168.1.101:8443',
        status: 'active',
        lastSeen: '2024-01-15T10:30:45Z',
        connections: 12,
        throughput: 145.7,
        quantumSecurity: true
      },
      {
        id: 'node_002',
        address: '192.168.1.102:8443',
        status: 'active',
        lastSeen: '2024-01-15T10:31:12Z',
        connections: 8,
        throughput: 132.1,
        quantumSecurity: true
      },
      {
        id: 'node_003',
        address: '192.168.1.103:8443',
        status: 'syncing',
        lastSeen: '2024-01-15T10:29:33Z',
        connections: 5,
        throughput: 89.3,
        quantumSecurity: true
      },
      {
        id: 'node_004',
        address: '192.168.1.104:8443',
        status: 'inactive',
        lastSeen: '2024-01-15T09:45:21Z',
        connections: 0,
        throughput: 0,
        quantumSecurity: true
      },
      {
        id: 'node_005',
        address: '192.168.1.105:8443',
        status: 'active',
        lastSeen: '2024-01-15T10:32:01Z',
        connections: 15,
        throughput: 167.8,
        quantumSecurity: true
      }
    ]

    return NextResponse.json(nodes)
  } catch (error) {
    console.error('Error fetching DAG nodes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch DAG nodes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { address, quantumSecurity = true } = body

    // Simulate node registration
    const newNode = {
      id: `node_${Date.now()}`,
      address,
      status: 'syncing' as const,
      lastSeen: new Date().toISOString(),
      connections: 0,
      throughput: 0,
      quantumSecurity
    }

    return NextResponse.json(newNode, { status: 201 })
  } catch (error) {
    console.error('Error creating DAG node:', error)
    return NextResponse.json(
      { error: 'Failed to create DAG node' },
      { status: 500 }
    )
  }
}
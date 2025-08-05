import { NextRequest, NextResponse } from 'next/server'

interface NetworkPeer {
  id: string
  address: string
  port: number
  version: string
  location: string
  latency: number
  uptime: number
  lastSeen: string
  capabilities: string[]
  quantumReady: boolean
}

export async function GET(request: NextRequest) {
  try {
    // Simulate network peers
    const peers: NetworkPeer[] = [
      {
        id: 'peer_001',
        address: '192.168.1.101',
        port: 8443,
        version: '1.0.0-quantum',
        location: 'New York, US',
        latency: 45,
        uptime: 99.8,
        lastSeen: '2024-01-15T10:30:45Z',
        capabilities: ['dag', 'quantum', 'smart-contracts'],
        quantumReady: true
      },
      {
        id: 'peer_002',
        address: '192.168.1.102',
        port: 8443,
        version: '1.0.0-quantum',
        location: 'London, UK',
        latency: 78,
        uptime: 99.5,
        lastSeen: '2024-01-15T10:31:12Z',
        capabilities: ['dag', 'quantum'],
        quantumReady: true
      },
      {
        id: 'peer_003',
        address: '192.168.1.103',
        port: 8443,
        version: '0.9.0-beta',
        location: 'Tokyo, JP',
        latency: 120,
        uptime: 98.2,
        lastSeen: '2024-01-15T10:29:33Z',
        capabilities: ['dag'],
        quantumReady: false
      },
      {
        id: 'peer_004',
        address: '192.168.1.104',
        port: 8443,
        version: '1.0.0-quantum',
        location: 'Singapore, SG',
        latency: 95,
        uptime: 99.1,
        lastSeen: '2024-01-15T10:31:28Z',
        capabilities: ['dag', 'quantum', 'smart-contracts'],
        quantumReady: true
      },
      {
        id: 'peer_005',
        address: '192.168.1.105',
        port: 8443,
        version: '1.0.0-quantum',
        location: 'Frankfurt, DE',
        latency: 67,
        uptime: 99.9,
        lastSeen: '2024-01-15T10:32:01Z',
        capabilities: ['dag', 'quantum', 'smart-contracts'],
        quantumReady: true
      }
    ]

    return NextResponse.json(peers)
  } catch (error) {
    console.error('Error fetching network peers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch network peers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { address, port, version = '1.0.0-quantum', location, capabilities = ['dag'] } = body

    // Simulate peer connection
    const newPeer: NetworkPeer = {
      id: `peer_${Date.now()}`,
      address,
      port,
      version,
      location: location || 'Unknown',
      latency: Math.floor(Math.random() * 200),
      uptime: 95 + Math.random() * 5,
      lastSeen: new Date().toISOString(),
      capabilities,
      quantumReady: capabilities.includes('quantum')
    }

    return NextResponse.json(newPeer, { status: 201 })
  } catch (error) {
    console.error('Error connecting to peer:', error)
    return NextResponse.json(
      { error: 'Failed to connect to peer' },
      { status: 500 }
    )
  }
}
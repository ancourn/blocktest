import { NextRequest, NextResponse } from 'next/server'

interface Transaction {
  id: string
  timestamp: string
  status: 'pending' | 'confirmed' | 'packed'
  instructions: number
  gasUsed: number
  sender: string
  receiver?: string
  amount?: number
  fee: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Simulate transaction data
    // In a real implementation, this would query the actual Cesium blockchain
    const transactions: Transaction[] = [
      {
        id: 'tx_001',
        timestamp: '2024-01-15 10:30:45',
        status: 'confirmed',
        instructions: 3,
        gasUsed: 21000,
        sender: '0x1234...5678',
        receiver: '0xabcd...efgh',
        amount: 1000,
        fee: 0.001
      },
      {
        id: 'tx_002',
        timestamp: '2024-01-15 10:31:12',
        status: 'pending',
        instructions: 1,
        gasUsed: 18000,
        sender: '0x9876...4321',
        fee: 0.0008
      },
      {
        id: 'tx_003',
        timestamp: '2024-01-15 10:31:28',
        status: 'packed',
        instructions: 2,
        gasUsed: 25000,
        sender: '0x5555...6666',
        receiver: '0x7777...8888',
        amount: 500,
        fee: 0.0012
      },
      {
        id: 'tx_004',
        timestamp: '2024-01-15 10:31:45',
        status: 'confirmed',
        instructions: 4,
        gasUsed: 32000,
        sender: '0x1111...2222',
        receiver: '0x3333...4444',
        amount: 2500,
        fee: 0.0015
      },
      {
        id: 'tx_005',
        timestamp: '2024-01-15 10:32:01',
        status: 'pending',
        instructions: 1,
        gasUsed: 18000,
        sender: '0x9999...0000',
        fee: 0.0008
      }
    ]

    // Apply pagination
    const paginatedTransactions = transactions.slice(offset, offset + limit)

    return NextResponse.json({
      transactions: paginatedTransactions,
      total: transactions.length,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sender, receiver, amount, instructions } = body

    // Validate required fields
    if (!sender || !instructions || !Array.isArray(instructions)) {
      return NextResponse.json(
        { error: 'Missing required fields: sender, instructions' },
        { status: 400 }
      )
    }

    // Simulate transaction creation
    // In a real implementation, this would interact with the actual Cesium blockchain
    const newTransaction = {
      id: `tx_${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'pending' as const,
      instructions: instructions.length,
      gasUsed: 18000 + (instructions.length * 5000),
      sender,
      receiver,
      amount,
      fee: 0.001
    }

    console.log('New transaction created:', newTransaction)

    return NextResponse.json({
      success: true,
      transaction: newTransaction,
      message: 'Transaction submitted successfully'
    })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}
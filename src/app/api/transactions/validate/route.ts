import { NextRequest, NextResponse } from 'next/server'

interface ValidationResult {
  isValid: boolean
  transactionId: string
  validationTime: number
  gasEstimate: number
  quantumSignature: {
    algorithm: string
    isValid: boolean
    securityLevel: number
  }
  errors: string[]
  warnings: string[]
  recommendations: string[]
}

interface TransactionData {
  from: string
  to: string
  amount: number
  data: string
  gasLimit: number
  quantumSignature: string
}

export async function GET(request: NextRequest) {
  try {
    // Simulate recent validation results
    const results: ValidationResult[] = [
      {
        isValid: true,
        transactionId: 'tx_001',
        validationTime: 45,
        gasEstimate: 21000,
        quantumSignature: {
          algorithm: 'ML-DSA',
          isValid: true,
          securityLevel: 256
        },
        errors: [],
        warnings: ['High gas price detected'],
        recommendations: ['Consider using lower gas price during off-peak hours']
      },
      {
        isValid: false,
        transactionId: 'tx_002',
        validationTime: 23,
        gasEstimate: 0,
        quantumSignature: {
          algorithm: 'SPHINCS+',
          isValid: false,
          securityLevel: 0
        },
        errors: ['Invalid quantum signature', 'Insufficient balance'],
        warnings: ['Signature verification failed'],
        recommendations: ['Check private key', 'Verify account balance']
      },
      {
        isValid: true,
        transactionId: 'tx_003',
        validationTime: 67,
        gasEstimate: 45000,
        quantumSignature: {
          algorithm: 'Falcon',
          isValid: true,
          securityLevel: 256
        },
        errors: [],
        warnings: [],
        recommendations: ['Transaction looks good']
      }
    ]

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error fetching validation results:', error)
    return NextResponse.json(
      { error: 'Failed to fetch validation results' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: TransactionData = await request.json()
    const { from, to, amount, data, gasLimit, quantumSignature } = body

    // Simulate transaction validation
    const startTime = Date.now()
    
    // Basic validation logic
    const errors: string[] = []
    const warnings: string[] = []
    const recommendations: string[] = []

    // Validate addresses
    if (!from || !to) {
      errors.push('Invalid address format')
    }

    // Validate amount
    if (amount <= 0) {
      errors.push('Amount must be positive')
    }

    // Validate gas limit
    if (gasLimit < 21000) {
      errors.push('Gas limit too low')
    }

    // Simulate quantum signature validation
    const signatureValid = quantumSignature && quantumSignature.length > 100
    const validationTime = Date.now() - startTime

    const result: ValidationResult = {
      isValid: errors.length === 0,
      transactionId: `tx_${Date.now()}`,
      validationTime,
      gasEstimate: errors.length === 0 ? 21000 + (data.length * 10) : 0,
      quantumSignature: {
        algorithm: 'ML-DSA',
        isValid: signatureValid,
        securityLevel: signatureValid ? 256 : 0
      },
      errors,
      warnings,
      recommendations
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Error validating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to validate transaction' },
      { status: 500 }
    )
  }
}
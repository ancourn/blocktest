'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Activity, Network, Shield, Zap, Database, TrendingUp, Cpu } from 'lucide-react'
import PerformanceScalingDashboard from '@/components/performance/performance-scaling-dashboard'
import { ReliabilityDashboard } from '@/components/reliability/reliability-dashboard'
import NetworkTestingDashboard from '@/components/network-testing/network-testing-dashboard'

interface BlockchainStatus {
  isRunning: boolean
  nodeCount: number
  transactionCount: number
  checkpointCount: number
  networkStatus: 'online' | 'offline' | 'syncing'
  quantumAlgorithms: string[]
}

interface Transaction {
  id: string
  timestamp: string
  status: 'pending' | 'confirmed' | 'packed'
  instructions: number
  gasUsed: number
}

export default function Home() {
  const [status, setStatus] = useState<BlockchainStatus>({
    isRunning: false,
    nodeCount: 0,
    transactionCount: 0,
    checkpointCount: 0,
    networkStatus: 'offline',
    quantumAlgorithms: ['ML-DSA', 'SPHINCS+', 'Falcon', 'Bulletproofs']
  })
  
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dagProgress, setDagProgress] = useState(0)

  useEffect(() => {
    // Simulate blockchain data loading
    const loadData = async () => {
      setIsLoading(true)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock data
      setStatus({
        isRunning: true,
        nodeCount: 1247,
        transactionCount: 3589,
        checkpointCount: 23,
        networkStatus: 'online',
        quantumAlgorithms: ['ML-DSA', 'SPHINCS+', 'Falcon', 'Bulletproofs']
      })
      
      setTransactions([
        { id: 'tx_001', timestamp: '2024-01-15 10:30:45', status: 'confirmed', instructions: 3, gasUsed: 21000 },
        { id: 'tx_002', timestamp: '2024-01-15 10:31:12', status: 'pending', instructions: 1, gasUsed: 18000 },
        { id: 'tx_003', timestamp: '2024-01-15 10:31:28', status: 'packed', instructions: 2, gasUsed: 25000 },
        { id: 'tx_004', timestamp: '2024-01-15 10:31:45', status: 'confirmed', instructions: 4, gasUsed: 32000 },
        { id: 'tx_005', timestamp: '2024-01-15 10:32:01', status: 'pending', instructions: 1, gasUsed: 18000 },
      ])
      
      setIsLoading(false)
    }
    
    loadData()
    
    // Simulate DAG progress
    const progressInterval = setInterval(() => {
      setDagProgress(prev => {
        if (prev >= 100) return 0
        return prev + Math.random() * 10
      })
    }, 3000)
    
    return () => clearInterval(progressInterval)
  }, [])

  const getStatusColor = (networkStatus: string) => {
    switch (networkStatus) {
      case 'online': return 'bg-green-500'
      case 'syncing': return 'bg-yellow-500'
      case 'offline': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getTransactionStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'packed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Cesium Quantum DAG Blockchain
          </h1>
          <p className="text-lg text-muted-foreground">
            Post-Quantum Secure Directed Acyclic Graph Network
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="quantum">Quantum Security</TabsTrigger>
            <TabsTrigger value="network">Network</TabsTrigger>
            <TabsTrigger value="performance">Performance Scaling</TabsTrigger>
            <TabsTrigger value="reliability">Reliability</TabsTrigger>
            <TabsTrigger value="network-testing">Network Testing</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Network Status</CardTitle>
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(status.networkStatus)}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold capitalize">{status.networkStatus}</div>
                  <p className="text-xs text-muted-foreground">
                    {status.isRunning ? 'Blockchain active' : 'Blockchain offline'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">DAG Nodes</CardTitle>
                  <Network className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{status.nodeCount.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Active nodes in DAG</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{status.transactionCount.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Total processed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Checkpoints</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{status.checkpointCount}</div>
                  <p className="text-xs text-muted-foreground">Packed checkpoints</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    DAG Processing Progress
                  </CardTitle>
                  <CardDescription>
                    Current batch processing status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Progress value={dagProgress} className="w-full" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Processing batch...</span>
                      <span>{Math.round(dagProgress)}%</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-semibold">2,500</div>
                        <div className="text-xs text-muted-foreground">Target nodes</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold">1,247</div>
                        <div className="text-xs text-muted-foreground">Current nodes</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold">5</div>
                        <div className="text-xs text-muted-foreground">Min confirmations</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Network Performance
                  </CardTitle>
                  <CardDescription>
                    Real-time network metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">TPS (Transactions per second)</span>
                      <span className="text-lg font-semibold">127.3</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average confirmation time</span>
                      <span className="text-lg font-semibold">2.3s</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Network latency</span>
                      <span className="text-lg font-semibold">45ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Packing efficiency</span>
                      <span className="text-lg font-semibold">94.2%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>
                  Latest transactions in the DAG network
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="font-mono text-sm">{tx.id}</div>
                          <div className="text-sm text-muted-foreground">{tx.timestamp}</div>
                          <Badge className={getTransactionStatusColor(tx.status)}>
                            {tx.status}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          <div>{tx.instructions} instructions</div>
                          <div>{tx.gasUsed.toLocaleString()} gas</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quantum" className="space-y-6">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                This blockchain uses post-quantum cryptographic algorithms that are resistant to attacks from quantum computers.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {status.quantumAlgorithms.map((algorithm) => (
                <Card key={algorithm}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      {algorithm}
                    </CardTitle>
                    <CardDescription>
                      Quantum-resistant cryptographic algorithm
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Security Level:</span>
                        <span className="font-semibold">256-bit</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Key Size:</span>
                        <span className="font-semibold">Variable</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quantum Security Features</CardTitle>
                <CardDescription>
                  Advanced security measures for the post-quantum era
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold">Cryptographic Protection</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        Lattice-based signatures
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        Hash-based signatures
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        Zero-knowledge proofs
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold">Network Security</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        Quantum-resistant key exchange
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        Post-quantum secure channels
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        Future-proof architecture
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="network" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Peers</CardTitle>
                  <CardDescription>Connected network nodes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">42</div>
                  <p className="text-sm text-muted-foreground">Active connections</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sync Status</CardTitle>
                  <CardDescription>Blockchain synchronization</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">100%</div>
                  <p className="text-sm text-muted-foreground">Fully synchronized</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Uptime</CardTitle>
                  <CardDescription>Network availability</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">99.9%</div>
                  <p className="text-sm text-muted-foreground">Last 30 days</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Network Topology</CardTitle>
                <CardDescription>
                  DAG structure visualization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Network className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Interactive DAG visualization would be rendered here
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <PerformanceScalingDashboard />
          </TabsContent>

          <TabsContent value="reliability" className="space-y-6">
            <ReliabilityDashboard />
          </TabsContent>

          <TabsContent value="network-testing" className="space-y-6">
            <NetworkTestingDashboard />
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            Connect to Quantum Network
          </Button>
        </div>
      </div>
    </div>
  )
}
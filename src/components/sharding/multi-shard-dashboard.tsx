'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Activity, 
  Network, 
  Zap, 
  Server, 
  Globe, 
  Cpu, 
  HardDrive, 
  Wifi,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2,
  RefreshCw
} from 'lucide-react'

interface ShardState {
  id: string
  status: 'active' | 'syncing' | 'offline' | 'error'
  currentTPS: number
  transactionCount: number
  lastCheckpoint: string
  nodeHealth: number
  crossShardRefs: number
}

interface CrossShardTransaction {
  id: string
  fromShard: string
  toShard: string
  data: any
  timestamp: string
  status: 'pending' | 'validated' | 'committed' | 'failed'
}

interface ShardMetrics {
  shardId: string
  throughput: number
  latency: number
  successRate: number
  validationTime: number
  crossShardCoordinationTime: number
  resourceUtilization: {
    cpu: number
    memory: number
    network: number
  }
}

interface OverallMetrics {
  totalTPS: number
  avgLatency: number
  avgSuccessRate: number
  activeShards: number
  crossShardTxCount: number
}

export default function MultiShardDashboard() {
  const [shardStates, setShardStates] = useState<ShardState[]>([])
  const [crossShardTransactions, setCrossShardTransactions] = useState<CrossShardTransaction[]>([])
  const [overallMetrics, setOverallMetrics] = useState<OverallMetrics>({
    totalTPS: 0,
    avgLatency: 0,
    avgSuccessRate: 0,
    activeShards: 0,
    crossShardTxCount: 0
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedShard, setSelectedShard] = useState<string>('')
  const [shardMetrics, setShardMetrics] = useState<ShardMetrics[]>([])
  const [benchmarkResults, setBenchmarkResults] = useState<any[]>([])
  const [isBenchmarkRunning, setIsBenchmarkRunning] = useState(false)

  // New shard form state
  const [newShard, setNewShard] = useState({
    id: '',
    region: 'US-East',
    nodeCount: 3,
    targetTPS: 1000,
    validationStrategy: 'independent' as const,
    consensusMechanism: 'dag' as const
  })

  useEffect(() => {
    fetchShardStates()
    fetchOverallMetrics()
    fetchCrossShardTransactions()
    
    const interval = setInterval(() => {
      if (isProcessing) {
        fetchShardStates()
        fetchOverallMetrics()
        fetchCrossShardTransactions()
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [isProcessing])

  useEffect(() => {
    if (selectedShard) {
      fetchShardMetrics(selectedShard)
    }
  }, [selectedShard, isProcessing])

  const fetchShardStates = async () => {
    try {
      const response = await fetch('/api/sharding/multi-shard?action=states')
      const data = await response.json()
      setShardStates(data.states || [])
    } catch (error) {
      console.error('Error fetching shard states:', error)
    }
  }

  const fetchOverallMetrics = async () => {
    try {
      const response = await fetch('/api/sharding/multi-shard?action=overall')
      const data = await response.json()
      setOverallMetrics(data)
    } catch (error) {
      console.error('Error fetching overall metrics:', error)
    }
  }

  const fetchCrossShardTransactions = async () => {
    try {
      const response = await fetch('/api/sharding/multi-shard?action=cross-shard')
      const data = await response.json()
      setCrossShardTransactions(data.transactions || [])
    } catch (error) {
      console.error('Error fetching cross-shard transactions:', error)
    }
  }

  const fetchShardMetrics = async (shardId: string) => {
    try {
      const response = await fetch(`/api/sharding/multi-shard?action=metrics&shardId=${shardId}`)
      const data = await response.json()
      setShardMetrics(data.metrics || [])
    } catch (error) {
      console.error('Error fetching shard metrics:', error)
    }
  }

  const startProcessing = async () => {
    try {
      const response = await fetch('/api/sharding/multi-shard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      })
      if (response.ok) {
        setIsProcessing(true)
      }
    } catch (error) {
      console.error('Error starting processing:', error)
    }
  }

  const stopProcessing = async () => {
    try {
      const response = await fetch('/api/sharding/multi-shard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' })
      })
      if (response.ok) {
        setIsProcessing(false)
      }
    } catch (error) {
      console.error('Error stopping processing:', error)
    }
  }

  const addShard = async () => {
    if (!newShard.id) return

    try {
      const response = await fetch('/api/sharding/multi-shard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-shard',
          shardConfig: newShard
        })
      })
      if (response.ok) {
        setNewShard({
          id: '',
          region: 'US-East',
          nodeCount: 3,
          targetTPS: 1000,
          validationStrategy: 'independent',
          consensusMechanism: 'dag'
        })
        fetchShardStates()
      }
    } catch (error) {
      console.error('Error adding shard:', error)
    }
  }

  const removeShard = async (shardId: string) => {
    try {
      const response = await fetch('/api/sharding/multi-shard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove-shard',
          shardId
        })
      })
      if (response.ok) {
        fetchShardStates()
      }
    } catch (error) {
      console.error('Error removing shard:', error)
    }
  }

  const runBenchmark = async () => {
    setIsBenchmarkRunning(true)
    setBenchmarkResults([])

    try {
      const response = await fetch('/api/sharding/multi-shard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'benchmark',
          duration: 30000,
          targetTPS: 50000,
          autoStop: true
        })
      })

      if (response.ok) {
        // Start collecting benchmark results
        const startTime = Date.now()
        const collectInterval = setInterval(async () => {
          const metrics = await fetchOverallMetrics()
          setBenchmarkResults(prev => [
            ...prev,
            {
              timestamp: new Date().toISOString(),
              ...metrics
            }
          ])
        }, 1000)

        // Stop collecting after 30 seconds
        setTimeout(() => {
          clearInterval(collectInterval)
          setIsBenchmarkRunning(false)
        }, 30000)
      }
    } catch (error) {
      console.error('Error running benchmark:', error)
      setIsBenchmarkRunning(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'syncing': return 'bg-yellow-500'
      case 'offline': return 'bg-red-500'
      case 'error': return 'bg-red-700'
      default: return 'bg-gray-500'
    }
  }

  const getTransactionStatusColor = (status: string) => {
    switch (status) {
      case 'committed': return 'bg-green-100 text-green-800'
      case 'validated': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Multi-Shard DAG Processing</h2>
          <p className="text-muted-foreground">Independent validation across multiple shards</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={isProcessing ? stopProcessing : startProcessing}
            className="flex items-center gap-2"
          >
            {isProcessing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isProcessing ? 'Stop Processing' : 'Start Processing'}
          </Button>
          <Button 
            onClick={runBenchmark}
            disabled={isBenchmarkRunning}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isBenchmarkRunning ? 'animate-spin' : ''}`} />
            {isBenchmarkRunning ? 'Running...' : 'Run Benchmark'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="shards">Shard Management</TabsTrigger>
          <TabsTrigger value="cross-shard">Cross-Shard</TabsTrigger>
          <TabsTrigger value="benchmark">Benchmark</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total TPS</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallMetrics.totalTPS.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Across {overallMetrics.activeShards} shards
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallMetrics.avgLatency.toFixed(1)}ms</div>
                <p className="text-xs text-muted-foreground">
                  Cross-shard coordination
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallMetrics.avgSuccessRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Validation success
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Shards</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallMetrics.activeShards}</div>
                <p className="text-xs text-muted-foreground">
                  Processing transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cross-Shard TXs</CardTitle>
                <Network className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallMetrics.crossShardTxCount}</div>
                <p className="text-xs text-muted-foreground">
                  Pending coordination
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Shard Performance
                </CardTitle>
                <CardDescription>
                  Real-time shard metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {shardStates.map((shard) => (
                    <div key={shard.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(shard.status)}`} />
                        <div>
                          <div className="font-medium">{shard.id}</div>
                          <div className="text-sm text-muted-foreground">{shard.transactionCount.toLocaleString()} txs</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{shard.currentTPS.toLocaleString()} TPS</div>
                        <div className="text-sm text-muted-foreground">{shard.nodeHealth.toFixed(0)}% health</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  System Status
                </CardTitle>
                <CardDescription>
                  Multi-shard processing status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Processing Status</span>
                    <Badge className={isProcessing ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {isProcessing ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Shards</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {shardStates.length}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cross-Shard Coordination</span>
                    <Badge className={overallMetrics.crossShardTxCount > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                      {overallMetrics.crossShardTxCount > 0 ? 'Active' : 'Idle'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Network Efficiency</span>
                    <Badge className="bg-green-100 text-green-800">
                      {(overallMetrics.avgSuccessRate / 100).toFixed(2)}%
                    </Badge>
                  </div>
                </div>

                {overallMetrics.avgLatency > 50 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      High cross-shard coordination latency detected. Consider optimizing shard placement.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="shards" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Shard
                </CardTitle>
                <CardDescription>
                  Configure a new shard for processing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shard-id">Shard ID</Label>
                  <Input
                    id="shard-id"
                    value={newShard.id}
                    onChange={(e) => setNewShard({...newShard, id: e.target.value})}
                    placeholder="shard-new"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Select value={newShard.region} onValueChange={(value) => setNewShard({...newShard, region: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US-East">US-East</SelectItem>
                      <SelectItem value="US-West">US-West</SelectItem>
                      <SelectItem value="EU-Central">EU-Central</SelectItem>
                      <SelectItem value="Asia-Pacific">Asia-Pacific</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="node-count">Node Count</Label>
                  <Input
                    id="node-count"
                    type="number"
                    value={newShard.nodeCount}
                    onChange={(e) => setNewShard({...newShard, nodeCount: parseInt(e.target.value)})}
                    min="1"
                    max="10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target-tps">Target TPS</Label>
                  <Input
                    id="target-tps"
                    type="number"
                    value={newShard.targetTPS}
                    onChange={(e) => setNewShard({...newShard, targetTPS: parseInt(e.target.value)})}
                    min="100"
                    max="10000"
                  />
                </div>

                <Button onClick={addShard} className="w-full">
                  Add Shard
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Active Shards
                </CardTitle>
                <CardDescription>
                  Manage existing shards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {shardStates.map((shard) => (
                    <div key={shard.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(shard.status)}`} />
                        <div>
                          <div className="font-medium">{shard.id}</div>
                          <div className="text-sm text-muted-foreground">{shard.transactionCount.toLocaleString()} txs</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="font-semibold">{shard.currentTPS.toLocaleString()} TPS</div>
                          <div className="text-sm text-muted-foreground">{shard.nodeHealth.toFixed(0)}% health</div>
                        </div>
                        <Button
                          onClick={() => removeShard(shard.id)}
                          variant="outline"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cross-shard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Cross-Shard Transactions
              </CardTitle>
              <CardDescription>
                Transactions spanning multiple shards
              </CardDescription>
            </CardHeader>
            <CardContent>
              {crossShardTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No cross-shard transactions found
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm font-medium">
                    <div>Transaction ID</div>
                    <div>From → To</div>
                    <div>Status</div>
                    <div>Data</div>
                    <div>Timestamp</div>
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {crossShardTransactions.map((tx) => (
                      <div key={tx.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm p-2 border rounded">
                        <div className="font-mono">{tx.id}</div>
                        <div>{tx.fromShard} → {tx.toShard}</div>
                        <div>
                          <Badge className={getTransactionStatusColor(tx.status)}>
                            {tx.status}
                          </Badge>
                        </div>
                        <div>{JSON.stringify(tx.data)}</div>
                        <div>{new Date(tx.timestamp).toLocaleTimeString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benchmark" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Benchmark Results
              </CardTitle>
              <CardDescription>
                Performance benchmarking data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {benchmarkResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No benchmark results available. Run a benchmark to see results.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm font-medium">
                    <div>Timestamp</div>
                    <div>Total TPS</div>
                    <div>Avg Latency</div>
                    <div>Success Rate</div>
                    <div>Active Shards</div>
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {benchmarkResults.map((result, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm p-2 border rounded">
                        <div>{new Date(result.timestamp).toLocaleTimeString()}</div>
                        <div className="font-medium">{result.totalTPS.toLocaleString()}</div>
                        <div>{result.avgLatency.toFixed(1)}ms</div>
                        <div>{result.avgSuccessRate.toFixed(1)}%</div>
                        <div>{result.activeShards}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
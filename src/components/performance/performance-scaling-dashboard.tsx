'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  CheckCircle
} from 'lucide-react'

interface NodeConfig {
  id: string
  region: string
  latency: number
  bandwidth: number
  cpuCores: number
  memory: number
  status: 'online' | 'offline' | 'syncing' | 'error'
}

interface BenchmarkResult {
  timestamp: string
  tps: number
  latency: number
  successRate: number
  nodeCount: number
  region: string
}

interface GeographyConfig {
  region: string
  latency: number
  packetLoss: number
  bandwidth: number
  nodes: number
}

const defaultGeographyConfigs: GeographyConfig[] = [
  { region: 'US-East', latency: 10, packetLoss: 0.1, bandwidth: 1000, nodes: 3 },
  { region: 'US-West', latency: 35, packetLoss: 0.2, bandwidth: 800, nodes: 3 },
  { region: 'EU-Central', latency: 25, packetLoss: 0.15, bandwidth: 900, nodes: 2 },
  { region: 'Asia-Pacific', latency: 80, packetLoss: 0.3, bandwidth: 600, nodes: 2 },
]

const tpsTargets = [1000, 10000, 30000, 75000]

export default function PerformanceScalingDashboard() {
  const [nodes, setNodes] = useState<NodeConfig[]>([])
  const [isBenchmarkRunning, setIsBenchmarkRunning] = useState(false)
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResult[]>([])
  const [currentTPS, setCurrentTPS] = useState(0)
  const [currentLatency, setCurrentLatency] = useState(0)
  const [currentSuccessRate, setCurrentSuccessRate] = useState(100)
  const [selectedGeography, setSelectedGeography] = useState<GeographyConfig[]>(defaultGeographyConfigs)
  const [targetTPS, setTargetTPS] = useState(1000)
  const [gpuAcceleration, setGpuAcceleration] = useState(false)
  const [shardCount, setShardCount] = useState(1)
  const [batchSize, setBatchSize] = useState(100)

  useEffect(() => {
    initializeNodes()
  }, [selectedGeography])

  const initializeNodes = () => {
    const newNodes: NodeConfig[] = []
    selectedGeography.forEach((config, regionIndex) => {
      for (let i = 0; i < config.nodes; i++) {
        newNodes.push({
          id: `node-${regionIndex}-${i}`,
          region: config.region,
          latency: config.latency + Math.random() * 10,
          bandwidth: config.bandwidth + Math.random() * 200,
          cpuCores: 8 + Math.floor(Math.random() * 8),
          memory: 16 + Math.floor(Math.random() * 16),
          status: 'online'
        })
      }
    })
    setNodes(newNodes)
  }

  const startBenchmark = async () => {
    setIsBenchmarkRunning(true)
    setCurrentTPS(0)
    setCurrentLatency(0)
    setCurrentSuccessRate(100)

    // Simulate benchmark progression
    const interval = setInterval(() => {
      setCurrentTPS(prev => {
        const newTPS = Math.min(prev + Math.random() * 500, targetTPS * (gpuAcceleration ? 1.5 : 1))
        return newTPS
      })
      
      setCurrentLatency(prev => {
        const baseLatency = selectedGeography.reduce((sum, config) => sum + config.latency, 0) / selectedGeography.length
        const newLatency = baseLatency + Math.random() * 20 + (shardCount > 1 ? -5 : 0)
        return Math.max(newLatency, 5)
      })
      
      setCurrentSuccessRate(prev => {
        const fluctuation = (Math.random() - 0.5) * 2
        const newRate = Math.max(95, Math.min(100, prev + fluctuation))
        return newRate
      })

      // Add benchmark result
      const result: BenchmarkResult = {
        timestamp: new Date().toISOString(),
        tps: currentTPS,
        latency: currentLatency,
        successRate: currentSuccessRate,
        nodeCount: nodes.length,
        region: 'Multi-Region'
      }
      
      setBenchmarkResults(prev => [...prev.slice(-19), result])
    }, 1000)

    // Stop after reaching target or timeout
    setTimeout(() => {
      clearInterval(interval)
      setIsBenchmarkRunning(false)
    }, 30000)
  }

  const stopBenchmark = () => {
    setIsBenchmarkRunning(false)
  }

  const resetBenchmark = () => {
    setBenchmarkResults([])
    setCurrentTPS(0)
    setCurrentLatency(0)
    setCurrentSuccessRate(100)
    setIsBenchmarkRunning(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'syncing': return 'bg-yellow-500'
      case 'offline': return 'bg-red-500'
      case 'error': return 'bg-red-700'
      default: return 'bg-gray-500'
    }
  }

  const getTPSStatus = (current: number, target: number) => {
    const percentage = (current / target) * 100
    if (percentage >= 90) return { color: 'text-green-600', status: 'Excellent' }
    if (percentage >= 70) return { color: 'text-yellow-600', status: 'Good' }
    if (percentage >= 50) return { color: 'text-orange-600', status: 'Fair' }
    return { color: 'text-red-600', status: 'Needs Improvement' }
  }

  const tpsStatus = getTPSStatus(currentTPS, targetTPS)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Scaling Dashboard</h2>
          <p className="text-muted-foreground">Multi-node benchmark with simulated geography</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={isBenchmarkRunning ? stopBenchmark : startBenchmark}
            disabled={nodes.length === 0}
            className="flex items-center gap-2"
          >
            {isBenchmarkRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isBenchmarkRunning ? 'Stop Benchmark' : 'Start Benchmark'}
          </Button>
          <Button onClick={resetBenchmark} variant="outline" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="nodes">Node Configuration</TabsTrigger>
          <TabsTrigger value="geography">Geography Simulation</TabsTrigger>
          <TabsTrigger value="results">Benchmark Results</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current TPS</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${tpsStatus.color}`}>
                  {Math.round(currentTPS).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Target: {targetTPS.toLocaleString()} TPS
                </p>
                <Progress value={(currentTPS / targetTPS) * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Latency</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentLatency.toFixed(1)}ms</div>
                <p className="text-xs text-muted-foreground">
                  Target: {'<'}100ms
                </p>
                <Badge className={currentLatency < 100 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {currentLatency < 100 ? 'Good' : 'High'}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentSuccessRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Target: {'>'}99%
                </p>
                <Badge className={currentSuccessRate >= 99 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {currentSuccessRate >= 99 ? 'Excellent' : 'Good'}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Nodes</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{nodes.length}</div>
                <p className="text-xs text-muted-foreground">
                  Across {selectedGeography.length} regions
                </p>
                <Badge className="bg-blue-100 text-blue-800">
                  Multi-Region
                </Badge>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Configuration
                </CardTitle>
                <CardDescription>
                  Configure scaling parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target TPS</label>
                  <Select value={targetTPS.toString()} onValueChange={(value) => setTargetTPS(Number(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tpsTargets.map(tps => (
                        <SelectItem key={tps} value={tps.toString()}>
                          {tps.toLocaleString()} TPS
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Shard Count</label>
                  <Select value={shardCount.toString()} onValueChange={(value) => setShardCount(Number(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Shard</SelectItem>
                      <SelectItem value="2">2 Shards</SelectItem>
                      <SelectItem value="4">4 Shards</SelectItem>
                      <SelectItem value="8">8 Shards</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Batch Size</label>
                  <Select value={batchSize.toString()} onValueChange={(value) => setBatchSize(Number(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">50 transactions</SelectItem>
                      <SelectItem value="100">100 transactions</SelectItem>
                      <SelectItem value="200">200 transactions</SelectItem>
                      <SelectItem value="500">500 transactions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="gpu-acceleration"
                    checked={gpuAcceleration}
                    onChange={(e) => setGpuAcceleration(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="gpu-acceleration" className="text-sm">
                    Enable GPU Acceleration
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  System Status
                </CardTitle>
                <CardDescription>
                  Current system health and warnings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">GPU Acceleration</span>
                    <Badge className={gpuAcceleration ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {gpuAcceleration ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Multi-Shard Processing</span>
                    <Badge className={shardCount > 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {shardCount > 1 ? `${shardCount} Shards` : 'Single Shard'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Transaction Batching</span>
                    <Badge className="bg-green-100 text-green-800">
                      {batchSize} tx/batch
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Network Simulation</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      Active
                    </Badge>
                  </div>
                </div>

                {currentLatency > 100 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      High latency detected. Consider adding more nodes or enabling GPU acceleration.
                    </AlertDescription>
                  </Alert>
                )}

                {currentSuccessRate < 99 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Success rate below target. Check network connectivity and node health.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="nodes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Node Configuration</CardTitle>
              <CardDescription>
                Individual node status and specifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nodes.map((node) => (
                  <Card key={node.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-mono text-sm">{node.id}</div>
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(node.status)}`} />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Region:</span>
                        <span className="font-medium">{node.region}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Latency:</span>
                        <span className="font-medium">{node.latency.toFixed(1)}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bandwidth:</span>
                        <span className="font-medium">{node.bandwidth.toFixed(0)} Mbps</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CPU Cores:</span>
                        <span className="font-medium">{node.cpuCores}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Memory:</span>
                        <span className="font-medium">{node.memory} GB</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geography" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Geography Simulation</CardTitle>
              <CardDescription>
                Configure network conditions for different regions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedGeography.map((config, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Globe className="h-5 w-5" />
                      <h3 className="font-semibold">{config.region}</h3>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>Latency:</span>
                        <span className="font-medium">{config.latency}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Packet Loss:</span>
                        <span className="font-medium">{config.packetLoss}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bandwidth:</span>
                        <span className="font-medium">{config.bandwidth} Mbps</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Nodes:</span>
                        <span className="font-medium">{config.nodes}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Benchmark Results</CardTitle>
              <CardDescription>
                Historical performance data and metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {benchmarkResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No benchmark results available. Run a benchmark to see results.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm font-medium">
                    <div>Timestamp</div>
                    <div>TPS</div>
                    <div>Latency</div>
                    <div>Success Rate</div>
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {benchmarkResults.map((result, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm p-2 border rounded">
                        <div>{new Date(result.timestamp).toLocaleTimeString()}</div>
                        <div className="font-medium">{Math.round(result.tps).toLocaleString()}</div>
                        <div>{result.latency.toFixed(1)}ms</div>
                        <div>{result.successRate.toFixed(1)}%</div>
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
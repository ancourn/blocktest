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
  Cpu, 
  HardDrive, 
  Zap, 
  Server, 
  Thermometer, 
  Power,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Shield
} from 'lucide-react'

interface GPUDevice {
  id: string
  name: string
  type: 'nvidia' | 'amd' | 'intel' | 'apple'
  computeCapability: number
  memory: number
  cores: number
  clockSpeed: number
  isAvailable: boolean
}

interface GPUMetrics {
  deviceId: string
  utilization: number
  memoryUsed: number
  temperature: number
  powerUsage: number
  activeKernels: number
  queuedTasks: number
  completedTasks: number
  failedTasks: number
}

interface QuantumCryptoOperation {
  id: string
  algorithm: 'ML-DSA' | 'SPHINCS+' | 'Falcon' | 'Kyber' | 'Dilithium'
  keySize: number
  operation: 'sign' | 'verify' | 'keygen' | 'encrypt' | 'decrypt'
  dataSize: number
  gpuAccelerated: boolean
  executionTime: number
}

interface BenchmarkResult {
  avgExecutionTime: number
  throughput: number
  successRate: number
  gpuSpeedup: number
}

export default function GPUAccelerationDashboard() {
  const [devices, setDevices] = useState<GPUDevice[]>([])
  const [metrics, setMetrics] = useState<Record<string, GPUMetrics[]>>({})
  const [overallMetrics, setOverallMetrics] = useState<any>({})
  const [quantumOperations, setQuantumOperations] = useState<Record<string, QuantumCryptoOperation[]>>({})
  const [isAccelerating, setIsAccelerating] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<string>('')
  const [benchmarkResults, setBenchmarkResults] = useState<Record<string, BenchmarkResult>>({})
  const [isBenchmarkRunning, setIsBenchmarkRunning] = useState(false)

  useEffect(() => {
    fetchDevices()
    fetchOverallMetrics()
    fetchQuantumOperations()
    
    const interval = setInterval(() => {
      if (isAccelerating) {
        fetchOverallMetrics()
        fetchQuantumOperations()
        if (selectedDevice) {
          fetchDeviceMetrics(selectedDevice)
        }
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [isAccelerating, selectedDevice])

  useEffect(() => {
    if (selectedDevice && isAccelerating) {
      fetchDeviceMetrics(selectedDevice)
    }
  }, [selectedDevice, isAccelerating])

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/gpu/accelerator?action=devices')
      const data = await response.json()
      setDevices(data.devices || [])
      if (data.devices && data.devices.length > 0 && !selectedDevice) {
        setSelectedDevice(data.devices[0].id)
      }
    } catch (error) {
      console.error('Error fetching devices:', error)
    }
  }

  const fetchDeviceMetrics = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/gpu/accelerator?action=metrics&deviceId=${deviceId}`)
      const data = await response.json()
      setMetrics(prev => ({ ...prev, [deviceId]: data.metrics || [] }))
    } catch (error) {
      console.error('Error fetching device metrics:', error)
    }
  }

  const fetchOverallMetrics = async () => {
    try {
      const response = await fetch('/api/gpu/accelerator?action=overall-metrics')
      const data = await response.json()
      setOverallMetrics(data)
    } catch (error) {
      console.error('Error fetching overall metrics:', error)
    }
  }

  const fetchQuantumOperations = async () => {
    try {
      const response = await fetch('/api/gpu/accelerator?action=quantum-operations')
      const data = await response.json()
      setQuantumOperations(data.operations || {})
    } catch (error) {
      console.error('Error fetching quantum operations:', error)
    }
  }

  const startAcceleration = async () => {
    try {
      const response = await fetch('/api/gpu/accelerator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      })
      if (response.ok) {
        setIsAccelerating(true)
      }
    } catch (error) {
      console.error('Error starting acceleration:', error)
    }
  }

  const stopAcceleration = async () => {
    try {
      const response = await fetch('/api/gpu/accelerator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' })
      })
      if (response.ok) {
        setIsAccelerating(false)
      }
    } catch (error) {
      console.error('Error stopping acceleration:', error)
    }
  }

  const runBenchmark = async (algorithm?: string) => {
    setIsBenchmarkRunning(true)
    
    try {
      if (algorithm) {
        // Single algorithm benchmark
        const response = await fetch('/api/gpu/accelerator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'benchmark',
            algorithm,
            operationCount: 100
          })
        })
        
        if (response.ok) {
          const result = await response.json()
          setBenchmarkResults(prev => ({ ...prev, [algorithm]: result }))
        }
      } else {
        // Comprehensive benchmark
        const response = await fetch('/api/gpu/accelerator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'comprehensive-benchmark',
            duration: 30000
          })
        })
        
        if (response.ok) {
          const result = await response.json()
          setBenchmarkResults(result.benchmarkResults)
        }
      }
    } catch (error) {
      console.error('Error running benchmark:', error)
    } finally {
      setIsBenchmarkRunning(false)
    }
  }

  const getDeviceTypeColor = (type: string) => {
    switch (type) {
      case 'nvidia': return 'bg-green-500'
      case 'amd': return 'bg-red-500'
      case 'intel': return 'bg-blue-500'
      case 'apple': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getAlgorithmColor = (algorithm: string) => {
    switch (algorithm) {
      case 'ML-DSA': return 'bg-purple-100 text-purple-800'
      case 'SPHINCS+': return 'bg-blue-100 text-blue-800'
      case 'Falcon': return 'bg-green-100 text-green-800'
      case 'Kyber': return 'bg-orange-100 text-orange-800'
      case 'Dilithium': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">GPU Acceleration Dashboard</h2>
          <p className="text-muted-foreground">Hardware acceleration for transaction validation & quantum-safe crypto</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={isAccelerating ? stopAcceleration : startAcceleration}
            className="flex items-center gap-2"
          >
            {isAccelerating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isAccelerating ? 'Stop Acceleration' : 'Start Acceleration'}
          </Button>
          <Button 
            onClick={() => runBenchmark()}
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
          <TabsTrigger value="devices">GPU Devices</TabsTrigger>
          <TabsTrigger value="quantum">Quantum Crypto</TabsTrigger>
          <TabsTrigger value="benchmark">Benchmarks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Throughput</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallMetrics.totalThroughput?.toFixed(0) || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Operations per second
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallMetrics.avgUtilization?.toFixed(1) || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  Across all GPUs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quantum Operations</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallMetrics.quantumCryptoOps || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Active operations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Temperature</CardTitle>
                <Thermometer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallMetrics.avgTemperature?.toFixed(1) || 0}°C</div>
                <p className="text-xs text-muted-foreground">
                  GPU temperature
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  GPU Devices Status
                </CardTitle>
                <CardDescription>
                  Available GPU devices and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {devices.map((device) => {
                    const deviceMetrics = metrics[device.id]
                    const latestMetrics = deviceMetrics && deviceMetrics.length > 0 ? deviceMetrics[deviceMetrics.length - 1] : null
                    
                    return (
                      <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getDeviceTypeColor(device.type)}`} />
                          <div>
                            <div className="font-medium">{device.name}</div>
                            <div className="text-sm text-muted-foreground">{device.memory}GB VRAM</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {latestMetrics ? `${latestMetrics.utilization.toFixed(1)}%` : '0%'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {latestMetrics ? `${latestMetrics.temperature.toFixed(1)}°C` : '--'}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  System Performance
                </CardTitle>
                <CardDescription>
                  GPU acceleration performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Acceleration Status</span>
                    <Badge className={isAccelerating ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {isAccelerating ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Tasks</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {overallMetrics.totalTasks || 0}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Success Rate</span>
                    <Badge className={overallMetrics.completedTasks && overallMetrics.totalTasks ? 
                      (overallMetrics.completedTasks / overallMetrics.totalTasks > 0.9 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800') : 
                      'bg-gray-100 text-gray-800'}>
                      {overallMetrics.totalTasks ? 
                        `${((overallMetrics.completedTasks / overallMetrics.totalTasks) * 100).toFixed(1)}%` : 
                        'N/A'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Memory Usage</span>
                    <Badge className="bg-purple-100 text-purple-800">
                      {overallMetrics.avgMemoryUsed?.toFixed(0) || 0} MB
                    </Badge>
                  </div>
                </div>

                {overallMetrics.avgTemperature && overallMetrics.avgTemperature > 80 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      High GPU temperature detected. Consider improving cooling or reducing workload.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Device Selection
                </CardTitle>
                <CardDescription>
                  Select a GPU device to view detailed metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a GPU device" />
                  </SelectTrigger>
                  <SelectContent>
                    {devices.map((device) => (
                      <SelectItem key={device.id} value={device.id}>
                        {device.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Device Metrics
                </CardTitle>
                <CardDescription>
                  Real-time performance metrics for selected device
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedDevice && metrics[selectedDevice] && metrics[selectedDevice].length > 0 ? (
                  <div className="space-y-4">
                    {metrics[selectedDevice].slice(-5).map((metric, index) => (
                      <div key={index} className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium">Utilization</div>
                          <div className="text-2xl font-bold">{metric.utilization.toFixed(1)}%</div>
                          <Progress value={metric.utilization} className="mt-1" />
                        </div>
                        <div>
                          <div className="font-medium">Memory</div>
                          <div className="text-2xl font-bold">{metric.memoryUsed.toFixed(0)} MB</div>
                          <div className="text-xs text-muted-foreground">
                            {metric.powerUsage.toFixed(0)}W
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No metrics available for selected device
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quantum" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Quantum Cryptographic Operations
              </CardTitle>
              <CardDescription>
                GPU-accelerated quantum-safe cryptographic operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(quantumOperations).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No quantum operations active
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(quantumOperations).map(([algorithm, operations]) => (
                    <div key={algorithm} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge className={getAlgorithmColor(algorithm)}>
                            {algorithm}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {operations.length} active operations
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="font-medium">Avg Execution Time</div>
                          <div className="text-lg">
                            {operations.length > 0 ? 
                              (operations.reduce((sum, op) => sum + op.executionTime, 0) / operations.length).toFixed(2) + 'ms' : 
                              'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">Key Size</div>
                          <div className="text-lg">
                            {operations.length > 0 ? operations[0].keySize + ' bits' : 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">GPU Accelerated</div>
                          <div className="text-lg">
                            {operations.length > 0 && operations[0].gpuAccelerated ? 'Yes' : 'No'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benchmark" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Benchmark Controls
                </CardTitle>
                <CardDescription>
                  Run performance benchmarks for quantum algorithms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={() => runBenchmark('ML-DSA')}
                    disabled={isBenchmarkRunning}
                    variant="outline"
                    size="sm"
                  >
                    Benchmark ML-DSA
                  </Button>
                  <Button 
                    onClick={() => runBenchmark('SPHINCS+')}
                    disabled={isBenchmarkRunning}
                    variant="outline"
                    size="sm"
                  >
                    Benchmark SPHINCS+
                  </Button>
                  <Button 
                    onClick={() => runBenchmark('Falcon')}
                    disabled={isBenchmarkRunning}
                    variant="outline"
                    size="sm"
                  >
                    Benchmark Falcon
                  </Button>
                  <Button 
                    onClick={() => runBenchmark()}
                    disabled={isBenchmarkRunning}
                    variant="outline"
                    size="sm"
                  >
                    Comprehensive
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Benchmark Results
                </CardTitle>
                <CardDescription>
                  Performance benchmark results
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(benchmarkResults).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No benchmark results available. Run a benchmark to see results.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(benchmarkResults).map(([algorithm, result]) => (
                      <div key={algorithm} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <Badge className={getAlgorithmColor(algorithm)}>
                            {algorithm}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {result.gpuSpeedup.toFixed(1)}x GPU speedup
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-medium">Avg Execution Time</div>
                            <div className="text-lg">{result.avgExecutionTime.toFixed(2)}ms</div>
                          </div>
                          <div>
                            <div className="font-medium">Throughput</div>
                            <div className="text-lg">{result.throughput.toFixed(0)} ops/s</div>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="font-medium">Success Rate</div>
                          <Progress value={result.successRate} className="mt-1" />
                          <div className="text-sm text-muted-foreground mt-1">
                            {result.successRate.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
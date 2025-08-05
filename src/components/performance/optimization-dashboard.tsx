'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Cpu, 
  HardDrive, 
  Network, 
  Shield,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity
} from 'lucide-react'

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

interface OptimizationStrategy {
  id: string
  name: string
  category: string
  priority: 'high' | 'medium' | 'low'
  estimated_tps_improvement: number
  implementation_complexity: string
  estimated_effort: string
  status: 'planned' | 'in_progress' | 'completed' | 'blocked'
  progress: number
  description: string
}

interface OptimizationPlan {
  current_performance: {
    tps: number
    latency_ms: number
    target_tps: number
    interim_target_tps: number
    progress_percentage: number
  }
  optimization_strategies: OptimizationStrategy[]
  implementation_timeline: Record<string, any>
  success_criteria: Record<string, any>
}

export default function PerformanceOptimizationDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [optimizationPlan, setOptimizationPlan] = useState<OptimizationPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedStrategy, setSelectedStrategy] = useState<OptimizationStrategy | null>(null)

  useEffect(() => {
    fetchMetrics()
    fetchOptimizationPlan()
  }, [])

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/performance/metrics')
      const data = await response.json()
      setMetrics(data)
    } catch (error) {
      console.error('Error fetching metrics:', error)
    }
  }

  const fetchOptimizationPlan = async () => {
    try {
      // In a real implementation, this would fetch from an API
      // For now, we'll use a mock implementation
      const mockPlan: OptimizationPlan = {
        current_performance: {
          tps: 127.3,
          latency_ms: 45,
          target_tps: 10000,
          interim_target_tps: 2000,
          progress_percentage: 1.27
        },
        optimization_strategies: [
          {
            id: 'opt_001',
            name: 'Parallel Processing Implementation',
            category: 'core_performance',
            priority: 'high',
            estimated_tps_improvement: 2000,
            implementation_complexity: 'medium',
            estimated_effort: '2 weeks',
            status: 'in_progress',
            progress: 60,
            description: 'Implement parallel transaction processing across multiple CPU cores'
          },
          {
            id: 'opt_002',
            name: 'DAG Traversal Optimization',
            category: 'algorithm_efficiency',
            priority: 'high',
            estimated_tps_improvement: 3000,
            implementation_complexity: 'high',
            estimated_effort: '3 weeks',
            status: 'planned',
            progress: 0,
            description: 'Optimize DAG traversal algorithms for better concurrency'
          },
          {
            id: 'opt_003',
            name: 'Memory Pooling Optimization',
            category: 'resource_management',
            priority: 'medium',
            estimated_tps_improvement: 1500,
            implementation_complexity: 'medium',
            estimated_effort: '2 weeks',
            status: 'planned',
            progress: 0,
            description: 'Implement memory pooling to reduce garbage collection overhead'
          }
        ],
        implementation_timeline: {},
        success_criteria: {
          interim_target: { tps: 2000, deadline: '3 weeks' },
          stretch_target: { tps: 4500, deadline: '8 weeks' }
        }
      }
      setOptimizationPlan(mockPlan)
    } catch (error) {
      console.error('Error fetching optimization plan:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'planned': return 'bg-gray-100 text-gray-800'
      case 'blocked': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTrendIcon = (current: number, target: number) => {
    if (current >= target) return <TrendingUp className="h-4 w-4 text-green-600" />
    return <TrendingDown className="h-4 w-4 text-red-600" />
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading performance data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Performance Optimization Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">
            Monitor and optimize blockchain performance toward TPS targets
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="metrics">Live Metrics</TabsTrigger>
            <TabsTrigger value="optimization">Optimization</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {optimizationPlan && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Current TPS</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(optimizationPlan.current_performance.tps)}</div>
                    <p className="text-xs text-muted-foreground">
                      Target: {formatNumber(optimizationPlan.current_performance.target_tps)}
                    </p>
                    <div className="mt-2">
                      <Progress value={optimizationPlan.current_performance.progress_percentage} className="w-full" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {optimizationPlan.current_performance.progress_percentage.toFixed(1)}% of target
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Interim Target</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(optimizationPlan.current_performance.interim_target_tps)}</div>
                    <p className="text-xs text-muted-foreground">
                      3-week milestone
                    </p>
                    <div className="flex items-center mt-2">
                      {getTrendIcon(optimizationPlan.current_performance.tps, optimizationPlan.current_performance.interim_target_tps)}
                      <span className="text-xs text-muted-foreground ml-2">
                        {optimizationPlan.current_performance.tps >= optimizationPlan.current_performance.interim_target_tps ? 'On track' : 'Needs improvement'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Optimizations</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {optimizationPlan.optimization_strategies.filter(s => s.status === 'in_progress').length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {optimizationPlan.optimization_strategies.filter(s => s.status === 'planned').length} planned
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Est. Improvement</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      +{formatNumber(optimizationPlan.optimization_strategies.reduce((sum, s) => sum + s.estimated_tps_improvement, 0))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total potential TPS gain
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {metrics && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>System Resources</CardTitle>
                    <CardDescription>
                      Current system resource utilization
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center">
                            <Cpu className="h-4 w-4 mr-2" />
                            CPU Usage
                          </span>
                          <span>{metrics.system.cpuUsage.toFixed(1)}%</span>
                        </div>
                        <Progress value={metrics.system.cpuUsage} className="w-full" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center">
                            <HardDrive className="h-4 w-4 mr-2" />
                            Memory Usage
                          </span>
                          <span>{metrics.system.memoryUsage.toFixed(1)}%</span>
                        </div>
                        <Progress value={metrics.system.memoryUsage} className="w-full" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center">
                            <Network className="h-4 w-4 mr-2" />
                            Network Bandwidth
                          </span>
                          <span>{metrics.network.bandwidth.toFixed(1)} MB/s</span>
                        </div>
                        <Progress value={(metrics.network.bandwidth / 100) * 100} className="w-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quantum Security Performance</CardTitle>
                    <CardDescription>
                      Quantum cryptographic algorithm performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm flex items-center">
                          <Shield className="h-4 w-4 mr-2" />
                          Signature Validation
                        </span>
                        <span className="font-semibold">{metrics.quantum.signatureValidationTime}ms</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm flex items-center">
                          <Shield className="h-4 w-4 mr-2" />
                          Key Exchange
                        </span>
                        <span className="font-semibold">{metrics.quantum.keyExchangeTime}ms</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm flex items-center">
                          <Shield className="h-4 w-4 mr-2" />
                          Encryption Overhead
                        </span>
                        <span className="font-semibold">{(metrics.quantum.encryptionOverhead * 100).toFixed(2)}%</span>
                      </div>
                      
                      <div className="pt-2 border-t">
                        <div className="flex justify-between text-sm">
                          <span>Security Score</span>
                          <Badge className="bg-green-100 text-green-800">
                            Excellent
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6">
            {metrics && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Transaction Performance</CardTitle>
                    <CardDescription>
                      Real-time transaction processing metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{formatNumber(metrics.tps)}</div>
                          <div className="text-sm text-muted-foreground">Current TPS</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{formatNumber(metrics.throughput.current)}</div>
                          <div className="text-sm text-muted-foreground">Throughput (MB/s)</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Avg Latency</span>
                          <span>{metrics.latency.avg}ms</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>P95 Latency</span>
                          <span>{metrics.latency.p95}ms</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>P99 Latency</span>
                          <span>{metrics.latency.p99}ms</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Network Health</CardTitle>
                    <CardDescription>
                      Network performance and connectivity metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{metrics.network.connectionCount}</div>
                          <div className="text-sm text-muted-foreground">Active Connections</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{metrics.network.packetLoss.toFixed(3)}%</div>
                          <div className="text-sm text-muted-foreground">Packet Loss</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Peak Throughput</span>
                          <span>{formatNumber(metrics.throughput.peak)} MB/s</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Avg Throughput</span>
                          <span>{formatNumber(metrics.throughput.average)} MB/s</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Network Efficiency</span>
                          <span>{((1 - metrics.network.packetLoss / 100) * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="optimization" className="space-y-6">
            {optimizationPlan && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Optimization Strategies</CardTitle>
                    <CardDescription>
                      Active and planned performance improvements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {optimizationPlan.optimization_strategies.map((strategy) => (
                        <div key={strategy.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{strategy.name}</h4>
                            <div className="flex space-x-2">
                              <Badge className={getPriorityColor(strategy.priority)}>
                                {strategy.priority}
                              </Badge>
                              <Badge className={getStatusColor(strategy.status)}>
                                {strategy.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">
                            {strategy.description}
                          </p>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Estimated TPS Improvement</span>
                              <span className="font-semibold">+{formatNumber(strategy.estimated_tps_improvement)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Effort</span>
                              <span>{strategy.estimated_effort}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>{strategy.progress}%</span>
                            </div>
                            <Progress value={strategy.progress} className="w-full" />
                          </div>
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-3 w-full"
                            onClick={() => setSelectedStrategy(strategy)}
                          >
                            View Details
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Optimization Progress</CardTitle>
                    <CardDescription>
                      Overall optimization program status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Total Strategies</span>
                          <span>{optimizationPlan.optimization_strategies.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>In Progress</span>
                          <span>{optimizationPlan.optimization_strategies.filter(s => s.status === 'in_progress').length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Completed</span>
                          <span>{optimizationPlan.optimization_strategies.filter(s => s.status === 'completed').length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Planned</span>
                          <span>{optimizationPlan.optimization_strategies.filter(s => s.status === 'planned').length}</span>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <h4 className="font-semibold mb-2">Success Criteria</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Interim Target (2,000 TPS)</span>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>3 weeks</span>
                            </div>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Stretch Target (4,500 TPS)</span>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>8 weeks</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <h4 className="font-semibold mb-2">Next Milestones</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                            <span>Complete parallel processing (Week 2)</span>
                          </div>
                          <div className="flex items-center">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                            <span>Reach interim TPS target (Week 3)</span>
                          </div>
                          <div className="flex items-center">
                            <Target className="h-4 w-4 text-blue-600 mr-2" />
                            <span>Complete DAG optimization (Week 4)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Implementation Timeline</CardTitle>
                <CardDescription>
                  8-week optimization roadmap with key milestones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[
                    { week: 1, title: "Parallel Processing Foundation", description: "Worker thread architecture and job queue", tps: 500 },
                    { week: 2, title: "Parallel Processing Completion", description: "Transaction batching and load balancing", tps: 1000 },
                    { week: 3, title: "DAG Traversal Optimization", description: "Lock-free algorithms and caching", tps: 2000 },
                    { week: 4, title: "Memory Pooling", description: "Object reuse and garbage collection optimization", tps: 2500 },
                    { week: 5, title: "Network Optimization", description: "Connection pooling and protocol optimization", tps: 3000 },
                    { week: 6, title: "Quantum Algorithm Optimization", description: "WebAssembly and hardware acceleration", tps: 3500 },
                    { week: 7, title: "Integration & Testing", description: "Comprehensive testing and benchmarking", tps: 4000 },
                    { week: 8, title: "Final Optimization", description: "Performance tuning and production readiness", tps: 4500 }
                  ].map((milestone) => (
                    <div key={milestone.week} className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600">{milestone.week}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{milestone.title}</h4>
                          <Badge variant="outline">
                            {formatNumber(milestone.tps)} TPS
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{milestone.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
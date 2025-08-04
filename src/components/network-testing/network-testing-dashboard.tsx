'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter
} from 'recharts';
import { 
  Activity, 
  Globe, 
  Server, 
  Network, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Play,
  Pause,
  RefreshCw,
  Download
} from 'lucide-react';

// Mock data for demonstration
const mockNetworkMetrics = {
  tps: [
    { time: '00:00', value: 1200 },
    { time: '00:05', value: 1450 },
    { time: '00:10', value: 1800 },
    { time: '00:15', value: 2100 },
    { time: '00:20', value: 1950 },
    { time: '00:25', value: 2200 },
    { time: '00:30', value: 2400 },
  ],
  latency: [
    { time: '00:00', value: 45 },
    { time: '00:05', value: 52 },
    { time: '00:10', value: 48 },
    { time: '00:15', value: 55 },
    { time: '00:20', value: 62 },
    { time: '00:25', value: 58 },
    { time: '00:30', value: 51 },
  ],
  availability: [
    { time: '00:00', value: 99.9 },
    { time: '00:05', value: 99.8 },
    { time: '00:10', value: 99.9 },
    { time: '00:15', value: 99.7 },
    { time: '00:20', value: 99.9 },
    { time: '00:25', value: 99.8 },
    { time: '00:30', value: 99.9 },
  ],
  regions: [
    { name: 'US East', nodes: 45, tps: 850, latency: 25, availability: 99.9 },
    { name: 'US West', nodes: 38, tps: 720, latency: 32, availability: 99.8 },
    { name: 'EU Central', nodes: 52, tps: 980, latency: 28, availability: 99.9 },
    { name: 'Asia SE', nodes: 28, tps: 420, latency: 65, availability: 99.7 },
    { name: 'Asia NE', nodes: 35, tps: 580, latency: 58, availability: 99.8 },
  ],
  nodeTypes: [
    { name: 'Validators', value: 150, color: '#8884d8' },
    { name: 'Miners', value: 200, color: '#82ca9d' },
    { name: 'Full Nodes', value: 100, color: '#ffc658' },
    { name: 'API Nodes', value: 30, color: '#ff7c7c' },
    { name: 'Archive Nodes', value: 20, color: '#8dd1e1' },
  ],
  activeTests: [
    { id: 'test-001', name: 'Cross-region Load Test', status: 'running', progress: 65, duration: '15:30' },
    { id: 'test-002', name: 'Failure Recovery Test', status: 'completed', progress: 100, duration: '08:45' },
    { id: 'test-003', name: 'Latency Spike Test', status: 'pending', progress: 0, duration: '20:00' },
  ],
  alerts: [
    { id: 'alert-001', type: 'warning', message: 'High latency detected in Asia SE region', timestamp: '2 minutes ago' },
    { id: 'alert-002', type: 'info', message: 'Node failure recovery completed in US West', timestamp: '5 minutes ago' },
    { id: 'alert-003', type: 'error', message: 'Consensus timeout detected', timestamp: '8 minutes ago' },
  ]
};

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

export default function NetworkTestingDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isLive, setIsLive] = useState(true);
  const [metrics, setMetrics] = useState(mockNetworkMetrics);

  useEffect(() => {
    if (isLive) {
      const interval = setInterval(() => {
        // Simulate real-time updates
        setMetrics(prev => ({
          ...prev,
          tps: prev.tps.map((point, index) => ({
            ...point,
            value: Math.max(1000, point.value + (Math.random() - 0.5) * 200)
          })),
          latency: prev.latency.map((point, index) => ({
            ...point,
            value: Math.max(20, Math.min(100, point.value + (Math.random() - 0.5) * 10))
          }))
        }));
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isLive]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge variant="default" className="bg-green-500">Running</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="destructive">Unknown</Badge>;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Network Testing Dashboard</h1>
          <p className="text-muted-foreground">Real-time monitoring and analytics for KALDRIX network testing</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant={isLive ? "default" : "outline"}
            onClick={() => setIsLive(!isLive)}
            className="flex items-center space-x-2"
          >
            {isLive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span>{isLive ? 'Pause' : 'Live'}</span>
          </Button>
          <Button variant="outline" className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
          <Button variant="outline" className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current TPS</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.tps[metrics.tps.length - 1]?.value.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              +12.5% from last hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.latency[metrics.latency.length - 1]?.value || '0'}ms
            </div>
            <p className="text-xs text-muted-foreground">
              -5.2% from last hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Availability</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.availability[metrics.availability.length - 1]?.value || '0'}%
            </div>
            <p className="text-xs text-muted-foreground">
              99.9% SLA maintained
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Nodes</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">505</div>
            <p className="text-xs text-muted-foreground">
              99.6% online
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>System alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {metrics.alerts.map((alert) => (
                <Alert key={alert.id} className={`border-l-4 ${
                  alert.type === 'error' ? 'border-l-red-500' :
                  alert.type === 'warning' ? 'border-l-yellow-500' :
                  'border-l-blue-500'
                }`}>
                  <div className="flex items-center space-x-2">
                    {getAlertIcon(alert.type)}
                    <AlertDescription className="flex-1">
                      <div className="flex items-center justify-between">
                        <span>{alert.message}</span>
                        <span className="text-xs text-muted-foreground">{alert.timestamp}</span>
                      </div>
                    </AlertDescription>
                  </div>
                </Alert>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Active Tests</CardTitle>
            <CardDescription>Currently running network tests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {metrics.activeTests.map((test) => (
              <div key={test.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{test.name}</span>
                  {getStatusBadge(test.status)}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{test.progress}%</span>
                  </div>
                  <Progress value={test.progress} className="h-2" />
                  <div className="text-xs text-muted-foreground">Duration: {test.duration}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="topology">Topology</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>TPS Over Time</CardTitle>
                <CardDescription>Transactions per second</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics.tps}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Latency Over Time</CardTitle>
                <CardDescription>Network latency in milliseconds</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics.latency}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Regional Performance</CardTitle>
                <CardDescription>Performance metrics by region</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.regions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="tps" fill="#8884d8" name="TPS" />
                    <Bar dataKey="latency" fill="#82ca9d" name="Latency (ms)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Node Distribution</CardTitle>
                <CardDescription>Network node types distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={metrics.nodeTypes}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {metrics.nodeTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Detailed performance analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Peak TPS</span>
                        <span className="font-medium">2,850</span>
                      </div>
                      <Progress value={95} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Avg Response Time</span>
                        <span className="font-medium">48ms</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Success Rate</span>
                        <span className="font-medium">99.2%</span>
                      </div>
                      <Progress value={99.2} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Throughput</span>
                        <span className="font-medium">8.5 GB/s</span>
                      </div>
                      <Progress value={78} className="h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resource Utilization</CardTitle>
                <CardDescription>System resource usage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">CPU Usage</span>
                      <span className="font-medium">67%</span>
                    </div>
                    <Progress value={67} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Memory Usage</span>
                      <span className="font-medium">72%</span>
                    </div>
                    <Progress value={72} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Network I/O</span>
                      <span className="font-medium">45%</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Storage I/O</span>
                      <span className="font-medium">38%</span>
                    </div>
                    <Progress value={38} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Latency Distribution</CardTitle>
                <CardDescription>Network latency percentiles</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { percentile: 'P50', latency: 45 },
                    { percentile: 'P75', latency: 58 },
                    { percentile: 'P90', latency: 72 },
                    { percentile: 'P95', latency: 85 },
                    { percentile: 'P99', latency: 120 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="percentile" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="latency" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Throughput Analysis</CardTitle>
                <CardDescription>Data transfer rates</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    { time: '00:00', upload: 2.1, download: 3.8 },
                    { time: '00:05', upload: 2.8, download: 4.2 },
                    { time: '00:10', upload: 3.2, download: 4.8 },
                    { time: '00:15', upload: 2.9, download: 4.5 },
                    { time: '00:20', upload: 3.5, download: 5.1 },
                    { time: '00:25', upload: 3.8, download: 5.5 },
                    { time: '00:30', upload: 4.2, download: 6.0 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="upload" stroke="#8884d8" name="Upload (GB/s)" />
                    <Line type="monotone" dataKey="download" stroke="#82ca9d" name="Download (GB/s)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="topology" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Network Topology</CardTitle>
                <CardDescription>Visual representation of network structure</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Network className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">Interactive Network Map</p>
                    <p className="text-sm text-muted-foreground">
                      Shows node connections and data flow
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Regional Connectivity</CardTitle>
                <CardDescription>Inter-region network connections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.regions.map((region) => (
                    <div key={region.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Globe className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="font-medium">{region.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {region.nodes} nodes
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-sm">
                          <span className="font-medium">{region.tps} TPS</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {region.latency}ms latency
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Node Health Status</CardTitle>
                <CardDescription>Real-time node health monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Healthy Nodes</span>
                    </div>
                    <span className="text-sm font-medium text-green-600">503</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium">Warning Nodes</span>
                    </div>
                    <span className="text-sm font-medium text-yellow-600">2</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium">Critical Nodes</span>
                    </div>
                    <span className="text-sm font-medium text-red-600">0</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Connection Quality</CardTitle>
                <CardDescription>Network connection quality metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={[
                    { latency: 25, bandwidth: 1000, reliability: 99.9 },
                    { latency: 32, bandwidth: 800, reliability: 99.8 },
                    { latency: 28, bandwidth: 1200, reliability: 99.9 },
                    { latency: 65, bandwidth: 600, reliability: 99.7 },
                    { latency: 58, bandwidth: 800, reliability: 99.8 },
                    { latency: 45, bandwidth: 900, reliability: 99.8 },
                    { latency: 38, bandwidth: 1100, reliability: 99.9 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="latency" name="Latency (ms)" />
                    <YAxis dataKey="bandwidth" name="Bandwidth (Mbps)" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter dataKey="bandwidth" fill="#8884d8" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
                <CardDescription>Recent test execution results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Cross-region Load Test</div>
                      <div className="text-sm text-muted-foreground">Completed 2 hours ago</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">Passed</div>
                      <div className="text-xs text-muted-foreground">98.5% success</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Failure Recovery Test</div>
                      <div className="text-sm text-muted-foreground">Completed 4 hours ago</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">Passed</div>
                      <div className="text-xs text-muted-foreground">Recovery: 12s</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Stress Test</div>
                      <div className="text-sm text-muted-foreground">Completed 6 hours ago</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-yellow-600">Warning</div>
                      <div className="text-xs text-muted-foreground">High latency</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test Configuration</CardTitle>
                <CardDescription>Available test scenarios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Play className="h-4 w-4 mr-2" />
                    Run Cross-region Benchmark
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Play className="h-4 w-4 mr-2" />
                    Execute Failure Simulation
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Play className="h-4 w-4 mr-2" />
                    Start Load Test
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Play className="h-4 w-4 mr-2" />
                    Launch Stress Test
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Benchmarks</CardTitle>
                <CardDescription>Current performance benchmarks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">2,850</div>
                      <div className="text-sm text-muted-foreground">Peak TPS</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">99.9%</div>
                      <div className="text-sm text-muted-foreground">Availability</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">45ms</div>
                      <div className="text-sm text-muted-foreground">Avg Latency</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">12s</div>
                      <div className="text-sm text-muted-foreground">Recovery Time</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test Schedule</CardTitle>
                <CardDescription>Upcoming and scheduled tests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Daily Health Check</div>
                      <div className="text-sm text-muted-foreground">Every 6 hours</div>
                    </div>
                    <Badge variant="outline">Scheduled</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Weekly Load Test</div>
                      <div className="text-sm text-muted-foreground">Sunday 2:00 AM</div>
                    </div>
                    <Badge variant="outline">Scheduled</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Monthly Stress Test</div>
                      <div className="text-sm text-muted-foreground">1st of month</div>
                    </div>
                    <Badge variant="outline">Scheduled</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Server, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Activity, 
  Zap,
  TrendingUp,
  Clock,
  Shield,
  Network,
  BarChart3
} from 'lucide-react';

interface NodeStatus {
  id: string;
  isHealthy: boolean;
  lastHeartbeat: Date;
  responseTime: number;
  consensusProgress: number;
  isActive: boolean;
}

interface ClusterStatus {
  totalNodes: number;
  activeNodes: number;
  healthyNodes: number;
  availability: number;
  nodes: NodeStatus[];
  consensusState: {
    currentHeight: number;
    targetHeight: number;
    syncProgress: number;
    lastBlockHash: string;
    validators: string[];
    quorumSize: number;
  };
}

interface AvailabilityMetrics {
  uptime: number;
  downtime: number;
  totalUptime: number;
  slaCompliance: boolean;
  currentStreak: number;
  longestStreak: number;
  incidents: Array<{
    id: string;
    startTime: Date;
    endTime?: Date;
    duration: number;
    severity: 'MINOR' | 'MAJOR' | 'CRITICAL';
    affectedNodes: string[];
    cause: string;
    resolved: boolean;
  }>;
}

interface SystemMetrics {
  overallAvailability: number;
  nodeCount: number;
  healthyNodes: number;
  averageResponseTime: number;
  averageErrorRate: number;
  consensusHealth: number;
  networkHealth: number;
  storageHealth: number;
}

interface AlertData {
  id: string;
  ruleName: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  timestamp: Date;
  message: string;
}

interface ReliabilityDashboardProps {
  className?: string;
}

export function ReliabilityDashboard({ className }: ReliabilityDashboardProps) {
  const [clusterStatus, setClusterStatus] = useState<ClusterStatus | null>(null);
  const [availabilityMetrics, setAvailabilityMetrics] = useState<AvailabilityMetrics | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<AlertData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Simulate real-time data updates
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simulate API calls to get reliability data
        const mockClusterStatus: ClusterStatus = {
          totalNodes: 7,
          activeNodes: 6,
          healthyNodes: 6,
          availability: 99.985,
          nodes: Array.from({ length: 7 }, (_, i) => ({
            id: `node-${i + 1}`,
            isHealthy: i !== 2, // Node 3 is unhealthy
            lastHeartbeat: new Date(Date.now() - Math.random() * 60000),
            responseTime: Math.random() * 200 + 50,
            consensusProgress: i !== 2 ? 100 : 85,
            isActive: i !== 2
          })),
          consensusState: {
            currentHeight: 15420,
            targetHeight: 15420,
            syncProgress: 100,
            lastBlockHash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890',
            validators: ['node-1', 'node-3', 'node-4', 'node-5', 'node-6'],
            quorumSize: 4
          }
        };

        const mockAvailabilityMetrics: AvailabilityMetrics = {
          uptime: 99.985,
          downtime: 1260, // 21 minutes in seconds
          totalUptime: 8640000, // 100 days in seconds
          slaCompliance: true,
          currentStreak: 259200, // 3 days in seconds
          longestStreak: 604800, // 7 days in seconds
          incidents: [
            {
              id: 'incident-001',
              startTime: new Date(Date.now() - 3600000), // 1 hour ago
              duration: 1800, // 30 minutes
              severity: 'MAJOR',
              affectedNodes: ['node-3'],
              cause: 'Network connectivity issues',
              resolved: true
            }
          ]
        };

        const mockSystemMetrics: SystemMetrics = {
          overallAvailability: 99.985,
          nodeCount: 7,
          healthyNodes: 6,
          averageResponseTime: 156,
          averageErrorRate: 0.12,
          consensusHealth: 98.5,
          networkHealth: 96.2,
          storageHealth: 99.1
        };

        const mockAlerts: AlertData[] = [
          {
            id: 'alert-001',
            ruleName: 'Node Failure Detected',
            severity: 'ERROR',
            timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
            message: 'Node-3 has been unresponsive for more than 5 minutes'
          },
          {
            id: 'alert-002',
            ruleName: 'High Response Time',
            severity: 'WARNING',
            timestamp: new Date(Date.now() - 900000), // 15 minutes ago
            message: 'Average response time is above threshold: 180ms'
          }
        ];

        setClusterStatus(mockClusterStatus);
        setAvailabilityMetrics(mockAvailabilityMetrics);
        setSystemMetrics(mockSystemMetrics);
        setActiveAlerts(mockAlerts);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error fetching reliability data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString();
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'CRITICAL': return 'destructive';
      case 'ERROR': return 'destructive';
      case 'WARNING': return 'secondary';
      case 'INFO': return 'default';
      default: return 'default';
    }
  };

  const getNodeHealthColor = (node: NodeStatus): string => {
    if (!node.isActive) return 'destructive';
    if (!node.isHealthy) return 'secondary';
    if (node.consensusProgress < 90) return 'secondary';
    return 'default';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading reliability metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reliability & Availability</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of system reliability and failover mechanisms
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Last updated: {formatTimestamp(lastUpdate)}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Availability</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {availabilityMetrics?.uptime.toFixed(3)}%
            </div>
            <p className="text-xs text-muted-foreground">
              SLA Target: 99.99%
            </p>
            {availabilityMetrics?.slaCompliance ? (
              <CheckCircle className="h-4 w-4 text-green-500 mt-2" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500 mt-2" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Nodes</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clusterStatus?.activeNodes}/{clusterStatus?.totalNodes}
            </div>
            <p className="text-xs text-muted-foreground">
              {clusterStatus?.healthyNodes} healthy
            </p>
            <Progress 
              value={(clusterStatus?.activeNodes || 0) / (clusterStatus?.totalNodes || 1) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consensus Health</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemMetrics?.consensusHealth.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Block height: {clusterStatus?.consensusState.currentHeight.toLocaleString()}
            </p>
            <Progress 
              value={systemMetrics?.consensusHealth || 0} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemMetrics?.averageResponseTime.toFixed(0)}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Error rate: {systemMetrics?.averageErrorRate.toFixed(2)}%
            </p>
            <TrendingUp className="h-4 w-4 text-green-500 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Active Alerts</h2>
          {activeAlerts.map((alert) => (
            <Alert key={alert.id}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="flex items-center justify-between">
                <span>{alert.ruleName}</span>
                <Badge variant={getSeverityColor(alert.severity)}>
                  {alert.severity}
                </Badge>
              </AlertTitle>
              <AlertDescription>
                {alert.message}
                <div className="text-xs text-muted-foreground mt-1">
                  {formatTimestamp(alert.timestamp)}
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Detailed Tabs */}
      <Tabs defaultValue="nodes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="nodes">Node Status</TabsTrigger>
          <TabsTrigger value="consensus">Consensus</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
        </TabsList>

        <TabsContent value="nodes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Node Health Status</CardTitle>
              <CardDescription>
                Real-time health monitoring of all cluster nodes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clusterStatus?.nodes.map((node) => (
                  <div key={node.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Badge variant={getNodeHealthColor(node)}>
                        {node.isActive ? (node.isHealthy ? 'Healthy' : 'Degraded') : 'Offline'}
                      </Badge>
                      <div>
                        <div className="font-medium">{node.id}</div>
                        <div className="text-sm text-muted-foreground">
                          Last seen: {formatTimestamp(node.lastHeartbeat)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className="text-sm font-medium">{node.responseTime.toFixed(0)}ms</div>
                        <div className="text-xs text-muted-foreground">Response Time</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{node.consensusProgress.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">Consensus</div>
                      </div>
                      <div className="w-16">
                        <Progress value={node.consensusProgress} className="h-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consensus" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Consensus Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Current Height:</span>
                  <span className="font-mono">
                    {clusterStatus?.consensusState.currentHeight.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Target Height:</span>
                  <span className="font-mono">
                    {clusterStatus?.consensusState.targetHeight.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Sync Progress:</span>
                  <span>{clusterStatus?.consensusState.syncProgress.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Validators:</span>
                  <span>{clusterStatus?.consensusState.validators.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Quorum Size:</span>
                  <span>{clusterStatus?.consensusState.quorumSize}</span>
                </div>
                <Progress value={clusterStatus?.consensusState.syncProgress || 0} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Network Health:</span>
                    <span>{systemMetrics?.networkHealth.toFixed(1)}%</span>
                  </div>
                  <Progress value={systemMetrics?.networkHealth || 0} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Storage Health:</span>
                    <span>{systemMetrics?.storageHealth.toFixed(1)}%</span>
                  </div>
                  <Progress value={systemMetrics?.storageHealth || 0} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Error Rate:</span>
                    <span>{systemMetrics?.averageErrorRate.toFixed(2)}%</span>
                  </div>
                  <Progress value={100 - (systemMetrics?.averageErrorRate || 0)} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="availability" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Availability Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Current Uptime:</span>
                  <span className="font-mono">{availabilityMetrics?.uptime.toFixed(3)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Downtime:</span>
                  <span>{formatUptime(availabilityMetrics?.downtime || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Streak:</span>
                  <span>{formatUptime(availabilityMetrics?.currentStreak || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Longest Streak:</span>
                  <span>{formatUptime(availabilityMetrics?.longestStreak || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SLA Compliance:</span>
                  {availabilityMetrics?.slaCompliance ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Avg Response Time:</span>
                  <span>{systemMetrics?.averageResponseTime.toFixed(0)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Error Rate:</span>
                  <span>{systemMetrics?.averageErrorRate.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Healthy Nodes:</span>
                  <span>{systemMetrics?.healthyNodes}/{systemMetrics?.nodeCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Overall Health:</span>
                  <span>{systemMetrics?.overallAvailability.toFixed(3)}%</span>
                </div>
                <Progress value={systemMetrics?.overallAvailability || 0} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Incident History</CardTitle>
              <CardDescription>
                Recent system incidents and their resolution status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {availabilityMetrics?.incidents.map((incident) => (
                  <div key={incident.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Badge variant={incident.resolved ? 'default' : 'destructive'}>
                        {incident.resolved ? 'Resolved' : 'Active'}
                      </Badge>
                      <div>
                        <div className="font-medium">{incident.cause}</div>
                        <div className="text-sm text-muted-foreground">
                          Affected nodes: {incident.affectedNodes.join(', ')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Duration: {formatUptime(incident.duration)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={incident.severity === 'CRITICAL' ? 'destructive' : 'secondary'}>
                        {incident.severity}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatTimestamp(incident.startTime)}
                      </div>
                    </div>
                  </div>
                ))}
                {(!availabilityMetrics?.incidents || availabilityMetrics.incidents.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>No incidents reported</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
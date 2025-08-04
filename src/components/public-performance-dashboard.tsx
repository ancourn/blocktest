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
  Download,
  Users,
  Award,
  Gift,
  ExternalLink
} from 'lucide-react';

// Real-time metrics data structure
interface NetworkMetrics {
  tps: Array<{ time: string; value: number }>;
  latency: Array<{ time: string; value: number }>;
  availability: Array<{ time: string; value: number }>;
  regions: Array<{
    name: string;
    nodes: number;
    tps: number;
    latency: number;
    availability: number;
  }>;
  nodeTypes: Array<{ name: string; value: number; color: string }>;
  staking: {
    totalStaked: number;
    participants: number;
    apy: number;
    rewards24h: number;
  };
  governance: {
    activeProposals: number;
    votingPower: number;
    participation: number;
  };
  incentives: {
    totalRewards: number;
    participants: number;
    leaderboard: Array<{
      rank: number;
      address: string;
      rewards: number;
      transactions: number;
    }>;
  };
  alerts: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
  }>;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

export default function PublicPerformanceDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isLive, setIsLive] = useState(true);
  const [metrics, setMetrics] = useState<NetworkMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize with mock data
    const initialMetrics: NetworkMetrics = {
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
      staking: {
        totalStaked: 2500000,
        participants: 485,
        apy: 5.2,
        rewards24h: 3560,
      },
      governance: {
        activeProposals: 3,
        votingPower: 78,
        participation: 65,
      },
      incentives: {
        totalRewards: 15000,
        participants: 89,
        leaderboard: [
          { rank: 1, address: '0x1234...5678', rewards: 1250, transactions: 89 },
          { rank: 2, address: '0xabcd...efgh', rewards: 980, transactions: 76 },
          { rank: 3, address: '0x9876...5432', rewards: 750, transactions: 65 },
          { rank: 4, address: '0xfedc...ba98', rewards: 620, transactions: 58 },
          { rank: 5, address: '0x1357...2468', rewards: 450, transactions: 42 },
        ],
      },
      alerts: [
        { id: 'alert-001', type: 'info', message: 'New node joined from EU Central', timestamp: '2 minutes ago' },
        { id: 'alert-002', type: 'success', message: 'Staking rewards distributed', timestamp: '5 minutes ago' },
        { id: 'alert-003', type: 'info', message: 'Network performance optimized', timestamp: '8 minutes ago' },
      ],
    };

    setMetrics(initialMetrics);
    setLoading(false);

    if (isLive) {
      const interval = setInterval(() => {
        setMetrics(prev => {
          if (!prev) return initialMetrics;
          
          return {
            ...prev,
            tps: prev.tps.map((point, index) => ({
              ...point,
              value: Math.max(1000, point.value + (Math.random() - 0.5) * 200)
            })),
            latency: prev.latency.map((point, index) => ({
              ...point,
              value: Math.max(20, Math.min(100, point.value + (Math.random() - 0.5) * 10))
            })),
            staking: {
              ...prev.staking,
              totalStaked: prev.staking.totalStaked + Math.floor(Math.random() * 1000),
              participants: prev.staking.participants + Math.floor(Math.random() * 3),
              rewards24h: prev.staking.rewards24h + Math.floor(Math.random() * 10),
            },
            incentives: {
              ...prev.incentives,
              totalRewards: prev.incentives.totalRewards + Math.floor(Math.random() * 5),
              participants: prev.incentives.participants + Math.floor(Math.random() * 2),
            },
          };
        });
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
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'info':
        return <Activity className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  if (loading || !metrics) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading KALDRIX Performance Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with Join Testnet CTA */}
      <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
        <div className="text-center lg:text-left">
          <h1 className="text-3xl font-bold">KALDRIX Performance Dashboard</h1>
          <p className="text-muted-foreground">Real-time testnet metrics and network performance</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <Button 
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            onClick={() => window.open('https://github.com/ancourn/blocktest/tree/main/public-node-kit', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Join Testnet
          </Button>
          <Button
            variant={isLive ? "default" : "outline"}
            onClick={() => setIsLive(!isLive)}
            className="flex items-center space-x-2"
          >
            {isLive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span>{isLive ? 'Pause' : 'Live'}</span>
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
              Target: 75,000 TPS
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Nodes</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.regions.reduce((sum, region) => sum + region.nodes, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.regions.reduce((sum, region) => sum + region.nodes, 0) > 500 ? 'Network healthy' : 'Growing network'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staking APY</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.staking.apy}%
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.staking.participants} participants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Rewards</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.incentives.totalRewards.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.incentives.participants} participants
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="staking">Staking</TabsTrigger>
          <TabsTrigger value="incentives">Incentives</TabsTrigger>
          <TabsTrigger value="governance">Governance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>TPS Over Time</CardTitle>
                <CardDescription>Transactions per second (live)</CardDescription>
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
                <CardTitle>Network Latency</CardTitle>
                <CardDescription>Average transaction confirmation time</CardDescription>
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
                <CardDescription>Nodes and TPS by region</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.regions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="nodes" fill="#8884d8" name="Nodes" />
                    <Bar dataKey="tps" fill="#82ca9d" name="TPS" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Node Distribution</CardTitle>
                <CardDescription>Network node types</CardDescription>
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

        <TabsContent value="staking" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Staking Overview</CardTitle>
                <CardDescription>Network staking metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Staked</span>
                      <span className="font-medium">{(metrics.staking.totalStaked / 1000000).toFixed(1)}M KALD</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Participants</span>
                      <span className="font-medium">{metrics.staking.participants}</span>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Current APY</span>
                      <span className="font-medium">{metrics.staking.apy}%</span>
                    </div>
                    <Progress value={metrics.staking.apy * 20} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">24h Rewards</span>
                      <span className="font-medium">{metrics.staking.rewards24h.toLocaleString()} KALD</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Staking Rewards</CardTitle>
                <CardDescription>Daily reward distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {metrics.staking.rewards24h.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">KALD distributed in last 24h</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Validator Rewards</span>
                      <span>{(metrics.staking.rewards24h * 0.6).toFixed(0)} KALD</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Delegator Rewards</span>
                      <span>{(metrics.staking.rewards24h * 0.4).toFixed(0)} KALD</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="incentives" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Incentive Program</CardTitle>
                <CardDescription>Testnet rewards and participation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Rewards</span>
                      <span className="font-medium">{metrics.incentives.totalRewards.toLocaleString()}</span>
                    </div>
                    <Progress value={80} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Participants</span>
                      <span className="font-medium">{metrics.incentives.participants}</span>
                    </div>
                    <Progress value={70} className="h-2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Reward Programs</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>First 100 Transactions</span>
                      <Badge variant="outline">100 KALD each</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Referral Program</span>
                      <Badge variant="outline">50 KALD per referral</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Uptime Rewards</span>
                      <Badge variant="outline">10 KALD/day</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Leaderboard</CardTitle>
                <CardDescription>Top performers this week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.incentives.leaderboard.map((participant, index) => (
                    <div key={participant.rank} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs text-primary-foreground">
                          {participant.rank}
                        </div>
                        <span className="font-mono text-sm">{participant.address}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{participant.rewards} KALD</div>
                        <div className="text-xs text-muted-foreground">{participant.transactions} tx</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="governance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Governance Overview</CardTitle>
                <CardDescription>Network governance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Active Proposals</span>
                      <span className="font-medium">{metrics.governance.activeProposals}</span>
                    </div>
                    <Progress value={60} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Voting Power</span>
                      <span className="font-medium">{metrics.governance.votingPower}%</span>
                    </div>
                    <Progress value={metrics.governance.votingPower} className="h-2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Participation Rate</span>
                    <span className="font-medium">{metrics.governance.participation}%</span>
                  </div>
                  <Progress value={metrics.governance.participation} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest network events</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {metrics.alerts.map((alert) => (
                  <Alert key={alert.id} className={`border-l-4 ${
                    alert.type === 'error' ? 'border-l-red-500' :
                    alert.type === 'warning' ? 'border-l-yellow-500' :
                    alert.type === 'success' ? 'border-l-green-500' :
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
        </TabsContent>
      </Tabs>

      {/* Footer with CTA */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-bold">Ready to Join the KALDRIX Testnet?</h3>
            <p className="text-muted-foreground">
              Be part of the future of blockchain technology. Run a node, earn rewards, and help shape the network.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                onClick={() => window.open('https://github.com/ancourn/blocktest/tree/main/public-node-kit', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Download Node Kit
              </Button>
              <Button 
                variant="outline"
                size="lg"
                onClick={() => window.open('/public-reports/validation-report.html', '_blank')}
              >
                <Download className="h-4 w-4 mr-2" />
                View Validation Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
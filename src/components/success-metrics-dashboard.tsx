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
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award, 
  Users, 
  Activity, 
  DollarSign,
  Zap,
  Globe,
  Star,
  Download,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

interface GoalProgress {
  goal: string;
  target: number;
  current: number;
  unit: string;
  progress: number;
  status: 'behind' | 'on-track' | 'ahead' | 'completed';
  timeframe: string;
  lastUpdated: Date;
}

interface PerformanceReport {
  summary: {
    overallHealth: number;
    networkScore: number;
    performanceScore: number;
    economicScore: number;
    communityScore: number;
  };
  achievements: string[];
  recommendations: string[];
  trends: {
    nodeGrowth: number;
    tpsGrowth: number;
    communityGrowth: number;
    stakingGrowth: number;
  };
}

// Mock data for demonstration
const mockGoals: GoalProgress[] = [
  {
    goal: 'Total Nodes',
    target: 1000,
    current: 505,
    unit: 'nodes',
    progress: 50.5,
    status: 'on-track',
    timeframe: 'Q1 2025',
    lastUpdated: new Date()
  },
  {
    goal: 'Network Uptime',
    target: 99.99,
    current: 99.85,
    unit: '%',
    progress: 99.86,
    status: 'ahead',
    timeframe: 'Ongoing',
    lastUpdated: new Date()
  },
  {
    goal: 'Peak TPS',
    target: 75000,
    current: 78450,
    unit: 'TPS',
    progress: 104.6,
    status: 'completed',
    timeframe: 'Mainnet',
    lastUpdated: new Date()
  },
  {
    goal: 'Total Staked',
    target: 10000000,
    current: 2500000,
    unit: 'KALD',
    progress: 25,
    status: 'behind',
    timeframe: 'Q1 2025',
    lastUpdated: new Date()
  },
  {
    goal: 'Discord Members',
    target: 5000,
    current: 1250,
    unit: 'members',
    progress: 25,
    status: 'behind',
    timeframe: 'Q1 2025',
    lastUpdated: new Date()
  },
  {
    goal: 'Staking Participants',
    target: 500,
    current: 485,
    unit: 'participants',
    progress: 97,
    status: 'ahead',
    timeframe: 'Q1 2025',
    lastUpdated: new Date()
  }
];

const mockReport: PerformanceReport = {
  summary: {
    overallHealth: 78,
    networkScore: 96,
    performanceScore: 85,
    economicScore: 65,
    communityScore: 66
  },
  achievements: [
    '🎉 500+ Nodes Milestone',
    '🚀 75K+ TPS Achieved',
    '💰 400+ Stakers',
    '👥 1K+ Community Members'
  ],
  recommendations: [
    'Focus on improving staking participation and incentives',
    'Boost community engagement and growth initiatives',
    'Continue optimizing network performance and reliability',
    'Expand geographic distribution of nodes'
  ],
  trends: {
    nodeGrowth: 5.2,
    tpsGrowth: 12.5,
    communityGrowth: 8.7,
    stakingGrowth: 15.3
  }
};

const metricsHistory = [
  { time: '00:00', nodes: 480, tps: 2200, staked: 2400000, community: 1200 },
  { time: '04:00', nodes: 485, tps: 2350, staked: 2420000, community: 1210 },
  { time: '08:00', nodes: 490, tps: 2450, staked: 2440000, community: 1225 },
  { time: '12:00', nodes: 495, tps: 2600, staked: 2460000, community: 1235 },
  { time: '16:00', nodes: 500, tps: 2550, staked: 2480000, community: 1245 },
  { time: '20:00', nodes: 505, tps: 2400, staked: 2500000, community: 1250 }
];

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

export default function SuccessMetricsDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isLive, setIsLive] = useState(true);
  const [goals, setGoals] = useState<GoalProgress[]>(mockGoals);
  const [report, setReport] = useState<PerformanceReport>(mockReport);
  const [loading, setLoading] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'ahead':
        return <Badge className="bg-blue-500">Ahead</Badge>;
      case 'on-track':
        return <Badge className="bg-yellow-500">On Track</Badge>;
      case 'behind':
        return <Badge variant="destructive">Behind</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'ahead':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'on-track':
        return <Target className="h-4 w-4 text-yellow-500" />;
      case 'behind':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const refreshData = async () => {
    setLoading(true);
    // Simulate data refresh
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const exportData = (format: 'csv' | 'json') => {
    // Simulate data export
    const data = {
      goals,
      report,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kaldrix-metrics-${new Date().toISOString().split('T')[0]}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Success Metrics Dashboard</h1>
          <p className="text-muted-foreground">Track KALDRIX testnet performance and goals</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant={isLive ? "default" : "outline"}
            onClick={() => setIsLive(!isLive)}
            className="flex items-center space-x-2"
          >
            <Activity className="h-4 w-4" />
            <span>{isLive ? 'Live' : 'Paused'}</span>
          </Button>
          <Button
            variant="outline"
            onClick={refreshData}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => exportData('json')}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Overall Health Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Overall Health Score</span>
          </CardTitle>
          <CardDescription>Comprehensive network performance indicator</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">{report.summary.overallHealth}</div>
              <p className="text-sm text-muted-foreground">Overall Score</p>
              <Progress value={report.summary.overallHealth} className="mt-2 h-2" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{report.summary.networkScore}</div>
              <p className="text-sm text-muted-foreground">Network</p>
              <Progress value={report.summary.networkScore} className="mt-2 h-2" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{report.summary.performanceScore}</div>
              <p className="text-sm text-muted-foreground">Performance</p>
              <Progress value={report.summary.performanceScore} className="mt-2 h-2" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{report.summary.economicScore}</div>
              <p className="text-sm text-muted-foreground">Economic</p>
              <Progress value={report.summary.economicScore} className="mt-2 h-2" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{report.summary.communityScore}</div>
              <p className="text-sm text-muted-foreground">Community</p>
              <Progress value={report.summary.communityScore} className="mt-2 h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Metrics Over Time</CardTitle>
                <CardDescription>24-hour performance trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metricsHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="nodes" stroke="#8884d8" name="Nodes" />
                    <Line type="monotone" dataKey="tps" stroke="#82ca9d" name="TPS" />
                    <Line type="monotone" dataKey="staked" stroke="#ffc658" name="Staked (K)" />
                    <Line type="monotone" dataKey="community" stroke="#ff7c7c" name="Community" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Goal Progress Overview</CardTitle>
                <CardDescription>Current status of all key objectives</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {goals.slice(0, 5).map((goal) => (
                    <div key={goal.goal} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{goal.goal}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">
                            {goal.current.toLocaleString()}/{goal.target.toLocaleString()} {goal.unit}
                          </span>
                          {getStatusBadge(goal.status)}
                        </div>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Achievements</CardTitle>
                <CardDescription>Recent milestones and accomplishments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <Award className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800">{achievement}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Growth Trends</CardTitle>
                <CardDescription>Weekly growth percentages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Node Growth</span>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium text-green-600">+{report.trends.nodeGrowth}%</span>
                      </div>
                    </div>
                    <Progress value={report.trends.nodeGrowth * 10} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">TPS Growth</span>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium text-green-600">+{report.trends.tpsGrowth}%</span>
                      </div>
                    </div>
                    <Progress value={report.trends.tpsGrowth * 5} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Community Growth</span>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium text-green-600">+{report.trends.communityGrowth}%</span>
                      </div>
                    </div>
                    <Progress value={report.trends.communityGrowth * 8} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Staking Growth</span>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium text-green-600">+{report.trends.stakingGrowth}%</span>
                      </div>
                    </div>
                    <Progress value={report.trends.stakingGrowth * 4} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Goal Progress</CardTitle>
                <CardDescription>Detailed breakdown of all objectives</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {goals.map((goal) => (
                    <div key={goal.goal} className="space-y-3 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(goal.status)}
                          <span className="font-medium">{goal.goal}</span>
                        </div>
                        {getStatusBadge(goal.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Target: {goal.target.toLocaleString()} {goal.unit} | Timeframe: {goal.timeframe}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{goal.progress.toFixed(1)}%</span>
                        </div>
                        <Progress value={goal.progress} className="h-3" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{goal.current.toLocaleString()} {goal.unit}</span>
                          <span>{goal.target.toLocaleString()} {goal.unit}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Goal Distribution</CardTitle>
                <CardDescription>Visual representation of goal categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={goals.map(goal => ({
                    goal: goal.goal,
                    progress: goal.progress,
                    fullMark: 100
                  }))}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="goal" />
                    <PolarRadiusAxis angle={0} domain={[0, 100]} />
                    <Radar
                      name="Progress"
                      dataKey="progress"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Network Growth</CardTitle>
                <CardDescription>Node and community expansion over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metricsHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="nodes" stackId="1" stroke="#8884d8" fill="#8884d8" name="Nodes" />
                    <Area type="monotone" dataKey="community" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="Community" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>TPS and staking metrics over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metricsHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="tps" stroke="#ffc658" strokeWidth={3} name="TPS" />
                    <Line type="monotone" dataKey="staked" stroke="#ff7c7c" strokeWidth={3} name="Staked (K)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>Actionable insights for improvement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.recommendations.map((recommendation, index) => (
                    <Alert key={index}>
                      <Info className="h-4 w-4" />
                      <AlertDescription>{recommendation}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Analysis</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{report.summary.networkScore}</div>
                      <p className="text-sm text-green-800">Network Health</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{report.summary.performanceScore}</div>
                      <p className="text-sm text-blue-800">Performance</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{report.summary.economicScore}</div>
                      <p className="text-sm text-yellow-800">Economic Activity</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{report.summary.communityScore}</div>
                      <p className="text-sm text-purple-800">Community Strength</p>
                    </div>
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
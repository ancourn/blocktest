'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TokenData {
  totalSupply: string;
  circulatingSupply: string;
  stakedSupply: string;
  burnedSupply: string;
  decimals: number;
  symbol: string;
}

interface ValidatorData {
  id: string;
  address: string;
  stakeAmount: string;
  uptime: number;
  commission: number;
  status: 'active' | 'inactive' | 'slashed';
  rewards: string;
}

interface TransactionFlow {
  from: string;
  to: string;
  amount: string;
  timestamp: string;
  type: 'transfer' | 'stake' | 'unstake' | 'reward';
}

const TokenMonitoringDashboard = () => {
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [validators, setValidators] = useState<ValidatorData[]>([]);
  const [transactionFlows, setTransactionFlows] = useState<TransactionFlow[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTokenData();
    fetchValidators();
    fetchTransactionFlows();
    
    // Set up real-time updates
    const interval = setInterval(() => {
      fetchTokenData();
      fetchValidators();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [selectedTimeframe]);

  const fetchTokenData = async () => {
    try {
      const response = await fetch('http://localhost:4000/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'kaldrix_getSupply',
          params: [],
          id: 1
        })
      });

      const data = await response.json();
      if (data.result) {
        setTokenData(data.result);
      }
    } catch (error) {
      console.error('Error fetching token data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchValidators = async () => {
    // Simulate validator data
    const mockValidators: ValidatorData[] = Array.from({ length: 20 }, (_, i) => ({
      id: `validator_${i + 1}`,
      address: `0x${Math.random().toString(16).substr(2, 40)}`,
      stakeAmount: (Math.random() * 1000000 + 100000).toFixed(0),
      uptime: Math.random() * 10 + 90,
      commission: Math.random() * 10 + 1,
      status: Math.random() > 0.1 ? 'active' : (Math.random() > 0.5 ? 'inactive' : 'slashed'),
      rewards: (Math.random() * 10000 + 1000).toFixed(0)
    }));
    setValidators(mockValidators);
  };

  const fetchTransactionFlows = async () => {
    // Simulate transaction flow data
    const mockFlows: TransactionFlow[] = Array.from({ length: 50 }, (_, i) => ({
      from: `0x${Math.random().toString(16).substr(2, 8)}...`,
      to: `0x${Math.random().toString(16).substr(2, 8)}...`,
      amount: (Math.random() * 10000 + 100).toFixed(0),
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      type: ['transfer', 'stake', 'unstake', 'reward'][Math.floor(Math.random() * 4)] as TransactionFlow['type']
    }));
    setTransactionFlows(mockFlows);
  };

  const formatNumber = (num: string, decimals: number = 18) => {
    const value = parseFloat(num) / Math.pow(10, decimals);
    if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
    if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
    if (value >= 1e3) return (value / 1e3).toFixed(2) + 'K';
    return value.toFixed(2);
  };

  const getTokenDistributionData = () => {
    if (!tokenData) return [];
    
    return [
      { name: 'Circulating', value: parseFloat(tokenData.circulatingSupply), color: '#3B82F6' },
      { name: 'Staked', value: parseFloat(tokenData.stakedSupply), color: '#10B981' },
      { name: 'Burned', value: parseFloat(tokenData.burnedSupply), color: '#EF4444' },
      { name: 'Treasury', value: parseFloat(tokenData.totalSupply) - parseFloat(tokenData.circulatingSupply) - parseFloat(tokenData.stakedSupply) - parseFloat(tokenData.burnedSupply), color: '#F59E0B' }
    ];
  };

  const getStakingDistributionData = () => {
    const ranges = [
      { name: '< 10K KALD', min: 0, max: 10000 },
      { name: '10K-100K KALD', min: 10000, max: 100000 },
      { name: '100K-1M KALD', min: 100000, max: 1000000 },
      { name: '> 1M KALD', min: 1000000, max: Infinity }
    ];

    return ranges.map(range => {
      const count = validators.filter(v => {
        const stake = parseFloat(v.stakeAmount);
        return stake >= range.min && stake < range.max;
      }).length;
      return { name: range.name, count };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading token monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Token Distribution Monitoring</h1>
          <p className="text-gray-600">Real-time monitoring of KALD token distribution and validator performance</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 Hour</SelectItem>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => { fetchTokenData(); fetchValidators(); fetchTransactionFlows(); }}>
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Token Overview Cards */}
      {tokenData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Supply</CardTitle>
              <div className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(tokenData.totalSupply, tokenData.decimals)} {tokenData.symbol}</div>
              <p className="text-xs text-gray-600">Total token supply</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Circulating Supply</CardTitle>
              <div className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(tokenData.circulatingSupply, tokenData.decimals)} {tokenData.symbol}</div>
              <p className="text-xs text-gray-600">In public circulation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Staked Supply</CardTitle>
              <div className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(tokenData.stakedSupply, tokenData.decimals)} {tokenData.symbol}</div>
              <p className="text-xs text-gray-600">Currently staked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Validators</CardTitle>
              <div className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{validators.filter(v => v.status === 'active').length}</div>
              <p className="text-xs text-gray-600">Out of {validators.length} total</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="distribution" className="space-y-4">
        <TabsList>
          <TabsTrigger value="distribution">Token Distribution</TabsTrigger>
          <TabsTrigger value="validators">Validator Performance</TabsTrigger>
          <TabsTrigger value="flows">Transaction Flows</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Token Distribution</CardTitle>
              <CardDescription>Breakdown of token supply across different categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {getTokenDistributionData().map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold">{formatNumber(item.value.toString(), 18)} KALD</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validators" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Validator Performance</CardTitle>
              <CardDescription>Top validators by uptime and stake amount</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {validators.slice(0, 10).map((validator) => (
                  <div key={validator.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold">{validator.id.split('_')[1]}</span>
                      </div>
                      <div>
                        <p className="font-medium">{validator.id}</p>
                        <p className="text-sm text-gray-600">{validator.address.slice(0, 10)}...</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatNumber(validator.stakeAmount, 18)} KALD</p>
                        <p className="text-xs text-gray-600">Stake</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{validator.uptime.toFixed(1)}%</p>
                        <p className="text-xs text-gray-600">Uptime</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{validator.commission.toFixed(1)}%</p>
                        <p className="text-xs text-gray-600">Commission</p>
                      </div>
                      <Badge variant={validator.status === 'active' ? 'default' : validator.status === 'inactive' ? 'secondary' : 'destructive'}>
                        {validator.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transaction Flows</CardTitle>
              <CardDescription>Latest token movements and staking activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactionFlows.slice(0, 20).map((flow, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Badge variant={flow.type === 'transfer' ? 'default' : flow.type === 'stake' ? 'secondary' : 'outline'}>
                        {flow.type}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">{flow.from} → {flow.to}</p>
                        <p className="text-xs text-gray-600">{new Date(flow.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatNumber(flow.amount, 18)} KALD</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Staking Distribution</CardTitle>
                <CardDescription>Distribution of validators by stake amount</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getStakingDistributionData().map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium">{item.name}</span>
                      <Badge variant="outline">{item.count} validators</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Network Health Metrics</CardTitle>
                <CardDescription>Key performance indicators for the network</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Network Uptime</span>
                    <Badge variant="default">99.9%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Active Validators</span>
                    <Badge variant="default">{validators.filter(v => v.status === 'active').length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Total Staked</span>
                    <Badge variant="default">{tokenData ? formatNumber(tokenData.stakedSupply, tokenData.decimals) : '0'} KALD</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Avg Validator Uptime</span>
                    <Badge variant="default">
                      {validators.length > 0 
                        ? (validators.reduce((sum, v) => sum + v.uptime, 0) / validators.length).toFixed(1) + '%'
                        : '0%'
                      }
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Staking Ratio</span>
                    <Badge variant="default">
                      {tokenData ? ((parseFloat(tokenData.stakedSupply) / parseFloat(tokenData.totalSupply)) * 100).toFixed(1) + '%' : '0%'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TokenMonitoringDashboard;
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Target,
  DollarSign,
  Calendar,
  MessageSquare
} from 'lucide-react'

interface Pilot {
  id: string
  company: string
  industry: string
  contact: {
    name: string
    title: string
    email: string
    phone: string
  }
  status: 'prospect' | 'in_discussion' | 'loi_signed' | 'pilot_active' | 'pilot_completed' | 'rejected'
  interest_level: 'low' | 'medium' | 'high'
  business_case: {
    estimated_roi: string
    implementation_cost: string
    annual_savings: string
    payback_period: string
  }
  milestones: Array<{
    name: string
    target_date: string
    status: 'pending' | 'completed' | 'delayed'
    dependencies: string[]
  }>
  kpi_targets: Record<string, number>
}

interface PilotSummary {
  total_pilots: number
  by_status: Record<string, number>
  by_industry: Record<string, number>
  by_interest_level: Record<string, number>
  total_potential_value: number
}

export default function EnterprisePilotDashboard() {
  const [pilots, setPilots] = useState<Pilot[]>([])
  const [summary, setSummary] = useState<PilotSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPilot, setSelectedPilot] = useState<Pilot | null>(null)

  useEffect(() => {
    fetchPilots()
  }, [])

  const fetchPilots = async () => {
    try {
      const response = await fetch('/api/enterprise/pilots')
      const data = await response.json()
      setPilots(data.pilots)
      setSummary(data.summary)
    } catch (error) {
      console.error('Error fetching pilots:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'prospect': return 'bg-gray-100 text-gray-800'
      case 'in_discussion': return 'bg-blue-100 text-blue-800'
      case 'loi_signed': return 'bg-purple-100 text-purple-800'
      case 'pilot_active': return 'bg-green-100 text-green-800'
      case 'pilot_completed': return 'bg-emerald-100 text-emerald-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getInterestColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'prospect': return <Target className="h-4 w-4" />
      case 'in_discussion': return <MessageSquare className="h-4 w-4" />
      case 'loi_signed': return <CheckCircle className="h-4 w-4" />
      case 'pilot_active': return <TrendingUp className="h-4 w-4" />
      case 'pilot_completed': return <CheckCircle className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const formatCurrency = (value: string) => {
    return value.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
  }

  const getMilestoneProgress = (milestones: any[]) => {
    const completed = milestones.filter(m => m.status === 'completed').length
    return milestones.length > 0 ? (completed / milestones.length) * 100 : 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading pilot data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Enterprise Pilot Program
          </h1>
          <p className="text-lg text-muted-foreground">
            Track and manage enterprise pilot engagements
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pilots">Active Pilots</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {summary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Pilots</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary.total_pilots}</div>
                    <p className="text-xs text-muted-foreground">
                      Active enterprise engagements
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">High Interest</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary.by_interest_level.high}</div>
                    <p className="text-xs text-muted-foreground">
                      High-priority opportunities
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">LOI Signed</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary.by_status.loi_signed}</div>
                    <p className="text-xs text-muted-foreground">
                      Letters of intent secured
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${(summary.total_potential_value / 1000000).toFixed(1)}M
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Potential implementation value
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pilots by Status</CardTitle>
                  <CardDescription>
                    Current distribution of pilot engagements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {summary && Object.entries(summary.by_status).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(status)}
                          <span className="capitalize">{status.replace('_', ' ')}</span>
                        </div>
                        <Badge className={getStatusColor(status)}>
                          {count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pilots by Industry</CardTitle>
                  <CardDescription>
                    Industry distribution of pilot programs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {summary && Object.entries(summary.by_industry).map(([industry, count]) => (
                      <div key={industry} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4" />
                          <span>{industry}</span>
                        </div>
                        <Badge variant="outline">
                          {count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pilots" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {pilots.map((pilot) => (
                <Card key={pilot.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{pilot.company}</CardTitle>
                      <Avatar>
                        <AvatarFallback>
                          {pilot.company.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <CardDescription>{pilot.industry}</CardDescription>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(pilot.status)}>
                        {pilot.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={getInterestColor(pilot.interest_level)}>
                        {pilot.interest_level} interest
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span className="text-sm">{pilot.contact.name}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>ROI</span>
                          <span className="font-semibold">{pilot.business_case.estimated_roi}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Implementation Cost</span>
                          <span className="font-semibold">{formatCurrency(pilot.business_case.implementation_cost)}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Milestone Progress</span>
                          <span>{Math.round(getMilestoneProgress(pilot.milestones))}%</span>
                        </div>
                        <Progress value={getMilestoneProgress(pilot.milestones)} className="w-full" />
                      </div>

                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setSelectedPilot(pilot)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Interest Level Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of pilot interest levels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {summary && Object.entries(summary.by_interest_level).map(([level, count]) => (
                      <div key={level} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{level}</span>
                          <span>{count} pilots</span>
                        </div>
                        <Progress 
                          value={summary.total_pilots > 0 ? (count / summary.total_pilots) * 100 : 0} 
                          className="w-full" 
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Industries</CardTitle>
                  <CardDescription>
                    Industries with most pilot engagements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {summary && Object.entries(summary.by_industry)
                      .sort(([,a], [,b]) => (b as number) - (a as number))
                      .slice(0, 5)
                      .map(([industry, count]) => (
                        <div key={industry} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{industry}</span>
                            <span>{count} pilots</span>
                          </div>
                          <Progress 
                            value={summary.total_pilots > 0 ? (count / summary.total_pilots) * 100 : 0} 
                            className="w-full" 
                          />
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
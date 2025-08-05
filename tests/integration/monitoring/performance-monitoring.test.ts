import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createServer } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'

// Mock the performance monitoring service
class MockPerformanceMonitoringService {
  private metrics: Map<string, any[]> = new Map()
  
  constructor() {
    this.initializeSampleMetrics()
  }

  private initializeSampleMetrics() {
    const sampleMetrics = {
      tps_current: Array.from({ length: 100 }, (_, i) => ({
        timestamp: Date.now() - (100 - i) * 60000,
        value: 1500 + Math.random() * 500
      })),
      latency_p95: Array.from({ length: 100 }, (_, i) => ({
        timestamp: Date.now() - (100 - i) * 60000,
        value: 30 + Math.random() * 20
      })),
      cpu_utilization: Array.from({ length: 100 }, (_, i) => ({
        timestamp: Date.now() - (100 - i) * 60000,
        value: 60 + Math.random() * 20
      })),
      memory_usage: Array.from({ length: 100 }, (_, i) => ({
        timestamp: Date.now() - (100 - i) * 60000,
        value: 70 + Math.random() * 15
      })),
      error_rate: Array.from({ length: 100 }, (_, i) => ({
        timestamp: Date.now() - (100 - i) * 60000,
        value: Math.random() * 0.5
      })),
      active_nodes: Array.from({ length: 100 }, (_, i) => ({
        timestamp: Date.now() - (100 - i) * 60000,
        value: 5 + Math.floor(Math.random() * 5)
      })),
      quantum_security_score: Array.from({ length: 100 }, (_, i) => ({
        timestamp: Date.now() - (100 - i) * 60000,
        value: 92 + Math.random() * 5
      })),
      network_bandwidth: Array.from({ length: 100 }, (_, i) => ({
        timestamp: Date.now() - (100 - i) * 60000,
        value: 30 + Math.random() * 20
      }))
    }

    for (const [key, value] of Object.entries(sampleMetrics)) {
      this.metrics.set(key, value)
    }
  }

  getSystemHealth() {
    const health: any = {
      timestamp: new Date().toISOString(),
      overall: 'healthy',
      metrics: {},
      alerts: [],
      uptime: process.uptime()
    }

    for (const [metricName, data] of this.metrics.entries()) {
      if (data.length > 0) {
        const latest = data[data.length - 1]
        const recent = data.slice(-5) // Last 5 data points
        
        health.metrics[metricName] = {
          current: latest.value,
          average: recent.reduce((sum, d) => sum + d.value, 0) / recent.length,
          trend: 'stable',
          status: 'healthy'
        }
      }
    }

    return health
  }

  getActiveAlerts() {
    return []
  }

  getMetric(metricName: string, timeRange?: { start: number; end: number }) {
    const data = this.metrics.get(metricName) || []
    
    if (!timeRange) {
      return data
    }

    return data.filter(d => 
      d.timestamp >= timeRange.start && d.timestamp <= timeRange.end
    )
  }

  getAggregatedMetrics(metricName: string, aggregation: string, timeRange?: { start: number; end: number }) {
    const data = this.getMetric(metricName, timeRange)
    
    if (data.length === 0) {
      return 0
    }

    switch (aggregation) {
      case 'avg':
        return data.reduce((sum, item) => sum + item.value, 0) / data.length
      case 'max':
        return Math.max(...data.map(item => item.value))
      case 'min':
        return Math.min(...data.map(item => item.value))
      case 'sum':
        return data.reduce((sum, item) => sum + item.value, 0)
      case 'count':
        return data.length
      default:
        return 0
    }
  }

  getAllMetrics() {
    const result: any = {}
    for (const [key, value] of this.metrics.entries()) {
      result[key] = value
    }
    return result
  }

  generateReport(timeRange: { start: number; end: number }) {
    const report = {
      generatedAt: new Date().toISOString(),
      timeRange: {
        start: new Date(timeRange.start).toISOString(),
        end: new Date(timeRange.end).toISOString()
      },
      summary: {
        totalMetrics: this.metrics.size,
        activeAlerts: 0,
        overallHealth: 'healthy'
      },
      metrics: {},
      alerts: [],
      recommendations: []
    }

    for (const [metricName, data] of this.metrics.entries()) {
      const metricData = data.filter(d => 
        d.timestamp >= timeRange.start && d.timestamp <= timeRange.end
      )

      if (metricData.length > 0) {
        report.metrics[metricName] = {
          count: metricData.length,
          min: Math.min(...metricData.map(d => d.value)),
          max: Math.max(...metricData.map(d => d.value)),
          avg: metricData.reduce((sum, d) => sum + d.value, 0) / metricData.length,
          current: metricData[metricData.length - 1].value,
          trend: 'stable',
          status: 'healthy'
        }
      }
    }

    return report
  }
}

// Global instance
let monitoringService: MockPerformanceMonitoringService | null = null

function getMonitoringService(): MockPerformanceMonitoringService {
  if (!monitoringService) {
    monitoringService = new MockPerformanceMonitoringService()
  }
  return monitoringService
}

// Mock handlers
const mockHealthHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    const service = getMonitoringService()
    const health = service.getSystemHealth()
    
    return res.status(200).json({
      success: true,
      data: health,
      timestamp: new Date().toISOString()
    })
  }

  if (req.method === 'POST') {
    const { metric, value, metadata } = req.body
    
    if (!metric || typeof value !== 'number') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid request. Metric name and numeric value are required.'
      })
    }

    return res.status(200).json({
      success: true,
      message: `Metric ${metric} added successfully`,
      value: value,
      timestamp: new Date().toISOString()
    })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

const mockMetricsHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  const url = new URL(req.url || '', 'http://localhost')
  const metricName = url.searchParams.get('metric')
  const start = url.searchParams.get('start')
  const end = url.searchParams.get('end')
  const aggregation = url.searchParams.get('aggregation') || 'avg'

  const service = getMonitoringService()

  if (metricName) {
    let timeRange
    if (start && end) {
      timeRange = {
        start: parseInt(start),
        end: parseInt(end)
      }
    }

    if (aggregation !== 'avg') {
      const aggregatedValue = service.getAggregatedMetrics(metricName, aggregation, timeRange)
      return res.status(200).json({
        success: true,
        data: {
          metric: metricName,
          aggregation,
          value: aggregatedValue,
          timeRange
        },
        timestamp: new Date().toISOString()
      })
    } else {
      const metricData = service.getMetric(metricName, timeRange)
      return res.status(200).json({
        success: true,
        data: {
          metric: metricName,
          data: metricData,
          count: metricData.length,
          timeRange
        },
        timestamp: new Date().toISOString()
      })
    }
  } else {
    const allMetrics = service.getAllMetrics()
    return res.status(200).json({
      success: true,
      data: {
        metrics: allMetrics,
        count: Object.keys(allMetrics).length
      },
      timestamp: new Date().toISOString()
    })
  }
}

const mockAlertsHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  const service = getMonitoringService()
  const alerts = service.getActiveAlerts()
  
  return res.status(200).json({
    success: true,
    data: {
      alerts,
      count: alerts.length,
      severitySummary: {
        critical: alerts.filter((a: any) => a.severity === 'critical').length,
        high: alerts.filter((a: any) => a.severity === 'high').length,
        medium: alerts.filter((a: any) => a.severity === 'medium').length,
        low: alerts.filter((a: any) => a.severity === 'low').length
      }
    },
    timestamp: new Date().toISOString()
  })
}

const mockReportsHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  const url = new URL(req.url || '', 'http://localhost')
  const start = url.searchParams.get('start')
  const end = url.searchParams.get('end')
  const format = url.searchParams.get('format') || 'json'

  const now = Date.now()
  const timeRange = {
    start: start ? parseInt(start) : now - (24 * 60 * 60 * 1000),
    end: end ? parseInt(end) : now
  }

  const service = getMonitoringService()
  const report = service.generateReport(timeRange)

  return res.status(200).json({
    success: true,
    data: report,
    timestamp: new Date().toISOString()
  })
}

describe('Performance Monitoring Integration Tests', () => {
  let server: any
  let baseUrl: string

  beforeEach(() => {
    server = createServer((req, res) => {
      const apiReq = req as unknown as NextApiRequest
      const apiRes = res as unknown as NextApiResponse
      
      if (req.url?.includes('/monitoring/health')) {
        mockHealthHandler(apiReq, apiRes)
      } else if (req.url?.includes('/monitoring/metrics')) {
        mockMetricsHandler(apiReq, apiRes)
      } else if (req.url?.includes('/monitoring/alerts')) {
        mockAlertsHandler(apiReq, apiRes)
      } else if (req.url?.includes('/monitoring/reports')) {
        mockReportsHandler(apiReq, apiRes)
      } else {
        res.status(404).json({ error: 'Not found' })
      }
    })
    
    server.listen(0)
    const port = (server.address() as any).port
    baseUrl = `http://localhost:${port}`
  })

  afterEach(() => {
    server.close()
    monitoringService = null
  })

  describe('GET /api/monitoring/health', () => {
    it('should return system health status', async () => {
      const response = await fetch(`${baseUrl}/api/monitoring/health`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('timestamp')
      expect(data.data).toHaveProperty('overall')
      expect(data.data).toHaveProperty('metrics')
      expect(data.data).toHaveProperty('alerts')
      expect(data.data).toHaveProperty('uptime')
    })

    it('should include all expected metrics', async () => {
      const response = await fetch(`${baseUrl}/api/monitoring/health`)
      const data = await response.json()

      const expectedMetrics = [
        'tps_current', 'latency_p95', 'cpu_utilization', 'memory_usage',
        'error_rate', 'active_nodes', 'quantum_security_score', 'network_bandwidth'
      ]

      expectedMetrics.forEach(metric => {
        expect(data.data.metrics).toHaveProperty(metric)
        expect(data.data.metrics[metric]).toHaveProperty('current')
        expect(data.data.metrics[metric]).toHaveProperty('average')
        expect(data.data.metrics[metric]).toHaveProperty('trend')
        expect(data.data.metrics[metric]).toHaveProperty('status')
      })
    })

    it('should return valid metric values', async () => {
      const response = await fetch(`${baseUrl}/api/monitoring/health`)
      const data = await response.json()

      Object.values(data.data.metrics).forEach((metric: any) => {
        expect(typeof metric.current).toBe('number')
        expect(typeof metric.average).toBe('number')
        expect(typeof metric.trend).toBe('string')
        expect(typeof metric.status).toBe('string')
      })
    })
  })

  describe('POST /api/monitoring/health', () => {
    it('should accept valid metric data', async () => {
      const metricData = {
        metric: 'test_metric',
        value: 42.5,
        metadata: { source: 'test' }
      }

      const response = await fetch(`${baseUrl}/api/monitoring/health`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metricData),
      })

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toContain('test_metric')
      expect(data.value).toBe(42.5)
    })

    it('should reject invalid metric data', async () => {
      const invalidData = {
        metric: 'test_metric',
        value: 'not_a_number'
      }

      const response = await fetch(`${baseUrl}/api/monitoring/health`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      })

      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid request')
    })

    it('should reject missing required fields', async () => {
      const incompleteData = {
        metric: 'test_metric'
        // missing value
      }

      const response = await fetch(`${baseUrl}/api/monitoring/health`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(incompleteData),
      })

      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid request')
    })
  })

  describe('GET /api/monitoring/metrics', () => {
    it('should return all metrics when no specific metric is requested', async () => {
      const response = await fetch(`${baseUrl}/api/monitoring/metrics`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('metrics')
      expect(data.data).toHaveProperty('count')
      expect(data.data.count).toBeGreaterThan(0)
      expect(Object.keys(data.data.metrics)).toContain('tps_current')
    })

    it('should return specific metric when requested', async () => {
      const response = await fetch(`${baseUrl}/api/monitoring/metrics?metric=tps_current`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('metric', 'tps_current')
      expect(data.data).toHaveProperty('data')
      expect(Array.isArray(data.data.data)).toBe(true)
      expect(data.data.count).toBeGreaterThan(0)
    })

    it('should return aggregated values when requested', async () => {
      const response = await fetch(`${baseUrl}/api/monitoring/metrics?metric=tps_current&aggregation=max`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('metric', 'tps_current')
      expect(data.data).toHaveProperty('aggregation', 'max')
      expect(data.data).toHaveProperty('value')
      expect(typeof data.data.value).toBe('number')
    })

    it('should respect time range filters', async () => {
      const now = Date.now()
      const oneHourAgo = now - (60 * 60 * 1000)
      const response = await fetch(`${baseUrl}/api/monitoring/metrics?metric=tps_current&start=${oneHourAgo}&end=${now}`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('timeRange')
      expect(data.data.timeRange.start).toBe(oneHourAgo)
      expect(data.data.timeRange.end).toBe(now)
    })
  })

  describe('GET /api/monitoring/alerts', () => {
    it('should return alerts summary', async () => {
      const response = await fetch(`${baseUrl}/api/monitoring/alerts`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('alerts')
      expect(data.data).toHaveProperty('count')
      expect(data.data).toHaveProperty('severitySummary')
      expect(data.data.severitySummary).toHaveProperty('critical')
      expect(data.data.severitySummary).toHaveProperty('high')
      expect(data.data.severitySummary).toHaveProperty('medium')
      expect(data.data.severitySummary).toHaveProperty('low')
    })

    it('should return alerts array', async () => {
      const response = await fetch(`${baseUrl}/api/monitoring/alerts`)
      const data = await response.json()

      expect(Array.isArray(data.data.alerts)).toBe(true)
      expect(typeof data.data.count).toBe('number')
    })
  })

  describe('GET /api/monitoring/reports', () => {
    it('should generate performance report', async () => {
      const response = await fetch(`${baseUrl}/api/monitoring/reports`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('generatedAt')
      expect(data.data).toHaveProperty('timeRange')
      expect(data.data).toHaveProperty('summary')
      expect(data.data).toHaveProperty('metrics')
      expect(data.data).toHaveProperty('alerts')
      expect(data.data).toHaveProperty('recommendations')
    })

    it('should include metric summaries in report', async () => {
      const response = await fetch(`${baseUrl}/api/monitoring/reports`)
      const data = await response.json()

      expect(Object.keys(data.data.metrics).length).toBeGreaterThan(0)
      
      // Check a sample metric structure
      const sampleMetric = Object.values(data.data.metrics)[0] as any
      expect(sampleMetric).toHaveProperty('count')
      expect(sampleMetric).toHaveProperty('min')
      expect(sampleMetric).toHaveProperty('max')
      expect(sampleMetric).toHaveProperty('avg')
      expect(sampleMetric).toHaveProperty('current')
      expect(sampleMetric).toHaveProperty('trend')
      expect(sampleMetric).toHaveProperty('status')
    })

    it('should respect custom time ranges', async () => {
      const now = Date.now()
      const sixHoursAgo = now - (6 * 60 * 60 * 1000)
      const response = await fetch(`${baseUrl}/api/monitoring/reports?start=${sixHoursAgo}&end=${now}`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.timeRange.start).toBe(new Date(sixHoursAgo).toISOString())
      expect(data.data.timeRange.end).toBe(new Date(now).toISOString())
    })
  })

  describe('Performance Monitoring Load Testing', () => {
    it('should handle concurrent metric requests', async () => {
      const requests = Array(20).fill(null).map(() => 
        fetch(`${baseUrl}/api/monitoring/metrics`)
      )

      const responses = await Promise.all(requests)
      const results = await Promise.all(responses.map(r => r.json()))

      expect(responses.every(r => r.status === 200)).toBe(true)
      expect(results.every(r => r.success === true)).toBe(true)
    })

    it('should maintain response time under load', async () => {
      const startTime = Date.now()
      
      const requests = Array(10).fill(null).map(() => 
        fetch(`${baseUrl}/api/monitoring/health`)
      )

      await Promise.all(requests)
      const endTime = Date.now()
      const totalTime = endTime - startTime

      expect(totalTime).toBeLessThan(2000) // Should handle 10 concurrent requests in under 2 seconds
    })

    it('should handle mixed endpoint requests', async () => {
      const requests = [
        fetch(`${baseUrl}/api/monitoring/health`),
        fetch(`${baseUrl}/api/monitoring/metrics`),
        fetch(`${baseUrl}/api/monitoring/alerts`),
        fetch(`${baseUrl}/api/monitoring/reports`),
        fetch(`${baseUrl}/api/monitoring/metrics?metric=tps_current&aggregation=max`)
      ]

      const responses = await Promise.all(requests)
      const results = await Promise.all(responses.map(r => r.json()))

      expect(responses.every(r => r.status === 200)).toBe(true)
      expect(results.every(r => r.success === true)).toBe(true)
    })
  })

  describe('Performance Monitoring Data Validation', () => {
    it('should return valid timestamps in all responses', async () => {
      const response = await fetch(`${baseUrl}/api/monitoring/health`)
      const data = await response.json()

      expect(new Date(data.data.timestamp)).toBeInstanceOf(Date)
      expect(isNaN(new Date(data.data.timestamp).getTime())).toBe(false)
    })

    it('should return numeric values for all metrics', async () => {
      const response = await fetch(`${baseUrl}/api/monitoring/metrics`)
      const data = await response.json()

      Object.values(data.data.metrics).forEach((metricArray: any) => {
        metricArray.forEach((point: any) => {
          expect(typeof point.timestamp).toBe('number')
          expect(typeof point.value).toBe('number')
        })
      })
    })

    it('should handle edge cases gracefully', async () => {
      // Test with future timestamp
      const future = Date.now() + (24 * 60 * 60 * 1000)
      const response = await fetch(`${baseUrl}/api/monitoring/metrics?metric=tps_current&start=${future}&end=${future}`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.count).toBe(0) // Should return empty dataset for future time range
    })
  })
})
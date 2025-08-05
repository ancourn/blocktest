import { NextRequest, NextResponse } from 'next/server';

interface MetricData {
  timestamp: number;
  value: number;
  metadata?: Record<string, any>;
}

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'above' | 'below' | 'equals';
  threshold: number;
  duration: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

interface AlertState {
  ruleId: string;
  triggered: boolean;
  firstTriggered: number;
  lastTriggered: number;
  notificationSent: boolean;
}

export class PerformanceMonitoringService {
  private metrics: Map<string, MetricData[]> = new Map();
  private alertRules: AlertRule[] = [];
  private alertStates: Map<string, AlertState> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;
  private notificationCallbacks: Set<(alert: any) => void> = new Set();

  constructor() {
    this.initializeAlertRules();
    this.startMonitoring();
  }

  private initializeAlertRules() {
    this.alertRules = [
      {
        id: 'tps_drop',
        name: 'TPS Below Threshold',
        metric: 'tps_current',
        condition: 'below',
        threshold: 1500,
        duration: 300000, // 5 minutes
        severity: 'high',
        enabled: true
      },
      {
        id: 'latency_spike',
        name: 'High Latency Detected',
        metric: 'latency_p95',
        condition: 'above',
        threshold: 200,
        duration: 60000, // 1 minute
        severity: 'medium',
        enabled: true
      },
      {
        id: 'cpu_high',
        name: 'High CPU Usage',
        metric: 'cpu_utilization',
        condition: 'above',
        threshold: 90,
        duration: 600000, // 10 minutes
        severity: 'medium',
        enabled: true
      },
      {
        id: 'memory_high',
        name: 'High Memory Usage',
        metric: 'memory_usage',
        condition: 'above',
        threshold: 85,
        duration: 600000, // 10 minutes
        severity: 'medium',
        enabled: true
      },
      {
        id: 'error_rate_high',
        name: 'High Error Rate',
        metric: 'error_rate',
        condition: 'above',
        threshold: 1,
        duration: 300000, // 5 minutes
        severity: 'high',
        enabled: true
      },
      {
        id: 'node_count_low',
        name: 'Low Node Count',
        metric: 'active_nodes',
        condition: 'below',
        threshold: 3,
        duration: 120000, // 2 minutes
        severity: 'high',
        enabled: true
      },
      {
        id: 'quantum_score_low',
        name: 'Low Quantum Security Score',
        metric: 'quantum_security_score',
        condition: 'below',
        threshold: 90,
        duration: 300000, // 5 minutes
        severity: 'high',
        enabled: true
      },
      {
        id: 'network_bandwidth_low',
        name: 'Low Network Bandwidth',
        metric: 'network_bandwidth',
        condition: 'below',
        threshold: 20,
        duration: 180000, // 3 minutes
        severity: 'medium',
        enabled: true
      }
    ];
  }

  public addMetric(metricName: string, value: number, metadata?: Record<string, any>) {
    const metricData: MetricData = {
      timestamp: Date.now(),
      value,
      metadata
    };

    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, []);
    }

    const metricArray = this.metrics.get(metricName)!;
    metricArray.push(metricData);

    // Keep only last 1000 data points per metric
    if (metricArray.length > 1000) {
      metricArray.shift();
    }

    // Clean up old data (older than 7 days)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const filteredData = metricArray.filter(data => data.timestamp > sevenDaysAgo);
    this.metrics.set(metricName, filteredData);
  }

  public getMetric(metricName: string, timeRange?: { start: number; end: number }): MetricData[] {
    const metricArray = this.metrics.get(metricName) || [];
    
    if (!timeRange) {
      return metricArray;
    }

    return metricArray.filter(data => 
      data.timestamp >= timeRange.start && data.timestamp <= timeRange.end
    );
  }

  public getAllMetrics(): Record<string, MetricData[]> {
    const result: Record<string, MetricData[]> = {};
    for (const [key, value] of this.metrics.entries()) {
      result[key] = value;
    }
    return result;
  }

  public getAggregatedMetrics(metricName: string, aggregation: 'avg' | 'max' | 'min' | 'sum' | 'count', timeRange?: { start: number; end: number }): number {
    const data = this.getMetric(metricName, timeRange);
    
    if (data.length === 0) {
      return 0;
    }

    switch (aggregation) {
      case 'avg':
        return data.reduce((sum, item) => sum + item.value, 0) / data.length;
      case 'max':
        return Math.max(...data.map(item => item.value));
      case 'min':
        return Math.min(...data.map(item => item.value));
      case 'sum':
        return data.reduce((sum, item) => sum + item.value, 0);
      case 'count':
        return data.length;
      default:
        return 0;
    }
  }

  private startMonitoring() {
    this.checkInterval = setInterval(() => {
      this.checkAlerts();
    }, 30000); // Check every 30 seconds
  }

  private checkAlerts() {
    const now = Date.now();
    
    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      const metricData = this.metrics.get(rule.metric);
      if (!metricData || metricData.length === 0) continue;

      const recentData = metricData.filter(data => 
        data.timestamp >= now - rule.duration
      );

      if (recentData.length === 0) continue;

      const latestValue = recentData[recentData.length - 1].value;
      const isTriggered = this.evaluateCondition(latestValue, rule.condition, rule.threshold);

      let alertState = this.alertStates.get(rule.id);
      if (!alertState) {
        alertState = {
          ruleId: rule.id,
          triggered: false,
          firstTriggered: 0,
          lastTriggered: 0,
          notificationSent: false
        };
        this.alertStates.set(rule.id, alertState);
      }

      if (isTriggered) {
        if (!alertState.triggered) {
          alertState.triggered = true;
          alertState.firstTriggered = now;
          alertState.lastTriggered = now;
        } else {
          alertState.lastTriggered = now;
        }

        // Check if condition has been met for the required duration
        if (now - alertState.firstTriggered >= rule.duration && !alertState.notificationSent) {
          this.triggerAlert(rule, latestValue, recentData);
          alertState.notificationSent = true;
        }
      } else {
        if (alertState.triggered) {
          alertState.triggered = false;
          alertState.notificationSent = false;
          this.clearAlert(rule);
        }
      }
    }
  }

  private evaluateCondition(value: number, condition: string, threshold: number): boolean {
    switch (condition) {
      case 'above':
        return value > threshold;
      case 'below':
        return value < threshold;
      case 'equals':
        return value === threshold;
      default:
        return false;
    }
  }

  private triggerAlert(rule: AlertRule, currentValue: number, data: MetricData[]) {
    const alert = {
      id: rule.id,
      name: rule.name,
      metric: rule.metric,
      currentValue,
      threshold: rule.threshold,
      condition: rule.condition,
      severity: rule.severity,
      timestamp: new Date().toISOString(),
      dataPoints: data.length,
      description: this.generateAlertDescription(rule, currentValue),
      recommendedActions: this.getRecommendedActions(rule.id)
    };

    // Send notifications
    this.notificationCallbacks.forEach(callback => callback(alert));

    // Log to console
    console.log(`🚨 ALERT: ${rule.name} - ${rule.metric} = ${currentValue} (threshold: ${rule.threshold})`);
  }

  private clearAlert(rule: AlertRule) {
    console.log(`✅ ALERT CLEARED: ${rule.name}`);
  }

  private generateAlertDescription(rule: AlertRule, currentValue: number): string {
    const conditionText = rule.condition === 'above' ? 'exceeded' : 'below';
    return `${rule.metric} is ${conditionText} threshold of ${rule.threshold}. Current value: ${currentValue}`;
  }

  private getRecommendedActions(ruleId: string): string[] {
    const actions: Record<string, string[]> = {
      'tps_drop': [
        'Check parallel processing worker threads',
        'Monitor transaction queue depth',
        'Review DAG traversal performance',
        'Scale worker pool if necessary'
      ],
      'latency_spike': [
        'Check network connectivity',
        'Monitor CPU and memory usage',
        'Review transaction processing pipeline',
        'Check for network congestion'
      ],
      'cpu_high': [
        'Review active processes',
        'Check for memory leaks',
        'Monitor thread pool usage',
        'Consider scaling resources'
      ],
      'memory_high': [
        'Check for memory leaks',
        'Review garbage collection logs',
        'Monitor object allocation patterns',
        'Consider memory pooling optimization'
      ],
      'error_rate_high': [
        'Review error logs',
        'Check system health',
        'Monitor transaction validation',
        'Review network connectivity'
      ],
      'node_count_low': [
        'Check node health status',
        'Review network connectivity',
        'Monitor node discovery process',
        'Restart nodes if necessary'
      ],
      'quantum_score_low': [
        'Review quantum algorithm performance',
        'Check cryptographic key management',
        'Monitor signature validation times',
        'Review security configuration'
      ],
      'network_bandwidth_low': [
        'Check network interfaces',
        'Monitor traffic patterns',
        'Review connection pooling',
        'Check for network congestion'
      ]
    };

    return actions[ruleId] || ['Review system logs', 'Contact support team'];
  }

  public addNotificationCallback(callback: (alert: any) => void) {
    this.notificationCallbacks.add(callback);
  }

  public removeNotificationCallback(callback: (alert: any) => void) {
    this.notificationCallbacks.delete(callback);
  }

  public getAlertStates(): AlertState[] {
    return Array.from(this.alertStates.values());
  }

  public getActiveAlerts(): any[] {
    const activeAlerts: any[] = [];
    const now = Date.now();

    for (const [ruleId, state] of this.alertStates.entries()) {
      if (state.triggered && !state.notificationSent) {
        const rule = this.alertRules.find(r => r.id === ruleId);
        if (rule) {
          const metricData = this.metrics.get(rule.metric);
          const latestValue = metricData && metricData.length > 0 ? metricData[metricData.length - 1].value : 0;
          
          activeAlerts.push({
            id: rule.id,
            name: rule.name,
            metric: rule.metric,
            currentValue: latestValue,
            threshold: rule.threshold,
            condition: rule.condition,
            severity: rule.severity,
            firstTriggered: new Date(state.firstTriggered).toISOString(),
            duration: now - state.firstTriggered,
            description: this.generateAlertDescription(rule, latestValue),
            recommendedActions: this.getRecommendedActions(rule.id)
          });
        }
      }
    }

    return activeAlerts;
  }

  public getSystemHealth(): Record<string, any> {
    const now = Date.now();
    const health: Record<string, any> = {
      timestamp: new Date().toISOString(),
      overall: 'healthy',
      metrics: {},
      alerts: this.getActiveAlerts(),
      uptime: process.uptime()
    };

    // Calculate health for each metric
    for (const [metricName, data] of this.metrics.entries()) {
      if (data.length > 0) {
        const latest = data[data.length - 1];
        const recent = data.filter(d => d.timestamp >= now - 300000); // Last 5 minutes
        
        health.metrics[metricName] = {
          current: latest.value,
          average: recent.length > 0 ? recent.reduce((sum, d) => sum + d.value, 0) / recent.length : 0,
          trend: this.calculateTrend(recent),
          status: this.getMetricStatus(metricName, latest.value)
        };
      }
    }

    // Determine overall health
    if (health.alerts.length > 0) {
      const hasCriticalAlerts = health.alerts.some((alert: any) => alert.severity === 'critical');
      const hasHighAlerts = health.alerts.some((alert: any) => alert.severity === 'high');
      
      if (hasCriticalAlerts) {
        health.overall = 'critical';
      } else if (hasHighAlerts) {
        health.overall = 'degraded';
      } else {
        health.overall = 'warning';
      }
    }

    return health;
  }

  private calculateTrend(data: MetricData[]): 'increasing' | 'decreasing' | 'stable' {
    if (data.length < 2) return 'stable';
    
    const recent = data.slice(-10); // Last 10 data points
    if (recent.length < 2) return 'stable';
    
    const first = recent[0].value;
    const last = recent[recent.length - 1].value;
    const change = ((last - first) / first) * 100;
    
    if (change > 5) return 'increasing';
    if (change < -5) return 'decreasing';
    return 'stable';
  }

  private getMetricStatus(metricName: string, value: number): 'healthy' | 'warning' | 'critical' {
    const thresholds: Record<string, { warning: number; critical: number }> = {
      'tps_current': { warning: 1500, critical: 1000 },
      'latency_p95': { warning: 100, critical: 200 },
      'cpu_utilization': { warning: 80, critical: 90 },
      'memory_usage': { warning: 75, critical: 85 },
      'error_rate': { warning: 0.5, critical: 1 },
      'active_nodes': { warning: 5, critical: 3 },
      'quantum_security_score': { warning: 95, critical: 90 },
      'network_bandwidth': { warning: 30, critical: 20 }
    };

    const threshold = thresholds[metricName];
    if (!threshold) return 'healthy';

    if (metricName === 'tps_current' || metricName === 'active_nodes' || metricName === 'quantum_security_score' || metricName === 'network_bandwidth') {
      if (value < threshold.critical) return 'critical';
      if (value < threshold.warning) return 'warning';
    } else {
      if (value > threshold.critical) return 'critical';
      if (value > threshold.warning) return 'warning';
    }

    return 'healthy';
  }

  public stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  public generateReport(timeRange: { start: number; end: number }): Record<string, any> {
    const report = {
      generatedAt: new Date().toISOString(),
      timeRange: {
        start: new Date(timeRange.start).toISOString(),
        end: new Date(timeRange.end).toISOString()
      },
      summary: {
        totalMetrics: this.metrics.size,
        activeAlerts: this.getActiveAlerts().length,
        overallHealth: this.getSystemHealth().overall
      },
      metrics: {} as Record<string, any>,
      alerts: this.getActiveAlerts(),
      recommendations: [] as string[]
    };

    // Generate metric summaries
    for (const [metricName, data] of this.metrics.entries()) {
      const metricData = data.filter(d => 
        d.timestamp >= timeRange.start && d.timestamp <= timeRange.end
      );

      if (metricData.length > 0) {
        report.metrics[metricName] = {
          count: metricData.length,
          min: Math.min(...metricData.map(d => d.value)),
          max: Math.max(...metricData.map(d => d.value)),
          avg: metricData.reduce((sum, d) => sum + d.value, 0) / metricData.length,
          current: metricData[metricData.length - 1].value,
          trend: this.calculateTrend(metricData),
          status: this.getMetricStatus(metricName, metricData[metricData.length - 1].value)
        };
      }
    }

    // Generate recommendations based on metrics
    if (report.metrics.tps_current && report.metrics.tps_current.avg < 1500) {
      report.recommendations.push('Consider implementing parallel processing to improve TPS');
    }

    if (report.metrics.memory_usage && report.metrics.memory_usage.avg > 75) {
      report.recommendations.push('Implement memory pooling optimization to reduce memory usage');
    }

    if (report.metrics.latency_p95 && report.metrics.latency_p95.avg > 100) {
      report.recommendations.push('Optimize network protocols and implement connection pooling');
    }

    return report;
  }
}

// Global instance
let monitoringService: PerformanceMonitoringService | null = null;

export function getMonitoringService(): PerformanceMonitoringService {
  if (!monitoringService) {
    monitoringService = new PerformanceMonitoringService();
  }
  return monitoringService;
}

export function initializeMonitoring() {
  const service = getMonitoringService();
  
  // Add some sample metrics for demonstration
  setInterval(() => {
    service.addMetric('tps_current', Math.random() * 2000 + 1000);
    service.addMetric('latency_p95', Math.random() * 100 + 20);
    service.addMetric('cpu_utilization', Math.random() * 30 + 50);
    service.addMetric('memory_usage', Math.random() * 20 + 60);
    service.addMetric('error_rate', Math.random() * 0.5);
    service.addMetric('active_nodes', Math.floor(Math.random() * 5) + 5);
    service.addMetric('quantum_security_score', Math.random() * 5 + 92);
    service.addMetric('network_bandwidth', Math.random() * 30 + 30);
  }, 10000); // Add metrics every 10 seconds

  return service;
}
import { EventEmitter } from 'events';

export interface AvailabilityMetrics {
  uptime: number; // percentage
  downtime: number; // total downtime in seconds
  totalUptime: number; // total uptime in seconds
  slaCompliance: boolean; // meets 99.99% SLA
  currentStreak: number; // current uptime streak in seconds
  longestStreak: number; // longest uptime streak in seconds
  incidents: AvailabilityIncident[];
}

export interface AvailabilityIncident {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  severity: 'MINOR' | 'MAJOR' | 'CRITICAL';
  affectedNodes: string[];
  cause: string;
  resolved: boolean;
  impact: {
    availabilityDrop: number; // percentage points
    usersAffected: number;
    transactionsLost: number;
  };
}

export interface NodeMetrics {
  nodeId: string;
  availability: number; // percentage
  responseTime: number; // average in ms
  errorRate: number; // percentage
  lastSeen: Date;
  consecutiveFailures: number;
  healthScore: number; // 0-100
}

export interface SystemMetrics {
  overallAvailability: number;
  nodeCount: number;
  healthyNodes: number;
  averageResponseTime: number;
  averageErrorRate: number;
  consensusHealth: number;
  networkHealth: number;
  storageHealth: number;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  isActive: boolean;
  lastTriggered?: Date;
  notificationChannels: string[];
}

export interface MonitoringConfig {
  slaTarget: number; // 99.99
  checkInterval: number; // seconds
  incidentTimeout: number; // seconds before auto-resolve
  alertCooldown: number; // seconds
  retentionPeriod: number; // days
  enableNotifications: boolean;
}

export class AvailabilityMonitor extends EventEmitter {
  private nodeMetrics: Map<string, NodeMetrics> = new Map();
  private incidents: Map<string, AvailabilityIncident> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private metrics: AvailabilityMetrics;
  private systemMetrics: SystemMetrics;
  private config: MonitoringConfig;
  private isRunning: boolean = false;
  private checkInterval?: NodeJS.Timeout;
  private startTime: Date;

  constructor(config: MonitoringConfig) {
    super();
    this.config = config;
    this.startTime = new Date();
    this.metrics = {
      uptime: 100,
      downtime: 0,
      totalUptime: 0,
      slaCompliance: true,
      currentStreak: 0,
      longestStreak: 0,
      incidents: []
    };
    this.systemMetrics = {
      overallAvailability: 100,
      nodeCount: 0,
      healthyNodes: 0,
      averageResponseTime: 0,
      averageErrorRate: 0,
      consensusHealth: 100,
      networkHealth: 100,
      storageHealth: 100
    };
  }

  async initialize(): Promise<void> {
    this.isRunning = true;
    this.setupDefaultAlertRules();
    this.startMonitoring();
    console.log('Availability monitor initialized');
  }

  private setupDefaultAlertRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'availability-drop',
        name: 'Availability Drop Below SLA',
        condition: 'overallAvailability < slaTarget',
        threshold: this.config.slaTarget,
        severity: 'CRITICAL',
        isActive: true,
        notificationChannels: ['email', 'slack']
      },
      {
        id: 'node-failure',
        name: 'Node Failure Detected',
        condition: 'healthyNodes < nodeCount * 0.7',
        threshold: 0.7,
        severity: 'ERROR',
        isActive: true,
        notificationChannels: ['email', 'pagerduty']
      },
      {
        id: 'high-latency',
        name: 'High Response Time',
        condition: 'averageResponseTime > 1000',
        threshold: 1000,
        severity: 'WARNING',
        isActive: true,
        notificationChannels: ['slack']
      },
      {
        id: 'consensus-degradation',
        name: 'Consensus Health Degradation',
        condition: 'consensusHealth < 90',
        threshold: 90,
        severity: 'ERROR',
        isActive: true,
        notificationChannels: ['email', 'slack']
      },
      {
        id: 'error-spike',
        name: 'Error Rate Spike',
        condition: 'averageErrorRate > 5',
        threshold: 5,
        severity: 'WARNING',
        isActive: true,
        notificationChannels: ['slack']
      }
    ];

    for (const rule of defaultRules) {
      this.alertRules.set(rule.id, rule);
    }
  }

  registerNode(nodeId: string): void {
    const nodeMetrics: NodeMetrics = {
      nodeId,
      availability: 100,
      responseTime: 0,
      errorRate: 0,
      lastSeen: new Date(),
      consecutiveFailures: 0,
      healthScore: 100
    };

    this.nodeMetrics.set(nodeId, nodeMetrics);
    this.systemMetrics.nodeCount++;
    this.systemMetrics.healthyNodes++;

    console.log(`Node ${nodeId} registered with availability monitor`);
    this.emit('nodeRegistered', { nodeId, metrics: nodeMetrics });
  }

  unregisterNode(nodeId: string): void {
    this.nodeMetrics.delete(nodeId);
    this.systemMetrics.nodeCount = Math.max(0, this.systemMetrics.nodeCount - 1);
    this.systemMetrics.healthyNodes = Math.max(0, this.systemMetrics.healthyNodes - 1);

    console.log(`Node ${nodeId} unregistered from availability monitor`);
    this.emit('nodeUnregistered', { nodeId });
  }

  updateNodeMetrics(nodeId: string, updates: Partial<NodeMetrics>): void {
    const node = this.nodeMetrics.get(nodeId);
    if (!node) return;

    const updatedNode: NodeMetrics = {
      ...node,
      ...updates,
      lastSeen: new Date()
    };

    // Calculate health score based on multiple factors
    updatedNode.healthScore = this.calculateHealthScore(updatedNode);

    this.nodeMetrics.set(nodeId, updatedNode);

    // Check for node state changes
    if (updatedNode.consecutiveFailures > 3 && node.consecutiveFailures <= 3) {
      this.handleNodeFailure(nodeId);
    } else if (updatedNode.consecutiveFailures === 0 && node.consecutiveFailures > 0) {
      this.handleNodeRecovery(nodeId);
    }

    this.emit('nodeMetricsUpdated', { nodeId, metrics: updatedNode });
  }

  private calculateHealthScore(node: NodeMetrics): number {
    let score = 100;

    // Deduct for availability issues
    score -= (100 - node.availability) * 0.5;

    // Deduct for high response time
    if (node.responseTime > 1000) {
      score -= Math.min(30, (node.responseTime - 1000) / 100);
    }

    // Deduct for error rate
    score -= node.errorRate * 2;

    // Deduct for consecutive failures
    score -= node.consecutiveFailures * 10;

    return Math.max(0, Math.min(100, score));
  }

  private handleNodeFailure(nodeId: string): void {
    console.warn(`Node ${nodeId} failure detected`);
    
    const incident: AvailabilityIncident = {
      id: `incident_${Date.now()}_${nodeId}`,
      startTime: new Date(),
      duration: 0,
      severity: 'MAJOR',
      affectedNodes: [nodeId],
      cause: 'Node failure',
      resolved: false,
      impact: {
        availabilityDrop: 100 / this.systemMetrics.nodeCount,
        usersAffected: Math.floor(Math.random() * 1000) + 100,
        transactionsLost: Math.floor(Math.random() * 100) + 10
      }
    };

    this.incidents.set(incident.id, incident);
    this.metrics.incidents.push(incident);
    this.systemMetrics.healthyNodes--;

    this.emit('incidentStarted', { incident });
    this.checkAlertRules();
  }

  private handleNodeRecovery(nodeId: string): void {
    console.log(`Node ${nodeId} recovered`);
    
    // Find and resolve related incidents
    for (const [incidentId, incident] of this.incidents) {
      if (!incident.resolved && incident.affectedNodes.includes(nodeId)) {
        incident.endTime = new Date();
        incident.duration = (incident.endTime.getTime() - incident.startTime.getTime()) / 1000;
        incident.resolved = true;
        
        this.incidents.set(incidentId, incident);
        this.emit('incidentResolved', { incident });
      }
    }

    this.systemMetrics.healthyNodes++;
    this.checkAlertRules();
  }

  private startMonitoring(): void {
    this.checkInterval = setInterval(() => {
      this.performHealthCheck();
      this.updateSystemMetrics();
      this.checkAlertRules();
      this.cleanupOldIncidents();
    }, this.config.checkInterval * 1000);
  }

  private performHealthCheck(): void {
    const now = new Date();
    
    for (const [nodeId, node] of this.nodeMetrics) {
      const timeSinceLastSeen = now.getTime() - node.lastSeen.getTime();
      const maxSilentTime = this.config.checkInterval * 2000; // 2x check interval

      if (timeSinceLastSeen > maxSilentTime) {
        // Node appears to be down
        this.updateNodeMetrics(nodeId, {
          availability: Math.max(0, node.availability - 1),
          consecutiveFailures: node.consecutiveFailures + 1
        });
      } else {
        // Node is responding
        this.updateNodeMetrics(nodeId, {
          availability: Math.min(100, node.availability + 0.5),
          consecutiveFailures: 0,
          responseTime: Math.random() * 200 + 50, // Simulate response time
          errorRate: Math.random() * 2 // Simulate error rate
        });
      }
    }
  }

  private updateSystemMetrics(): void {
    const nodes = Array.from(this.nodeMetrics.values());
    
    if (nodes.length === 0) return;

    // Calculate overall availability
    const totalAvailability = nodes.reduce((sum, node) => sum + node.availability, 0);
    this.systemMetrics.overallAvailability = totalAvailability / nodes.length;

    // Calculate average response time
    const totalResponseTime = nodes.reduce((sum, node) => sum + node.responseTime, 0);
    this.systemMetrics.averageResponseTime = totalResponseTime / nodes.length;

    // Calculate average error rate
    const totalErrorRate = nodes.reduce((sum, node) => sum + node.errorRate, 0);
    this.systemMetrics.averageErrorRate = totalErrorRate / nodes.length;

    // Update availability metrics
    this.updateAvailabilityMetrics();

    // Simulate other system metrics
    this.systemMetrics.consensusHealth = Math.max(0, 100 - (this.systemMetrics.averageErrorRate * 10));
    this.systemMetrics.networkHealth = Math.max(0, 100 - (this.systemMetrics.averageResponseTime / 20));
    this.systemMetrics.storageHealth = 95 + Math.random() * 5; // Simulate good storage health

    this.emit('systemMetricsUpdated', this.systemMetrics);
  }

  private updateAvailabilityMetrics(): void {
    const now = new Date();
    const totalRuntime = (now.getTime() - this.startTime.getTime()) / 1000;
    
    // Calculate downtime from active incidents
    let currentDowntime = 0;
    for (const incident of this.incidents.values()) {
      if (!incident.resolved) {
        currentDowntime += (now.getTime() - incident.startTime.getTime()) / 1000;
      } else {
        currentDowntime += incident.duration;
      }
    }

    this.metrics.downtime = currentDowntime;
    this.metrics.totalUptime = totalRuntime - currentDowntime;
    this.metrics.uptime = totalRuntime > 0 ? (this.metrics.totalUptime / totalRuntime) * 100 : 100;
    this.metrics.slaCompliance = this.metrics.uptime >= this.config.slaTarget;

    // Update streaks
    if (this.metrics.uptime >= this.config.slaTarget) {
      this.metrics.currentStreak = totalRuntime;
      if (this.metrics.currentStreak > this.metrics.longestStreak) {
        this.metrics.longestStreak = this.metrics.currentStreak;
      }
    } else {
      this.metrics.currentStreak = 0;
    }

    this.emit('availabilityMetricsUpdated', this.metrics);
  }

  private checkAlertRules(): void {
    for (const [ruleId, rule] of this.alertRules) {
      if (!rule.isActive) continue;

      const shouldTrigger = this.evaluateAlertRule(rule);
      
      if (shouldTrigger) {
        const now = new Date();
        const cooldownPassed = !rule.lastTriggered || 
          (now.getTime() - rule.lastTriggered.getTime()) > (this.config.alertCooldown * 1000);

        if (cooldownPassed) {
          this.triggerAlert(rule);
          rule.lastTriggered = now;
          this.alertRules.set(ruleId, rule);
        }
      }
    }
  }

  private evaluateAlertRule(rule: AlertRule): boolean {
    switch (rule.id) {
      case 'availability-drop':
        return this.systemMetrics.overallAvailability < rule.threshold;
      case 'node-failure':
        return this.systemMetrics.healthyNodes < this.systemMetrics.nodeCount * rule.threshold;
      case 'high-latency':
        return this.systemMetrics.averageResponseTime > rule.threshold;
      case 'consensus-degradation':
        return this.systemMetrics.consensusHealth < rule.threshold;
      case 'error-spike':
        return this.systemMetrics.averageErrorRate > rule.threshold;
      default:
        return false;
    }
  }

  private triggerAlert(rule: AlertRule): void {
    const alert = {
      id: `alert_${Date.now()}_${rule.id}`,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      timestamp: new Date(),
      message: this.generateAlertMessage(rule),
      metrics: { ...this.systemMetrics },
      notificationChannels: rule.notificationChannels
    };

    console.log(`Alert triggered: ${rule.name} (${rule.severity})`);
    this.emit('alertTriggered', alert);

    if (this.config.enableNotifications) {
      this.sendNotifications(alert);
    }
  }

  private generateAlertMessage(rule: AlertRule): string {
    switch (rule.id) {
      case 'availability-drop':
        return `System availability (${this.systemMetrics.overallAvailability.toFixed(2)}%) dropped below SLA target (${rule.threshold}%)`;
      case 'node-failure':
        return `${this.systemMetrics.nodeCount - this.systemMetrics.healthyNodes} nodes failed, only ${this.systemMetrics.healthyNodes}/${this.systemMetrics.nodeCount} healthy`;
      case 'high-latency':
        return `High response time detected: ${this.systemMetrics.averageResponseTime.toFixed(0)}ms (threshold: ${rule.threshold}ms)`;
      case 'consensus-degradation':
        return `Consensus health degraded: ${this.systemMetrics.consensusHealth.toFixed(1)}% (threshold: ${rule.threshold}%)`;
      case 'error-spike':
        return `Error rate spike detected: ${this.systemMetrics.averageErrorRate.toFixed(1)}% (threshold: ${rule.threshold}%)`;
      default:
        return `Alert triggered for rule: ${rule.name}`;
    }
  }

  private sendNotifications(alert: any): void {
    // Simulate sending notifications
    console.log(`Sending notifications for alert: ${alert.message}`);
    console.log(`Channels: ${alert.notificationChannels.join(', ')}`);
  }

  private cleanupOldIncidents(): void {
    const cutoffDate = new Date(Date.now() - (this.config.retentionPeriod * 24 * 60 * 60 * 1000));
    
    for (const [incidentId, incident] of this.incidents) {
      if (incident.startTime < cutoffDate && incident.resolved) {
        this.incidents.delete(incidentId);
        this.metrics.incidents = this.metrics.incidents.filter(i => i.id !== incidentId);
      }
    }
  }

  getAvailabilityMetrics(): AvailabilityMetrics {
    return { ...this.metrics };
  }

  getSystemMetrics(): SystemMetrics {
    return { ...this.systemMetrics };
  }

  getNodeMetrics(): NodeMetrics[] {
    return Array.from(this.nodeMetrics.values());
  }

  getActiveIncidents(): AvailabilityIncident[] {
    return Array.from(this.incidents.values()).filter(i => !i.resolved);
  }

  getAllIncidents(): AvailabilityIncident[] {
    return Array.from(this.incidents.values());
  }

  getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  async shutdown(): Promise<void> {
    this.isRunning = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    console.log('Availability monitor shutdown complete');
  }
}
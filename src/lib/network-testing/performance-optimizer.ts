import { EventEmitter } from 'events';

export interface NetworkMetrics {
  timestamp: Date;
  tps: number;
  latency: {
    min: number;
    max: number;
    avg: number;
    p95: number;
    p99: number;
  };
  throughput: {
    upload: number;
    download: number;
  };
  availability: number;
  errorRate: number;
  resourceUsage: {
    cpu: number;
    memory: number;
    network: number;
    storage: number;
  };
  topology: {
    nodes: number;
    connections: number;
    regions: string[];
  };
}

export interface PerformanceIssue {
  id: string;
  type: 'bottleneck' | 'inefficiency' | 'misconfiguration' | 'resource-constraint' | 'network-issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'performance' | 'reliability' | 'scalability' | 'cost';
  description: string;
  detectedAt: Date;
  metrics: {
    current: number;
    baseline: number;
    threshold: number;
    impact: number; // 0-1
  };
  affectedComponents: string[];
  rootCauses: string[];
  recommendations: string[];
}

export interface OptimizationRecommendation {
  id: string;
  title: string;
  description: string;
  category: 'infrastructure' | 'configuration' | 'architecture' | 'monitoring' | 'cost';
  priority: 'low' | 'medium' | 'high' | 'critical';
  effort: 'low' | 'medium' | 'high';
  impact: {
    performance: number; // 0-100
    reliability: number; // 0-100
    cost: number; // -100 to 100 (negative = cost increase)
  };
  implementation: {
    steps: string[];
    duration: number; // in hours
    resources: {
      cpu: number;
      memory: number;
      network: number;
      storage: number;
    };
    risks: string[];
    rollbackPlan: string;
  };
  estimatedBenefits: {
    tpsImprovement: number; // percentage
    latencyReduction: number; // percentage
    availabilityImprovement: number; // percentage
    costSavings: number; // percentage
  };
  prerequisites: string[];
  dependencies: string[];
}

export interface OptimizationPlan {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  status: 'draft' | 'approved' | 'in-progress' | 'completed' | 'cancelled';
  recommendations: OptimizationRecommendation[];
  timeline: {
    startDate: Date;
    endDate: Date;
    milestones: {
      name: string;
      date: Date;
      completed: boolean;
    }[];
  };
  budget: {
    estimated: number;
    actual: number;
    currency: string;
  };
  successMetrics: {
    kpis: { [key: string]: { target: number; current: number } };
  };
}

export interface PerformanceBaseline {
  id: string;
  name: string;
  description: string;
  metrics: {
    tps: { target: number; acceptable: number };
    latency: { target: number; acceptable: number };
    availability: { target: number; acceptable: number };
    errorRate: { target: number; acceptable: number };
    resourceUsage: {
      cpu: { target: number; acceptable: number };
      memory: { target: number; acceptable: number };
      network: { target: number; acceptable: number };
      storage: { target: number; acceptable: number };
    };
  };
  topology: {
    nodes: number;
    regions: string[];
    configuration: { [key: string]: any };
  };
  createdAt: Date;
  lastUpdated: Date;
}

export class PerformanceOptimizer extends EventEmitter {
  private metricsHistory: NetworkMetrics[] = [];
  private performanceIssues: Map<string, PerformanceIssue> = new Map();
  private optimizationRecommendations: Map<string, OptimizationRecommendation> = new Map();
  private optimizationPlans: Map<string, OptimizationPlan> = new Map();
  private performanceBaselines: Map<string, PerformanceBaseline> = new Map();

  constructor() {
    super();
    this.initializeBaselines();
    this.initializeRecommendationTemplates();
  }

  private initializeBaselines(): void {
    const baselines: PerformanceBaseline[] = [
      {
        id: 'production-baseline',
        name: 'Production Performance Baseline',
        description: 'Baseline metrics for production environment',
        metrics: {
          tps: { target: 75000, acceptable: 50000 },
          latency: { target: 50, acceptable: 100 },
          availability: { target: 99.99, acceptable: 99.9 },
          errorRate: { target: 0.1, acceptable: 1.0 },
          resourceUsage: {
            cpu: { target: 70, acceptable: 85 },
            memory: { target: 75, acceptable: 90 },
            network: { target: 60, acceptable: 80 },
            storage: { target: 50, acceptable: 75 }
          }
        },
        topology: {
          nodes: 500,
          regions: ['us-east', 'us-west', 'eu-central', 'asia-southeast', 'asia-northeast'],
          configuration: { environment: 'production', sharding: true, replication: 3 }
        },
        createdAt: new Date(),
        lastUpdated: new Date()
      },
      {
        id: 'staging-baseline',
        name: 'Staging Performance Baseline',
        description: 'Baseline metrics for staging environment',
        metrics: {
          tps: { target: 25000, acceptable: 15000 },
          latency: { target: 75, acceptable: 150 },
          availability: { target: 99.9, acceptable: 99.5 },
          errorRate: { target: 0.5, acceptable: 2.0 },
          resourceUsage: {
            cpu: { target: 60, acceptable: 80 },
            memory: { target: 65, acceptable: 85 },
            network: { target: 50, acceptable: 70 },
            storage: { target: 40, acceptable: 65 }
          }
        },
        topology: {
          nodes: 100,
          regions: ['us-east', 'eu-central'],
          configuration: { environment: 'staging', sharding: true, replication: 2 }
        },
        createdAt: new Date(),
        lastUpdated: new Date()
      }
    ];

    baselines.forEach(baseline => {
      this.performanceBaselines.set(baseline.id, baseline);
    });
  }

  private initializeRecommendationTemplates(): void {
    const templates: OptimizationRecommendation[] = [
      {
        id: 'scale-horizontally',
        title: 'Scale Horizontally',
        description: 'Add more nodes to distribute load and improve throughput',
        category: 'infrastructure',
        priority: 'high',
        effort: 'medium',
        impact: { performance: 80, reliability: 60, cost: -50 },
        implementation: {
          steps: [
            'Analyze current node utilization',
            'Identify bottleneck regions',
            'Provision additional nodes',
            'Update load balancer configuration',
            'Monitor performance improvements'
          ],
          duration: 24,
          resources: { cpu: 10, memory: 20, network: 100, storage: 50 },
          risks: ['Increased complexity', 'Higher operational costs'],
          rollbackPlan: 'Remove added nodes and restore previous configuration'
        },
        estimatedBenefits: {
          tpsImprovement: 50,
          latencyReduction: 30,
          availabilityImprovement: 10,
          costSavings: -20
        },
        prerequisites: ['Available infrastructure capacity', 'Load balancer support'],
        dependencies: []
      },
      {
        id: 'optimize-database',
        title: 'Optimize Database Performance',
        description: 'Improve database indexing and query optimization',
        category: 'configuration',
        priority: 'medium',
        effort: 'high',
        impact: { performance: 70, reliability: 40, cost: 10 },
        implementation: {
          steps: [
            'Analyze slow queries',
            'Add missing indexes',
            'Optimize query patterns',
            'Update database configuration',
            'Test performance improvements'
          ],
          duration: 48,
          resources: { cpu: 5, memory: 15, network: 50, storage: 100 },
          risks: ['Data migration risks', 'Temporary downtime'],
          rollbackPlan: 'Restore database from backup before changes'
        },
        estimatedBenefits: {
          tpsImprovement: 35,
          latencyReduction: 40,
          availabilityImprovement: 5,
          costSavings: 15
        },
        prerequisites: ['Database admin access', 'Maintenance window'],
        dependencies: []
      },
      {
        id: 'implement-caching',
        title: 'Implement Caching Layer',
        description: 'Add Redis or Memcached caching for frequently accessed data',
        category: 'architecture',
        priority: 'medium',
        effort: 'medium',
        impact: { performance: 85, reliability: 30, cost: -20 },
        implementation: {
          steps: [
            'Identify cacheable data',
            'Design cache architecture',
            'Implement caching layer',
            'Update application code',
            'Monitor cache hit rates'
          ],
          duration: 36,
          resources: { cpu: 8, memory: 25, network: 75, storage: 30 },
          risks: ['Cache invalidation issues', 'Increased memory usage'],
          rollbackPlan: 'Disable caching and revert to direct database access'
        },
        estimatedBenefits: {
          tpsImprovement: 60,
          latencyReduction: 50,
          availabilityImprovement: 5,
          costSavings: -15
        },
        prerequisites: ['Available memory resources', 'Application code access'],
        dependencies: []
      },
      {
        id: 'upgrade-network',
        title: 'Upgrade Network Infrastructure',
        description: 'Increase network bandwidth and reduce latency',
        category: 'infrastructure',
        priority: 'high',
        effort: 'high',
        impact: { performance: 75, reliability: 70, cost: -60 },
        implementation: {
          steps: [
            'Analyze current network bottlenecks',
            'Select network upgrade options',
            'Procure network equipment',
            'Schedule maintenance window',
            'Upgrade network infrastructure'
          ],
          duration: 72,
          resources: { cpu: 5, memory: 10, network: 200, storage: 20 },
          risks: ['Service disruption during upgrade', 'Configuration errors'],
          rollbackPlan: 'Revert to previous network configuration'
        },
        estimatedBenefits: {
          tpsImprovement: 40,
          latencyReduction: 60,
          availabilityImprovement: 15,
          costSavings: -40
        },
        prerequisites: ['Budget approval', 'Maintenance window'],
        dependencies: []
      },
      {
        id: 'optimize-consensus',
        title: 'Optimize Consensus Algorithm',
        description: 'Tune consensus parameters for better performance',
        category: 'configuration',
        priority: 'medium',
        effort: 'low',
        impact: { performance: 65, reliability: 50, cost: 5 },
        implementation: {
          steps: [
            'Analyze current consensus performance',
            'Identify optimization opportunities',
            'Adjust consensus parameters',
            'Test in staging environment',
            'Deploy to production'
          ],
          duration: 12,
          resources: { cpu: 3, memory: 8, network: 30, storage: 15 },
          risks: ['Consensus instability', 'Network partition risks'],
          rollbackPlan: 'Restore previous consensus configuration'
        },
        estimatedBenefits: {
          tpsImprovement: 25,
          latencyReduction: 35,
          availabilityImprovement: 10,
          costSavings: 10
        },
        prerequisites: ['Consensus algorithm expertise', 'Test environment'],
        dependencies: []
      },
      {
        id: 'implement-monitoring',
        title: 'Implement Advanced Monitoring',
        description: 'Add comprehensive monitoring and alerting',
        category: 'monitoring',
        priority: 'medium',
        effort: 'medium',
        impact: { performance: 30, reliability: 80, cost: -25 },
        implementation: {
          steps: [
            'Select monitoring tools',
            'Design monitoring architecture',
            'Implement metrics collection',
            'Configure alerting rules',
            'Create dashboards'
          ],
          duration: 40,
          resources: { cpu: 6, memory: 12, network: 80, storage: 40 },
          risks: ['Monitoring overhead', 'Alert fatigue'],
          rollbackPlan: 'Disable monitoring and revert to basic logging'
        },
        estimatedBenefits: {
          tpsImprovement: 10,
          latencyReduction: 15,
          availabilityImprovement: 25,
          costSavings: -20
        },
        prerequisites: ['Monitoring tool access', 'Alert management system'],
        dependencies: []
      }
    ];

    templates.forEach(template => {
      this.optimizationRecommendations.set(template.id, template);
    });
  }

  // Public API methods
  addMetrics(metrics: NetworkMetrics): void {
    this.metricsHistory.push(metrics);
    
    // Keep only last 1000 metrics entries
    if (this.metricsHistory.length > 1000) {
      this.metricsHistory = this.metricsHistory.slice(-1000);
    }

    // Analyze metrics for performance issues
    this.analyzePerformanceIssues(metrics);
    
    this.emit('metricsAdded', metrics);
  }

  private analyzePerformanceIssues(metrics: NetworkMetrics): void {
    const baseline = this.performanceBaselines.get('production-baseline');
    if (!baseline) return;

    const issues: PerformanceIssue[] = [];

    // Check TPS
    if (metrics.tps < baseline.metrics.tps.acceptable) {
      issues.push({
        id: `tps-low-${Date.now()}`,
        type: 'bottleneck',
        severity: 'high',
        category: 'performance',
        description: 'TPS below acceptable threshold',
        detectedAt: new Date(),
        metrics: {
          current: metrics.tps,
          baseline: baseline.metrics.tps.target,
          threshold: baseline.metrics.tps.acceptable,
          impact: 0.8
        },
        affectedComponents: ['transaction-processor', 'consensus-layer'],
        rootCauses: ['Network congestion', 'Resource constraints', 'Configuration issues'],
        recommendations: [
          'Scale horizontally by adding more nodes',
          'Optimize consensus algorithm parameters',
          'Increase network bandwidth'
        ]
      });
    }

    // Check latency
    if (metrics.latency.avg > baseline.metrics.latency.acceptable) {
      issues.push({
        id: `latency-high-${Date.now()}`,
        type: 'network-issue',
        severity: 'medium',
        category: 'performance',
        description: 'Average latency above acceptable threshold',
        detectedAt: new Date(),
        metrics: {
          current: metrics.latency.avg,
          baseline: baseline.metrics.latency.target,
          threshold: baseline.metrics.latency.acceptable,
          impact: 0.6
        },
        affectedComponents: ['network-layer', 'data-transmission'],
        rootCauses: ['Network distance', 'Bandwidth limitations', 'Routing inefficiencies'],
        recommendations: [
          'Implement content delivery network',
          'Optimize network routing',
          'Increase bandwidth capacity'
        ]
      });
    }

    // Check availability
    if (metrics.availability < baseline.metrics.availability.acceptable) {
      issues.push({
        id: `availability-low-${Date.now()}`,
        type: 'resource-constraint',
        severity: 'critical',
        category: 'reliability',
        description: 'Availability below acceptable threshold',
        detectedAt: new Date(),
        metrics: {
          current: metrics.availability,
          baseline: baseline.metrics.availability.target,
          threshold: baseline.metrics.availability.acceptable,
          impact: 0.9
        },
        affectedComponents: ['node-infrastructure', 'load-balancer'],
        rootCauses: ['Node failures', 'Network partitions', 'Software bugs'],
        recommendations: [
          'Implement automatic failover',
          'Add redundant nodes',
          'Improve monitoring and alerting'
        ]
      });
    }

    // Check error rate
    if (metrics.errorRate > baseline.metrics.errorRate.acceptable) {
      issues.push({
        id: `error-rate-high-${Date.now()}`,
        type: 'inefficiency',
        severity: 'medium',
        category: 'reliability',
        description: 'Error rate above acceptable threshold',
        detectedAt: new Date(),
        metrics: {
          current: metrics.errorRate,
          baseline: baseline.metrics.errorRate.target,
          threshold: baseline.metrics.errorRate.acceptable,
          impact: 0.5
        },
        affectedComponents: ['application-layer', 'database-layer'],
        rootCauses: ['Software bugs', 'Resource exhaustion', 'Configuration errors'],
        recommendations: [
          'Implement error handling and retry logic',
          'Add resource monitoring',
          'Review application logs for errors'
        ]
      });
    }

    // Check resource usage
    const resourceChecks = [
      { resource: 'cpu', current: metrics.resourceUsage.cpu, target: baseline.metrics.resourceUsage.cpu },
      { resource: 'memory', current: metrics.resourceUsage.memory, target: baseline.metrics.resourceUsage.memory },
      { resource: 'network', current: metrics.resourceUsage.network, target: baseline.metrics.resourceUsage.network },
      { resource: 'storage', current: metrics.resourceUsage.storage, target: baseline.metrics.resourceUsage.storage }
    ];

    resourceChecks.forEach(check => {
      if (check.current > check.target.acceptable) {
        issues.push({
          id: `${check.resource}-high-${Date.now()}`,
          type: 'resource-constraint',
          severity: check.current > check.target.acceptable * 1.2 ? 'high' : 'medium',
          category: 'performance',
          description: `${check.resource.toUpperCase()} usage above acceptable threshold`,
          detectedAt: new Date(),
          metrics: {
            current: check.current,
            baseline: check.target.target,
            threshold: check.target.acceptable,
            impact: 0.4
          },
          affectedComponents: [`${check.resource}-resources`, 'system-performance'],
          rootCauses: [`${check.resource} intensive processes`, 'Insufficient resources', 'Memory leaks'],
          recommendations: [
            `Scale ${check.resource} resources`,
            `Optimize ${check.resource} usage`,
            `Implement ${check.resource} monitoring`
          ]
        });
      }
    });

    // Add new issues to the map
    issues.forEach(issue => {
      this.performanceIssues.set(issue.id, issue);
      this.emit('issueDetected', issue);
    });

    // Generate optimization recommendations based on issues
    this.generateOptimizationRecommendations(issues);
  }

  private generateOptimizationRecommendations(issues: PerformanceIssue[]): void {
    // Map issues to existing recommendations
    const issueToRecommendation: { [key: string]: string[] } = {
      'tps-low': ['scale-horizontally', 'optimize-database', 'implement-caching'],
      'latency-high': ['upgrade-network', 'implement-caching', 'optimize-consensus'],
      'availability-low': ['scale-horizontally', 'implement-monitoring'],
      'error-rate-high': ['optimize-database', 'implement-monitoring'],
      'cpu-high': ['scale-horizontally', 'optimize-database'],
      'memory-high': ['implement-caching', 'optimize-database'],
      'network-high': ['upgrade-network', 'implement-caching'],
      'storage-high': ['optimize-database']
    };

    issues.forEach(issue => {
      const issueType = issue.id.split('-')[0] + '-' + issue.id.split('-')[1];
      const recommendationIds = issueToRecommendation[issueType] || [];

      recommendationIds.forEach(recId => {
        const recommendation = this.optimizationRecommendations.get(recId);
        if (recommendation) {
          // Customize recommendation based on issue
          const customizedRec = this.customizeRecommendation(recommendation, issue);
          this.optimizationRecommendations.set(recId + '-' + issue.id, customizedRec);
          this.emit('recommendationGenerated', customizedRec);
        }
      });
    });
  }

  private customizeRecommendation(baseRec: OptimizationRecommendation, issue: PerformanceIssue): OptimizationRecommendation {
    return {
      ...baseRec,
      id: baseRec.id + '-' + issue.id,
      title: `${baseRec.title} for ${issue.description}`,
      description: `${baseRec.description}. Addressing: ${issue.description}`,
      priority: this.calculatePriority(baseRec.priority, issue.severity),
      estimatedBenefits: {
        ...baseRec.estimatedBenefits,
        tpsImprovement: Math.max(0, baseRec.estimatedBenefits.tpsImprovement * issue.metrics.impact),
        latencyReduction: Math.max(0, baseRec.estimatedBenefits.latencyReduction * issue.metrics.impact)
      }
    };
  }

  private calculatePriority(basePriority: string, severity: string): 'low' | 'medium' | 'high' | 'critical' {
    const priorityMap = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
    const severityMap = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };

    const combined = priorityMap[basePriority as keyof typeof priorityMap] + 
                   severityMap[severity as keyof typeof severityMap];

    if (combined >= 7) return 'critical';
    if (combined >= 5) return 'high';
    if (combined >= 3) return 'medium';
    return 'low';
  }

  getPerformanceIssues(): PerformanceIssue[] {
    return Array.from(this.performanceIssues.values())
      .sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
  }

  getOptimizationRecommendations(): OptimizationRecommendation[] {
    return Array.from(this.optimizationRecommendations.values())
      .sort((a, b) => {
        const priorityMap = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
        return priorityMap[b.priority as keyof typeof priorityMap] - 
               priorityMap[a.priority as keyof typeof priorityMap];
      });
  }

  createOptimizationPlan(config: {
    name: string;
    description: string;
    recommendationIds: string[];
    timeline: {
      startDate: Date;
      endDate: Date;
    };
    budget: number;
  }): OptimizationPlan {
    const planId = `plan-${Date.now()}`;
    const recommendations = config.recommendationIds
      .map(id => this.optimizationRecommendations.get(id))
      .filter(Boolean) as OptimizationRecommendation[];

    const plan: OptimizationPlan = {
      id: planId,
      name: config.name,
      description: config.description,
      createdAt: new Date(),
      status: 'draft',
      recommendations,
      timeline: {
        startDate: config.timeline.startDate,
        endDate: config.timeline.endDate,
        milestones: recommendations.map((rec, index) => ({
          name: `Complete ${rec.title}`,
          date: new Date(config.timeline.startDate.getTime() + (config.timeline.endDate.getTime() - config.timeline.startDate.getTime()) * (index + 1) / recommendations.length),
          completed: false
        }))
      },
      budget: {
        estimated: config.budget,
        actual: 0,
        currency: 'USD'
      },
      successMetrics: {
        kpis: {
          'tps-improvement': { target: 50, current: 0 },
          'latency-reduction': { target: 30, current: 0 },
          'availability-improvement': { target: 10, current: 0 },
          'cost-savings': { target: 20, current: 0 }
        }
      }
    };

    this.optimizationPlans.set(planId, plan);
    this.emit('planCreated', plan);

    return plan;
  }

  getOptimizationPlans(): OptimizationPlan[] {
    return Array.from(this.optimizationPlans.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getOptimizationPlan(planId: string): OptimizationPlan | undefined {
    return this.optimizationPlans.get(planId);
  }

  updatePlanStatus(planId: string, status: OptimizationPlan['status']): boolean {
    const plan = this.optimizationPlans.get(planId);
    if (!plan) return false;

    plan.status = status;
    this.emit('planUpdated', plan);
    return true;
  }

  getPerformanceBaselines(): PerformanceBaseline[] {
    return Array.from(this.performanceBaselines.values());
  }

  getPerformanceBaseline(baselineId: string): PerformanceBaseline | undefined {
    return this.performanceBaselines.get(baselineId);
  }

  createPerformanceBaseline(config: {
    name: string;
    description: string;
    metrics: PerformanceBaseline['metrics'];
    topology: PerformanceBaseline['topology'];
  }): PerformanceBaseline {
    const baseline: PerformanceBaseline = {
      id: `baseline-${Date.now()}`,
      name: config.name,
      description: config.description,
      metrics: config.metrics,
      topology: config.topology,
      createdAt: new Date(),
      lastUpdated: new Date()
    };

    this.performanceBaselines.set(baseline.id, baseline);
    this.emit('baselineCreated', baseline);

    return baseline;
  }

  generatePerformanceReport(baselineId?: string): {
    summary: {
      overallHealth: number; // 0-100
      issuesCount: number;
      recommendationsCount: number;
      criticalIssues: number;
    };
    trends: {
      tps: { current: number; trend: 'improving' | 'declining' | 'stable' };
      latency: { current: number; trend: 'improving' | 'declining' | 'stable' };
      availability: { current: number; trend: 'improving' | 'declining' | 'stable' };
    };
    topIssues: PerformanceIssue[];
    topRecommendations: OptimizationRecommendation[];
    insights: string[];
  } {
    const baseline = baselineId ? this.performanceBaselines.get(baselineId) : 
                       this.performanceBaselines.get('production-baseline');
    
    if (!baseline || this.metricsHistory.length === 0) {
      return {
        summary: { overallHealth: 0, issuesCount: 0, recommendationsCount: 0, criticalIssues: 0 },
        trends: { tps: { current: 0, trend: 'stable' }, latency: { current: 0, trend: 'stable' }, availability: { current: 0, trend: 'stable' } },
        topIssues: [],
        topRecommendations: [],
        insights: ['Insufficient data for analysis']
      };
    }

    const recentMetrics = this.metricsHistory.slice(-10); // Last 10 metrics
    const issues = Array.from(this.performanceIssues.values());
    const recommendations = Array.from(this.optimizationRecommendations.values());

    // Calculate overall health score
    const healthScore = this.calculateOverallHealthScore(recentMetrics, baseline);
    
    // Calculate trends
    const trends = this.calculateTrends(recentMetrics);
    
    // Get top issues and recommendations
    const topIssues = issues
      .sort((a, b) => {
        const severityMap = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
        return severityMap[b.severity as keyof typeof severityMap] - 
               severityMap[a.severity as keyof typeof severityMap];
      })
      .slice(0, 5);

    const topRecommendations = recommendations
      .sort((a, b) => {
        const priorityMap = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
        return priorityMap[b.priority as keyof typeof priorityMap] - 
               priorityMap[a.priority as keyof typeof priorityMap];
      })
      .slice(0, 5);

    // Generate insights
    const insights = this.generateInsights(recentMetrics, issues, recommendations, baseline);

    return {
      summary: {
        overallHealth: healthScore,
        issuesCount: issues.length,
        recommendationsCount: recommendations.length,
        criticalIssues: issues.filter(i => i.severity === 'critical').length
      },
      trends,
      topIssues,
      topRecommendations,
      insights
    };
  }

  private calculateOverallHealthScore(metrics: NetworkMetrics[], baseline: PerformanceBaseline): number {
    if (metrics.length === 0) return 0;

    const latestMetrics = metrics[metrics.length - 1];
    let score = 100;

    // TPS score
    const tpsScore = Math.min(100, (latestMetrics.tps / baseline.metrics.tps.target) * 100);
    score = (score + tpsScore) / 2;

    // Latency score
    const latencyScore = Math.min(100, (baseline.metrics.latency.target / latestMetrics.latency.avg) * 100);
    score = (score + latencyScore) / 2;

    // Availability score
    const availabilityScore = latestMetrics.availability;
    score = (score + availabilityScore) / 2;

    // Error rate score
    const errorRateScore = Math.max(0, 100 - (latestMetrics.errorRate / baseline.metrics.errorRate.target) * 100);
    score = (score + errorRateScore) / 2;

    // Resource usage scores
    const resourceScores = [
      Math.max(0, 100 - (latestMetrics.resourceUsage.cpu / baseline.metrics.resourceUsage.cpu.target) * 100),
      Math.max(0, 100 - (latestMetrics.resourceUsage.memory / baseline.metrics.resourceUsage.memory.target) * 100),
      Math.max(0, 100 - (latestMetrics.resourceUsage.network / baseline.metrics.resourceUsage.network.target) * 100),
      Math.max(0, 100 - (latestMetrics.resourceUsage.storage / baseline.metrics.resourceUsage.storage.target) * 100)
    ];
    const avgResourceScore = resourceScores.reduce((a, b) => a + b, 0) / resourceScores.length;
    score = (score + avgResourceScore) / 2;

    return Math.round(score);
  }

  private calculateTrends(metrics: NetworkMetrics[]): {
    tps: { current: number; trend: 'improving' | 'declining' | 'stable' };
    latency: { current: number; trend: 'improving' | 'declining' | 'stable' };
    availability: { current: number; trend: 'improving' | 'declining' | 'stable' };
  } {
    if (metrics.length < 2) {
      return {
        tps: { current: 0, trend: 'stable' },
        latency: { current: 0, trend: 'stable' },
        availability: { current: 0, trend: 'stable' }
      };
    }

    const recent = metrics.slice(-5);
    const older = metrics.slice(-10, -5);

    const calculateTrend = (recentValues: number[], olderValues: number[]): 'improving' | 'declining' | 'stable' => {
      if (olderValues.length === 0) return 'stable';
      
      const recentAvg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
      const olderAvg = olderValues.reduce((a, b) => a + b, 0) / olderValues.length;
      const change = ((recentAvg - olderAvg) / olderAvg) * 100;

      if (Math.abs(change) < 5) return 'stable';
      return change > 0 ? 'improving' : 'declining';
    };

    return {
      tps: {
        current: recent[recent.length - 1].tps,
        trend: calculateTrend(recent.map(m => m.tps), older.map(m => m.tps))
      },
      latency: {
        current: recent[recent.length - 1].latency.avg,
        trend: calculateTrend(recent.map(m => m.latency.avg), older.map(m => m.latency.avg)) === 'declining' ? 'improving' : 
               calculateTrend(recent.map(m => m.latency.avg), older.map(m => m.latency.avg)) === 'improving' ? 'declining' : 'stable'
      },
      availability: {
        current: recent[recent.length - 1].availability,
        trend: calculateTrend(recent.map(m => m.availability), older.map(m => m.availability))
      }
    };
  }

  private generateInsights(
    metrics: NetworkMetrics[],
    issues: PerformanceIssue[],
    recommendations: OptimizationRecommendation[],
    baseline: PerformanceBaseline
  ): string[] {
    const insights: string[] = [];

    // Performance insights
    const avgTps = metrics.reduce((sum, m) => sum + m.tps, 0) / metrics.length;
    if (avgTps < baseline.metrics.tps.target * 0.8) {
      insights.push('TPS consistently below target, consider scaling or optimization');
    }

    const avgLatency = metrics.reduce((sum, m) => sum + m.latency.avg, 0) / metrics.length;
    if (avgLatency > baseline.metrics.latency.target * 1.5) {
      insights.push('High latency detected, investigate network and database performance');
    }

    // Resource insights
    const avgCpu = metrics.reduce((sum, m) => sum + m.resourceUsage.cpu, 0) / metrics.length;
    if (avgCpu > baseline.metrics.resourceUsage.cpu.acceptable) {
      insights.push('High CPU usage observed, consider scaling or optimization');
    }

    const avgMemory = metrics.reduce((sum, m) => sum + m.resourceUsage.memory, 0) / metrics.length;
    if (avgMemory > baseline.metrics.resourceUsage.memory.acceptable) {
      insights.push('Memory usage approaching limits, monitor for memory leaks');
    }

    // Issue-based insights
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      insights.push(`${criticalIssues.length} critical issues require immediate attention`);
    }

    // Recommendation-based insights
    const highPriorityRecs = recommendations.filter(r => r.priority === 'critical' || r.priority === 'high');
    if (highPriorityRecs.length > 3) {
      insights.push('Multiple high-priority optimizations available, consider creating an optimization plan');
    }

    // Trend insights
    const recentMetrics = metrics.slice(-5);
    const olderMetrics = metrics.slice(-10, -5);
    
    if (recentMetrics.length > 0 && olderMetrics.length > 0) {
      const recentTps = recentMetrics.reduce((sum, m) => sum + m.tps, 0) / recentMetrics.length;
      const olderTps = olderMetrics.reduce((sum, m) => sum + m.tps, 0) / olderMetrics.length;
      
      if (recentTps < olderTps * 0.9) {
        insights.push('TPS declining over time, investigate performance degradation');
      }
    }

    return insights;
  }
}
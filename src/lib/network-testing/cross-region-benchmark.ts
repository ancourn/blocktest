import { EventEmitter } from 'events';

export interface RegionConfig {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
    city: string;
    country: string;
  };
  infrastructure: {
    providers: string[];
    datacenters: number;
    capacity: number;
  };
  network: {
    avgLatency: number;
    bandwidth: number;
    reliability: number;
  };
  cost: {
    compute: number;
    storage: number;
    network: number;
  };
}

export interface BenchmarkMetrics {
  region: string;
  timestamp: Date;
  metrics: {
    tps: number;
    latency: {
      min: number;
      avg: number;
      max: number;
      p95: number;
      p99: number;
    };
    throughput: {
      upload: number;
      download: number;
    };
    reliability: {
      uptime: number;
      packetLoss: number;
      errorRate: number;
    };
    consensus: {
      timeToConsensus: number;
      blockTime: number;
      finalityTime: number;
    };
    resources: {
      cpu: number;
      memory: number;
      storage: number;
      network: number;
    };
  };
}

export interface BenchmarkResult {
  id: string;
  name: string;
  description: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  regions: string[];
  config: {
    testDuration: number;
    transactionRate: number;
    nodeCount: number;
    networkConditions: {
      latency: number;
      bandwidth: number;
      packetLoss: number;
    };
  };
  results: {
    global: {
      totalTransactions: number;
      successfulTransactions: number;
      failedTransactions: number;
      averageTps: number;
      peakTps: number;
      overallLatency: number;
      availability: number;
    };
    regional: BenchmarkMetrics[];
    comparisons: {
      fastestRegion: string;
      slowestRegion: string;
      mostReliable: string;
      highestThroughput: string;
      costEffective: string;
    };
    insights: {
      performanceGaps: string[];
      bottlenecks: string[];
      recommendations: string[];
    };
  };
}

export interface NetworkPath {
  from: string;
  to: string;
  distance: number; // in km
  latency: number; // in ms
  bandwidth: number; // in Mbps
  reliability: number; // 0-1
  cost: number; // per GB
}

export class CrossRegionBenchmark extends EventEmitter {
  private regions: Map<string, RegionConfig> = new Map();
  private networkPaths: Map<string, NetworkPath[]> = new Map();
  private benchmarkHistory: BenchmarkResult[] = [];
  private activeBenchmarks: Map<string, BenchmarkResult> = new Map();

  constructor() {
    super();
    this.initializeRegions();
    this.initializeNetworkPaths();
  }

  private initializeRegions(): void {
    const regions: RegionConfig[] = [
      {
        id: 'us-east',
        name: 'US East (N. Virginia)',
        location: {
          lat: 39.0437,
          lng: -77.4875,
          city: 'Ashburn',
          country: 'USA'
        },
        infrastructure: {
          providers: ['AWS', 'Google Cloud', 'Azure', 'DigitalOcean'],
          datacenters: 15,
          capacity: 1000000
        },
        network: {
          avgLatency: 25,
          bandwidth: 10000,
          reliability: 0.999
        },
        cost: {
          compute: 0.08,
          storage: 0.023,
          network: 0.09
        }
      },
      {
        id: 'us-west',
        name: 'US West (N. California)',
        location: {
          lat: 37.7749,
          lng: -122.4194,
          city: 'San Francisco',
          country: 'USA'
        },
        infrastructure: {
          providers: ['AWS', 'Google Cloud', 'Azure', 'DigitalOcean'],
          datacenters: 12,
          capacity: 800000
        },
        network: {
          avgLatency: 20,
          bandwidth: 8000,
          reliability: 0.998
        },
        cost: {
          compute: 0.09,
          storage: 0.026,
          network: 0.09
        }
      },
      {
        id: 'eu-central',
        name: 'EU Central (Frankfurt)',
        location: {
          lat: 50.1109,
          lng: 8.6821,
          city: 'Frankfurt',
          country: 'Germany'
        },
        infrastructure: {
          providers: ['AWS', 'Google Cloud', 'Azure', 'Hetzner'],
          datacenters: 18,
          capacity: 1200000
        },
        network: {
          avgLatency: 30,
          bandwidth: 12000,
          reliability: 0.999
        },
        cost: {
          compute: 0.07,
          storage: 0.021,
          network: 0.08
        }
      },
      {
        id: 'asia-southeast',
        name: 'Asia Southeast (Singapore)',
        location: {
          lat: 1.3521,
          lng: 103.8198,
          city: 'Singapore',
          country: 'Singapore'
        },
        infrastructure: {
          providers: ['AWS', 'Google Cloud', 'Azure', 'DigitalOcean'],
          datacenters: 10,
          capacity: 600000
        },
        network: {
          avgLatency: 40,
          bandwidth: 6000,
          reliability: 0.997
        },
        cost: {
          compute: 0.10,
          storage: 0.025,
          network: 0.12
        }
      },
      {
        id: 'asia-northeast',
        name: 'Asia Northeast (Tokyo)',
        location: {
          lat: 35.6762,
          lng: 139.6503,
          city: 'Tokyo',
          country: 'Japan'
        },
        infrastructure: {
          providers: ['AWS', 'Google Cloud', 'Azure', 'DigitalOcean'],
          datacenters: 14,
          capacity: 900000
        },
        network: {
          avgLatency: 35,
          bandwidth: 8000,
          reliability: 0.998
        },
        cost: {
          compute: 0.11,
          storage: 0.028,
          network: 0.13
        }
      },
      {
        id: 'sa-east',
        name: 'South America (São Paulo)',
        location: {
          lat: -23.5505,
          lng: -46.6333,
          city: 'São Paulo',
          country: 'Brazil'
        },
        infrastructure: {
          providers: ['AWS', 'Google Cloud', 'Azure', 'DigitalOcean'],
          datacenters: 8,
          capacity: 400000
        },
        network: {
          avgLatency: 60,
          bandwidth: 4000,
          reliability: 0.995
        },
        cost: {
          compute: 0.15,
          storage: 0.035,
          network: 0.18
        }
      },
      {
        id: 'af-south',
        name: 'Africa South (Cape Town)',
        location: {
          lat: -33.9249,
          lng: 18.4241,
          city: 'Cape Town',
          country: 'South Africa'
        },
        infrastructure: {
          providers: ['AWS', 'Google Cloud', 'Azure'],
          datacenters: 6,
          capacity: 300000
        },
        network: {
          avgLatency: 80,
          bandwidth: 3000,
          reliability: 0.993
        },
        cost: {
          compute: 0.18,
          storage: 0.040,
          network: 0.22
        }
      },
      {
        id: 'me-south',
        name: 'Middle East (Bahrain)',
        location: {
          lat: 26.0667,
          lng: 50.5577,
          city: 'Manama',
          country: 'Bahrain'
        },
        infrastructure: {
          providers: ['AWS', 'Google Cloud', 'Azure'],
          datacenters: 5,
          capacity: 250000
        },
        network: {
          avgLatency: 70,
          bandwidth: 3500,
          reliability: 0.994
        },
        cost: {
          compute: 0.16,
          storage: 0.038,
          network: 0.20
        }
      }
    ];

    regions.forEach(region => {
      this.regions.set(region.id, region);
    });
  }

  private initializeNetworkPaths(): void {
    const regionIds = Array.from(this.regions.keys());
    
    regionIds.forEach(fromId => {
      const paths: NetworkPath[] = [];
      const fromRegion = this.regions.get(fromId)!;
      
      regionIds.forEach(toId => {
        if (fromId !== toId) {
          const toRegion = this.regions.get(toId)!;
          const path = this.calculateNetworkPath(fromRegion, toRegion);
          paths.push(path);
        }
      });
      
      this.networkPaths.set(fromId, paths);
    });
  }

  private calculateNetworkPath(from: RegionConfig, to: RegionConfig): NetworkPath {
    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(to.location.lat - from.location.lat);
    const dLon = this.toRadians(to.location.lng - from.location.lng);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(from.location.lat)) * Math.cos(this.toRadians(to.location.lat)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Calculate realistic latency based on distance
    const baseLatency = distance * 0.005; // ~5ms per 1000km
    const latency = Math.max(10, baseLatency + (Math.random() * 20 - 10));

    // Calculate bandwidth and reliability based on infrastructure
    const minBandwidth = Math.min(from.network.bandwidth, to.network.bandwidth);
    const bandwidth = minBandwidth * (0.8 + Math.random() * 0.4);
    const reliability = (from.network.reliability + to.network.reliability) / 2 * (0.95 + Math.random() * 0.05);

    // Calculate cost based on distance and regions
    const cost = distance * 0.0001 + (from.cost.network + to.cost.network) / 2;

    return {
      from: from.id,
      to: to.id,
      distance: Math.round(distance),
      latency: Math.round(latency * 100) / 100,
      bandwidth: Math.round(bandwidth),
      reliability: Math.round(reliability * 10000) / 10000,
      cost: Math.round(cost * 10000) / 10000
    };
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Public API methods
  getRegions(): RegionConfig[] {
    return Array.from(this.regions.values());
  }

  getRegion(regionId: string): RegionConfig | undefined {
    return this.regions.get(regionId);
  }

  getNetworkPaths(fromRegion: string): NetworkPath[] {
    return this.networkPaths.get(fromRegion) || [];
  }

  getNetworkPath(fromRegion: string, toRegion: string): NetworkPath | undefined {
    const paths = this.networkPaths.get(fromRegion);
    return paths?.find(path => path.to === toRegion);
  }

  async runBenchmark(config: {
    name: string;
    description: string;
    regions: string[];
    testDuration: number; // in seconds
    transactionRate: number; // TPS
    nodeCount: number;
    networkConditions?: {
      latency: number;
      bandwidth: number;
      packetLoss: number;
    };
  }): Promise<BenchmarkResult> {
    const benchmarkId = `benchmark-${Date.now()}`;
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + config.testDuration * 1000);

    const benchmark: BenchmarkResult = {
      id: benchmarkId,
      name: config.name,
      description: config.description,
      startTime,
      endTime,
      duration: config.testDuration,
      regions: config.regions,
      config: {
        testDuration: config.testDuration,
        transactionRate: config.transactionRate,
        nodeCount: config.nodeCount,
        networkConditions: config.networkConditions || {
          latency: 50,
          bandwidth: 1000,
          packetLoss: 0.01
        }
      },
      results: {
        global: {
          totalTransactions: 0,
          successfulTransactions: 0,
          failedTransactions: 0,
          averageTps: 0,
          peakTps: 0,
          overallLatency: 0,
          availability: 100
        },
        regional: [],
        comparisons: {
          fastestRegion: '',
          slowestRegion: '',
          mostReliable: '',
          highestThroughput: '',
          costEffective: ''
        },
        insights: {
          performanceGaps: [],
          bottlenecks: [],
          recommendations: []
        }
      }
    };

    this.activeBenchmarks.set(benchmarkId, benchmark);
    this.emit('benchmarkStarted', benchmark);

    // Run the benchmark simulation
    await this.simulateBenchmark(benchmark);

    // Calculate final results
    this.calculateBenchmarkResults(benchmark);

    // Store in history
    this.benchmarkHistory.push(benchmark);
    this.activeBenchmarks.delete(benchmarkId);
    this.emit('benchmarkCompleted', benchmark);

    return benchmark;
  }

  private async simulateBenchmark(benchmark: BenchmarkResult): Promise<void> {
    const startTime = benchmark.startTime.getTime();
    const endTime = benchmark.endTime.getTime();
    const regions = benchmark.regions;

    // Initialize regional metrics
    regions.forEach(regionId => {
      const region = this.regions.get(regionId);
      if (region) {
        benchmark.results.regional.push({
          region: regionId,
          timestamp: new Date(),
          metrics: {
            tps: 0,
            latency: { min: 0, avg: 0, max: 0, p95: 0, p99: 0 },
            throughput: { upload: 0, download: 0 },
            reliability: { uptime: 100, packetLoss: 0, errorRate: 0 },
            consensus: { timeToConsensus: 0, blockTime: 0, finalityTime: 0 },
            resources: { cpu: 0, memory: 0, storage: 0, network: 0 }
          }
        });
      }
    });

    // Simulate benchmark execution
    const interval = setInterval(() => {
      const currentTime = Date.now();
      const progress = (currentTime - startTime) / (endTime - startTime);

      this.updateBenchmarkMetrics(benchmark, progress);

      if (currentTime >= endTime) {
        clearInterval(interval);
      }
    }, 1000);

    // Wait for completion
    await new Promise(resolve => {
      setTimeout(resolve, benchmark.config.testDuration * 1000);
    });
  }

  private updateBenchmarkMetrics(benchmark: BenchmarkResult, progress: number): void {
    const { config, results } = benchmark;
    const baseTps = config.transactionRate;
    const currentTps = baseTps * (0.8 + Math.random() * 0.4);

    // Update global metrics
    results.global.totalTransactions += Math.floor(currentTps);
    results.global.successfulTransactions += Math.floor(currentTps * 0.98);
    results.global.failedTransactions += Math.floor(currentTps * 0.02);
    results.global.averageTps = results.global.totalTransactions / ((Date.now() - benchmark.startTime.getTime()) / 1000);
    results.global.peakTps = Math.max(results.global.peakTps, currentTps);

    // Update regional metrics
    results.regional.forEach(regionalMetric => {
      const region = this.regions.get(regionalMetric.region);
      if (!region) return;

      // Simulate regional performance variations
      const regionMultiplier = this.getRegionPerformanceMultiplier(regionalMetric.region);
      const regionTps = currentTps * regionMultiplier / benchmark.regions.length;

      regionalMetric.metrics.tps = regionTps;
      regionalMetric.metrics.latency = {
        min: Math.max(1, region.network.avgLatency * 0.5),
        avg: region.network.avgLatency * (0.8 + Math.random() * 0.4),
        max: region.network.avgLatency * (1.2 + Math.random() * 0.6),
        p95: region.network.avgLatency * 1.5,
        p99: region.network.avgLatency * 2.0
      };

      regionalMetric.metrics.throughput = {
        upload: region.network.bandwidth * (0.6 + Math.random() * 0.3),
        download: region.network.bandwidth * (0.7 + Math.random() * 0.3)
      };

      regionalMetric.metrics.reliability = {
        uptime: 100 - (Math.random() * 0.5),
        packetLoss: (1 - region.network.reliability) * 100 + Math.random() * 0.1,
        errorRate: Math.random() * 0.5
      };

      regionalMetric.metrics.consensus = {
        timeToConsensus: region.network.avgLatency * 2 + Math.random() * 10,
        blockTime: 5 + Math.random() * 3,
        finalityTime: region.network.avgLatency * 3 + Math.random() * 15
      };

      regionalMetric.metrics.resources = {
        cpu: 60 + Math.random() * 30,
        memory: 50 + Math.random() * 40,
        storage: 30 + Math.random() * 20,
        network: 40 + Math.random() * 40
      };
    });

    // Calculate overall latency
    const avgLatencies = results.regional.map(r => r.metrics.latency.avg);
    results.global.overallLatency = avgLatencies.reduce((a, b) => a + b, 0) / avgLatencies.length;
  }

  private getRegionPerformanceMultiplier(regionId: string): number {
    const multipliers: { [key: string]: number } = {
      'us-east': 1.0,
      'us-west': 0.95,
      'eu-central': 0.98,
      'asia-southeast': 0.85,
      'asia-northeast': 0.90,
      'sa-east': 0.70,
      'af-south': 0.65,
      'me-south': 0.75
    };
    return multipliers[regionId] || 0.8;
  }

  private calculateBenchmarkResults(benchmark: BenchmarkResult): void {
    const { results } = benchmark;
    const { global, regional } = results;

    // Calculate comparisons
    const regionPerformances = regional.map(r => ({
      region: r.region,
      avgLatency: r.metrics.latency.avg,
      reliability: r.metrics.reliability.uptime,
      throughput: r.metrics.tps,
      cost: this.regions.get(r.region)?.cost.compute || 0.1
    }));

    // Find best and worst performers
    const fastest = regionPerformances.reduce((best, current) => 
      current.avgLatency < best.avgLatency ? current : best
    );
    const slowest = regionPerformances.reduce((worst, current) => 
      current.avgLatency > worst.avgLatency ? current : worst
    );
    const mostReliable = regionPerformances.reduce((best, current) => 
      current.reliability > best.reliability ? current : best
    );
    const highestThroughput = regionPerformances.reduce((best, current) => 
      current.throughput > best.throughput ? current : best
    );
    const costEffective = regionPerformances.reduce((best, current) => {
      const currentScore = current.throughput / current.cost;
      const bestScore = best.throughput / best.cost;
      return currentScore > bestScore ? current : best;
    });

    results.comparisons = {
      fastestRegion: fastest.region,
      slowestRegion: slowest.region,
      mostReliable: mostReliable.region,
      highestThroughput: highestThroughput.region,
      costEffective: costEffective.region
    };

    // Generate insights
    this.generateInsights(benchmark);
  }

  private generateInsights(benchmark: BenchmarkResult): void {
    const { results } = benchmark;
    const { global, regional, comparisons } = results;

    // Performance gaps
    const latencyGap = regional
      .map(r => r.metrics.latency.avg)
      .reduce((max, min) => Math.max(max, min) - Math.min(max, min), 0);

    if (latencyGap > 50) {
      results.insights.performanceGaps.push(
        `Significant latency gap of ${latencyGap.toFixed(1)}ms between fastest (${comparisons.fastestRegion}) and slowest (${comparisons.slowestRegion}) regions`
      );
    }

    // Bottlenecks
    const avgReliability = regional.reduce((sum, r) => sum + r.metrics.reliability.uptime, 0) / regional.length;
    if (avgReliability < 99.5) {
      results.insights.bottlenecks.push(
        'Network reliability below 99.5% threshold, indicating infrastructure issues'
      );
    }

    const avgThroughput = regional.reduce((sum, r) => sum + r.metrics.throughput.upload, 0) / regional.length;
    if (avgThroughput < 5000) {
      results.insights.bottlenecks.push(
        'Network throughput below 5Gbps, potential bandwidth limitations'
      );
    }

    // Recommendations
    if (comparisons.fastestRegion !== comparisons.costEffective) {
      results.insights.recommendations.push(
        `Consider ${comparisons.costEffective} for cost-effective deployment despite not being the fastest region`
      );
    }

    if (global.failedTransactions / global.totalTransactions > 0.02) {
      results.insights.recommendations.push(
        'High transaction failure rate detected, implement retry mechanisms and better error handling'
      );
    }

    if (global.averageTps < benchmark.config.transactionRate * 0.8) {
      results.insights.recommendations.push(
        'TPS below target, consider scaling infrastructure or optimizing consensus algorithm'
      );
    }

    // Region-specific recommendations
    regional.forEach(r => {
      if (r.metrics.latency.avg > 100) {
        results.insights.recommendations.push(
          `${r.region} shows high latency, consider edge computing or CDN optimization`
        );
      }
    });
  }

  getBenchmarkHistory(): BenchmarkResult[] {
    return this.benchmarkHistory;
  }

  getActiveBenchmarks(): BenchmarkResult[] {
    return Array.from(this.activeBenchmarks.values());
  }

  getBenchmark(benchmarkId: string): BenchmarkResult | undefined {
    return this.benchmarkHistory.find(b => b.id === benchmarkId) ||
           this.activeBenchmarks.get(benchmarkId);
  }

  getRegionComparison(regionIds: string[]): {
    regions: RegionConfig[];
    performance: { [regionId: string]: BenchmarkMetrics };
    recommendations: string[];
  } {
    const regions = regionIds.map(id => this.regions.get(id)).filter(Boolean) as RegionConfig[];
    const performance: { [regionId: string]: BenchmarkMetrics } = {};
    const recommendations: string[] = [];

    // Get latest benchmark data for each region
    regionIds.forEach(regionId => {
      const latestBenchmark = this.benchmarkHistory
        .filter(b => b.regions.includes(regionId))
        .sort((a, b) => b.endTime.getTime() - a.endTime.getTime())[0];

      if (latestBenchmark) {
        const regionalData = latestBenchmark.results.regional.find(r => r.region === regionId);
        if (regionalData) {
          performance[regionId] = regionalData;
        }
      }
    });

    // Generate comparison recommendations
    if (regions.length > 1) {
      recommendations.push('Multi-region deployment recommended for improved availability');
      recommendations.push('Consider geo-distributed consensus for better performance');
    }

    return { regions, performance, recommendations };
  }
}
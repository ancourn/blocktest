import { NextRequest, NextResponse } from 'next/server';
import { FailoverManager } from '@/lib/reliability/failover-manager';
import { AvailabilityMonitor } from '@/lib/reliability/availability-monitor';
import { ConsensusCatchup } from '@/lib/reliability/consensus-catchup';
import { FailureSimulator } from '@/lib/reliability/failure-simulator';
import { TPSTargetManager } from '@/lib/tps/tps-target-manager';

// Initialize components (in a real app, these would be singletons)
let failoverManager: FailoverManager | null = null;
let availabilityMonitor: AvailabilityMonitor | null = null;
let consensusCatchup: ConsensusCatchup | null = null;
let failureSimulator: FailureSimulator | null = null;
let tpsTargetManager: TPSTargetManager | null = null;

async function initializeComponents() {
  if (!failoverManager) {
    failoverManager = new FailoverManager({
      heartbeatInterval: 5000,
      responseTimeout: 10000,
      maxRetries: 3,
      failoverThreshold: 2,
      consensusCatchupTimeout: 30000
    });
    await failoverManager.initialize();
  }

  if (!availabilityMonitor) {
    availabilityMonitor = new AvailabilityMonitor({
      slaTarget: 99.99,
      checkInterval: 5,
      incidentTimeout: 300,
      alertCooldown: 60,
      retentionPeriod: 7,
      enableNotifications: true
    });
    await availabilityMonitor.initialize();
  }

  if (!consensusCatchup) {
    consensusCatchup = new ConsensusCatchup({
      maxBatchSize: 100,
      syncTimeout: 30000,
      retryAttempts: 3,
      parallelSyncs: 5,
      validationDepth: 50
    });
    await consensusCatchup.initialize();
  }

  if (!failureSimulator) {
    failureSimulator = new FailureSimulator({
      maxConcurrentScenarios: 3,
      autoRecovery: true,
      recoveryDelay: 30,
      monitoringInterval: 10,
      chaosEnabled: false
    });
    await failureSimulator.initialize();
  }

  if (!tpsTargetManager) {
    tpsTargetManager = new TPSTargetManager({
      currentTarget: 1000,
      milestones: [1000, 10000, 30000, 75000],
      autoScaling: true,
      monitoringInterval: 10000
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    await initializeComponents();

    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    switch (endpoint) {
      case 'cluster':
        return NextResponse.json(failoverManager?.getClusterStatus() || {});
      
      case 'availability':
        return NextResponse.json({
          availability: availabilityMonitor?.getAvailabilityMetrics(),
          system: availabilityMonitor?.getSystemMetrics()
        });
      
      case 'consensus':
        return NextResponse.json(consensusCatchup?.getSyncState() || {});
      
      case 'failures':
        return NextResponse.json({
          metrics: failureSimulator?.getMetrics(),
          scenarios: failureSimulator?.getAllScenarios(),
          activeScenarios: failureSimulator?.getActiveScenarios()
        });
      
      case 'tps':
        return NextResponse.json(tpsTargetManager?.getCurrentMetrics() || {});
      
      case 'nodes':
        const clusterStatus = failoverManager?.getClusterStatus();
        return NextResponse.json(clusterStatus?.nodes || []);
      
      case 'incidents':
        const incidents = availabilityMonitor?.getAllIncidents() || [];
        const activeIncidents = availabilityMonitor?.getActiveIncidents() || [];
        return NextResponse.json({
          all: incidents,
          active: activeIncidents,
          resolved: incidents.filter(i => i.resolved)
        });
      
      case 'alerts':
        return NextResponse.json(availabilityMonitor?.getAlertRules() || []);
      
      case 'health':
        const systemMetrics = availabilityMonitor?.getSystemMetrics();
        const availabilityMetrics = availabilityMonitor?.getAvailabilityMetrics();
        const clusterStatusHealth = failoverManager?.getClusterStatus();
        
        return NextResponse.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          overallAvailability: availabilityMetrics?.uptime || 0,
          consensusHealth: systemMetrics?.consensusHealth || 0,
          networkHealth: systemMetrics?.networkHealth || 0,
          storageHealth: systemMetrics?.storageHealth || 0,
          activeNodes: clusterStatusHealth?.activeNodes || 0,
          totalNodes: clusterStatusHealth?.totalNodes || 0,
          slaCompliance: availabilityMetrics?.slaCompliance || false
        });
      
      default:
        // Return all metrics
        const clusterStatusDefault = failoverManager?.getClusterStatus();
        const systemMetricsDefault = availabilityMonitor?.getSystemMetrics();
        const availabilityMetricsDefault = availabilityMonitor?.getAvailabilityMetrics();
        
        return NextResponse.json({
          cluster: clusterStatusDefault,
          availability: {
            metrics: availabilityMetricsDefault,
            system: systemMetricsDefault
          },
          consensus: consensusCatchup?.getSyncState(),
          failures: {
            metrics: failureSimulator?.getMetrics(),
            scenarios: failureSimulator?.getAllScenarios()
          },
          tps: tpsTargetManager?.getCurrentMetrics(),
          timestamp: new Date().toISOString()
        });
    }
  } catch (error) {
    console.error('Metrics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeComponents();

    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'register_node':
        if (!failoverManager || !availabilityMonitor) {
          throw new Error('Components not initialized');
        }
        
        const { nodeId } = params;
        failoverManager.registerNode(nodeId);
        availabilityMonitor.registerNode(nodeId);
        
        return NextResponse.json({ success: true, message: `Node ${nodeId} registered` });
      
      case 'start_scenario':
        if (!failureSimulator) {
          throw new Error('Failure simulator not initialized');
        }
        
        const { scenarioId, targetNodes } = params;
        const success = await failureSimulator.startScenario(scenarioId, targetNodes);
        
        return NextResponse.json({ 
          success, 
          message: success ? `Scenario ${scenarioId} started` : `Failed to start scenario ${scenarioId}` 
        });
      
      case 'stop_scenario':
        if (!failureSimulator) {
          throw new Error('Failure simulator not initialized');
        }
        
        const { scenarioId: stopScenarioId } = params;
        await failureSimulator.stopScenario(stopScenarioId);
        
        return NextResponse.json({ success: true, message: `Scenario ${stopScenarioId} stopped` });
      
      case 'start_catchup':
        if (!consensusCatchup) {
          throw new Error('Consensus catchup not initialized');
        }
        
        const { fromHeight, toHeight } = params;
        await consensusCatchup.startCatchup(fromHeight, toHeight);
        
        return NextResponse.json({ 
          success: true, 
          message: `Consensus catchup started from ${fromHeight} to ${toHeight}` 
        });
      
      case 'set_tps_target':
        if (!tpsTargetManager) {
          throw new Error('TPS target manager not initialized');
        }
        
        const { target } = params;
        tpsTargetManager.setTarget(target);
        
        return NextResponse.json({ success: true, message: `TPS target set to ${target}` });
      
      case 'enable_chaos':
        if (!failureSimulator) {
          throw new Error('Failure simulator not initialized');
        }
        
        failureSimulator.enableChaos();
        return NextResponse.json({ success: true, message: 'Chaos mode enabled' });
      
      case 'disable_chaos':
        if (!failureSimulator) {
          throw new Error('Failure simulator not initialized');
        }
        
        failureSimulator.disableChaos();
        return NextResponse.json({ success: true, message: 'Chaos mode disabled' });
      
      default:
        return NextResponse.json(
          { error: 'Unknown action', action },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Metrics API POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
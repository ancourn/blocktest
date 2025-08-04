import { NextRequest, NextResponse } from 'next/server';
import { NetworkTopologySimulator } from '@/lib/network-testing/network-topology-simulator';

const simulator = new NetworkTopologySimulator();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'topologies':
        const topologies = simulator.getTopologies();
        return NextResponse.json({ success: true, data: topologies });

      case 'topology':
        const topologyId = searchParams.get('id');
        if (!topologyId) {
          return NextResponse.json({ success: false, error: 'Topology ID required' }, { status: 400 });
        }
        const topology = simulator.getTopology(topologyId);
        if (!topology) {
          return NextResponse.json({ success: false, error: 'Topology not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: topology });

      case 'scenarios':
        const scenarios = simulator.getScenarios();
        return NextResponse.json({ success: true, data: scenarios });

      case 'scenario':
        const scenarioId = searchParams.get('id');
        if (!scenarioId) {
          return NextResponse.json({ success: false, error: 'Scenario ID required' }, { status: 400 });
        }
        const scenario = simulator.getScenario(scenarioId);
        if (!scenario) {
          return NextResponse.json({ success: false, error: 'Scenario not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: scenario });

      case 'simulation-history':
        const history = simulator.getSimulationHistory();
        return NextResponse.json({ success: true, data: history });

      case 'active-simulations':
        const activeSimulations = simulator.getActiveSimulations();
        return NextResponse.json({ success: true, data: activeSimulations });

      case 'simulation':
        const simulationId = searchParams.get('id');
        if (!simulationId) {
          return NextResponse.json({ success: false, error: 'Simulation ID required' }, { status: 400 });
        }
        const simulation = simulator.getSimulation(simulationId);
        if (!simulation) {
          return NextResponse.json({ success: false, error: 'Simulation not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: simulation });

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Topology simulator API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'run-simulation':
        const { topologyId: simTopologyId, scenarioId: simScenarioId } = params;
        if (!simTopologyId || !simScenarioId) {
          return NextResponse.json({ 
            success: false, 
            error: 'Topology ID and scenario ID required' 
          }, { status: 400 });
        }

        const simulationResult = await simulator.runSimulation(simTopologyId, simScenarioId);
        return NextResponse.json({ success: true, data: simulationResult });

      case 'create-custom-topology':
        const { name, description, nodes, connections, configuration } = params;
        if (!name || !nodes || !connections || !configuration) {
          return NextResponse.json({ 
            success: false, 
            error: 'Missing required parameters: name, nodes, connections, configuration' 
          }, { status: 400 });
        }

        const customTopology = simulator.createCustomTopology({
          name,
          description: description || '',
          nodes,
          connections,
          configuration
        });

        return NextResponse.json({ success: true, data: customTopology });

      case 'create-custom-scenario':
        const { 
          name: scenarioName, 
          description: scenarioDescription, 
          duration: scenarioDuration, 
          events: scenarioEvents, 
          metrics: scenarioMetrics 
        } = params;

        if (!scenarioName || !scenarioDuration || !scenarioEvents || !scenarioMetrics) {
          return NextResponse.json({ 
            success: false, 
            error: 'Missing required parameters: name, duration, events, metrics' 
          }, { status: 400 });
        }

        const customScenario = simulator.createCustomScenario({
          name: scenarioName,
          description: scenarioDescription || '',
          duration: scenarioDuration,
          events: scenarioEvents,
          metrics: scenarioMetrics
        });

        return NextResponse.json({ success: true, data: customScenario });

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Topology simulator API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
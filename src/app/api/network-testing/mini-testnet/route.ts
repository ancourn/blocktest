import { NextRequest, NextResponse } from 'next/server';
import { MiniTestnetManager } from '@/lib/network-testing/mini-testnet-manager';

const testnetManager = new MiniTestnetManager();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'topologies':
        const topologies = testnetManager.getAvailableTopologies();
        return NextResponse.json({ success: true, data: topologies });

      case 'topology':
        const topologyId = searchParams.get('id');
        if (!topologyId) {
          return NextResponse.json({ success: false, error: 'Topology ID required' }, { status: 400 });
        }
        const topology = testnetManager.getTopology(topologyId);
        if (!topology) {
          return NextResponse.json({ success: false, error: 'Topology not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: topology });

      case 'nodes':
        const nodes = testnetManager.getAllNodes();
        return NextResponse.json({ success: true, data: nodes });

      case 'node':
        const nodeId = searchParams.get('id');
        if (!nodeId) {
          return NextResponse.json({ success: false, error: 'Node ID required' }, { status: 400 });
        }
        const node = testnetManager.getNode(nodeId);
        if (!node) {
          return NextResponse.json({ success: false, error: 'Node not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: node });

      case 'running-tests':
        const runningTests = testnetManager.getRunningTests();
        return NextResponse.json({ success: true, data: runningTests });

      case 'test-history':
        const historyTopologyId = searchParams.get('topologyId');
        const testHistory = testnetManager.getTestHistory(historyTopologyId || undefined);
        return NextResponse.json({ success: true, data: testHistory });

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Mini-testnet API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'create-topology':
        const customTopology = testnetManager.createCustomTopology(params);
        return NextResponse.json({ success: true, data: customTopology });

      case 'start-test':
        const { topologyId, scenario } = params;
        if (!topologyId || !scenario) {
          return NextResponse.json({ success: false, error: 'Topology ID and scenario required' }, { status: 400 });
        }
        const testResult = await testnetManager.startNetworkTest(topologyId, scenario);
        return NextResponse.json({ success: true, data: testResult });

      case 'stop-test':
        const { testId } = params;
        if (!testId) {
          return NextResponse.json({ success: false, error: 'Test ID required' }, { status: 400 });
        }
        const stopped = testnetManager.stopTest(testId);
        if (!stopped) {
          return NextResponse.json({ success: false, error: 'Test not found or already stopped' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: { message: 'Test stopped successfully' } });

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Mini-testnet API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
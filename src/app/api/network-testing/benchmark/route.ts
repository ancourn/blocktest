import { NextRequest, NextResponse } from 'next/server';
import { CrossRegionBenchmark } from '@/lib/network-testing/cross-region-benchmark';

const benchmark = new CrossRegionBenchmark();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'regions':
        const regions = benchmark.getRegions();
        return NextResponse.json({ success: true, data: regions });

      case 'region':
        const regionId = searchParams.get('id');
        if (!regionId) {
          return NextResponse.json({ success: false, error: 'Region ID required' }, { status: 400 });
        }
        const region = benchmark.getRegion(regionId);
        if (!region) {
          return NextResponse.json({ success: false, error: 'Region not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: region });

      case 'network-paths':
        const fromRegion = searchParams.get('from');
        if (!fromRegion) {
          return NextResponse.json({ success: false, error: 'From region required' }, { status: 400 });
        }
        const paths = benchmark.getNetworkPaths(fromRegion);
        return NextResponse.json({ success: true, data: paths });

      case 'network-path':
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        if (!from || !to) {
          return NextResponse.json({ success: false, error: 'From and to regions required' }, { status: 400 });
        }
        const path = benchmark.getNetworkPath(from, to);
        if (!path) {
          return NextResponse.json({ success: false, error: 'Network path not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: path });

      case 'benchmark-history':
        const history = benchmark.getBenchmarkHistory();
        return NextResponse.json({ success: true, data: history });

      case 'active-benchmarks':
        const activeBenchmarks = benchmark.getActiveBenchmarks();
        return NextResponse.json({ success: true, data: activeBenchmarks });

      case 'benchmark':
        const benchmarkId = searchParams.get('id');
        if (!benchmarkId) {
          return NextResponse.json({ success: false, error: 'Benchmark ID required' }, { status: 400 });
        }
        const benchmarkResult = benchmark.getBenchmark(benchmarkId);
        if (!benchmarkResult) {
          return NextResponse.json({ success: false, error: 'Benchmark not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: benchmarkResult });

      case 'region-comparison':
        const regionIds = searchParams.get('regions')?.split(',') || [];
        if (regionIds.length === 0) {
          return NextResponse.json({ success: false, error: 'At least one region ID required' }, { status: 400 });
        }
        const comparison = benchmark.getRegionComparison(regionIds);
        return NextResponse.json({ success: true, data: comparison });

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Cross-region benchmark API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'run-benchmark':
        const { name, description, regions, testDuration, transactionRate, nodeCount, networkConditions } = params;
        if (!name || !regions || !testDuration || !transactionRate || !nodeCount) {
          return NextResponse.json({ 
            success: false, 
            error: 'Missing required parameters: name, regions, testDuration, transactionRate, nodeCount' 
          }, { status: 400 });
        }

        const benchmarkConfig = {
          name,
          description: description || '',
          regions,
          testDuration,
          transactionRate,
          nodeCount,
          networkConditions: networkConditions || {
            latency: 50,
            bandwidth: 1000,
            packetLoss: 0.01
          }
        };

        const result = await benchmark.runBenchmark(benchmarkConfig);
        return NextResponse.json({ success: true, data: result });

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Cross-region benchmark API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
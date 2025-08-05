import { NextRequest, NextResponse } from 'next/server';
import { getMonitoringService } from '@/lib/monitoring/performance-monitoring-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const metricName = searchParams.get('metric');
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const aggregation = searchParams.get('aggregation') as 'avg' | 'max' | 'min' | 'sum' | 'count' || 'avg';

    const monitoringService = getMonitoringService();

    if (metricName) {
      // Get specific metric
      let timeRange;
      if (start && end) {
        timeRange = {
          start: parseInt(start),
          end: parseInt(end)
        };
      }

      if (aggregation !== 'avg') {
        // Return aggregated value
        const aggregatedValue = monitoringService.getAggregatedMetrics(metricName, aggregation, timeRange);
        return NextResponse.json({
          success: true,
          data: {
            metric: metricName,
            aggregation,
            value: aggregatedValue,
            timeRange
          },
          timestamp: new Date().toISOString()
        });
      } else {
        // Return raw metric data
        const metricData = monitoringService.getMetric(metricName, timeRange);
        return NextResponse.json({
          success: true,
          data: {
            metric: metricName,
            data: metricData,
            count: metricData.length,
            timeRange
          },
          timestamp: new Date().toISOString()
        });
      }
    } else {
      // Get all metrics
      const allMetrics = monitoringService.getAllMetrics();
      return NextResponse.json({
        success: true,
        data: {
          metrics: allMetrics,
          count: Object.keys(allMetrics).length
        },
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
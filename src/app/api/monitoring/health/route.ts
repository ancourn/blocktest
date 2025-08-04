import { NextRequest, NextResponse } from 'next/server';
import { getMonitoringService } from '@/lib/monitoring/performance-monitoring-service';

export async function GET(request: NextRequest) {
  try {
    const monitoringService = getMonitoringService();
    const health = monitoringService.getSystemHealth();
    
    return NextResponse.json({
      success: true,
      data: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching system health:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch system health',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metric, value, metadata } = body;
    
    if (!metric || typeof value !== 'number') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request. Metric name and numeric value are required.'
        },
        { status: 400 }
      );
    }

    const monitoringService = getMonitoringService();
    monitoringService.addMetric(metric, value, metadata);
    
    return NextResponse.json({
      success: true,
      message: `Metric ${metric} added successfully`,
      value: value,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error adding metric:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to add metric',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getMonitoringService } from '@/lib/monitoring/performance-monitoring-service';

export async function GET(request: NextRequest) {
  try {
    const monitoringService = getMonitoringService();
    const alerts = monitoringService.getActiveAlerts();
    
    return NextResponse.json({
      success: true,
      data: {
        alerts,
        count: alerts.length,
        severitySummary: {
          critical: alerts.filter(a => a.severity === 'critical').length,
          high: alerts.filter(a => a.severity === 'high').length,
          medium: alerts.filter(a => a.severity === 'medium').length,
          low: alerts.filter(a => a.severity === 'low').length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch alerts',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
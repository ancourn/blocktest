import { NextRequest, NextResponse } from 'next/server';
import { getMonitoringService } from '@/lib/monitoring/performance-monitoring-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const format = searchParams.get('format') || 'json';

    // Default to last 24 hours if no time range specified
    const now = Date.now();
    const timeRange = {
      start: start ? parseInt(start) : now - (24 * 60 * 60 * 1000),
      end: end ? parseInt(end) : now
    };

    const monitoringService = getMonitoringService();
    const report = monitoringService.generateReport(timeRange);

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: report,
        timestamp: new Date().toISOString()
      });
    } else {
      // For other formats, return JSON with format specification
      return NextResponse.json({
        success: true,
        data: {
          ...report,
          requestedFormat: format,
          note: 'Additional formats (PDF, CSV) can be implemented based on requirements'
        },
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate report',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
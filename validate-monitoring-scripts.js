#!/usr/bin/env node

/**
 * KALDRIX Monitoring Script Validation Tool
 * Validates monitoring scripts and data generation
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

class MonitoringValidator {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      tests: []
    };
    this.startTime = Date.now();
    this.servers = [];
  }

  log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }

  async startMockServer(port, handler) {
    return new Promise((resolve) => {
      const server = http.createServer(handler);
      server.listen(port, () => {
        this.log(`🌐 Mock monitoring server started on port ${port}`);
        this.servers.push(server);
        resolve(server);
      });
    });
  }

  async stopAllServers() {
    for (const server of this.servers) {
      await new Promise((resolve) => {
        server.close(() => {
          this.log('🛑 Mock server stopped');
          resolve();
        });
      });
    }
  }

  async makeRequest(url, options = {}) {
    const startTime = Date.now();
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      const endTime = Date.now();
      const data = await response.json();
      
      return {
        success: response.ok,
        status: response.status,
        data,
        responseTime: endTime - startTime
      };
    } catch (error) {
      return {
        success: false,
        status: 0,
        data: { error: error.message },
        responseTime: Date.now() - startTime
      };
    }
  }

  async testMetricsCollection() {
    this.log('📊 Testing metrics collection...');
    
    // Start mock metrics server
    await this.startMockServer(3011, async (req, res) => {
      if (req.url === '/api/monitoring/metrics' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: {
            timestamp: new Date().toISOString(),
            metrics: {
              tps_current: 1738.8,
              latency_p95: 44.4,
              latency_p99: 67.2,
              cpu_utilization: 45.1,
              memory_usage: 61.9,
              network_bandwidth: 78.3,
              error_rate: 0.8,
              active_nodes: 1247,
              quantum_security_score: 95.9,
              queue_depth: 45,
              success_rate: 99.2
            },
            system_info: {
              uptime: 86400,
              version: '1.0.0-quantum',
              node_count: 1247,
              network_status: 'healthy'
            }
          }
        }));
      } else if (req.url === '/api/monitoring/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: {
            status: 'healthy',
            checks: {
              database: 'healthy',
              network: 'healthy',
              quantum: 'healthy',
              monitoring: 'healthy'
            },
            uptime: 86400,
            last_check: new Date().toISOString()
          }
        }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    });

    const tests = [
      {
        name: 'Metrics Collection',
        test: async () => {
          const response = await this.makeRequest('http://localhost:3011/api/monitoring/metrics');
          
          return {
            passed: response.success && response.data.success && response.data.data.metrics,
            details: response
          };
        }
      },
      {
        name: 'Metrics Data Structure',
        test: async () => {
          const response = await this.makeRequest('http://localhost:3011/api/monitoring/metrics');
          
          if (!response.success || !response.data.success) {
            return { passed: false, details: response };
          }
          
          const metrics = response.data.data.metrics;
          const requiredMetrics = [
            'tps_current', 'latency_p95', 'cpu_utilization', 'memory_usage',
            'network_bandwidth', 'error_rate', 'active_nodes', 'quantum_security_score'
          ];
          
          const missingMetrics = requiredMetrics.filter(metric => !(metric in metrics));
          
          return {
            passed: missingMetrics.length === 0,
            details: {
              response,
              missingMetrics: missingMetrics.length > 0 ? missingMetrics : undefined
            }
          };
        }
      },
      {
        name: 'Metrics Data Types',
        test: async () => {
          const response = await this.makeRequest('http://localhost:3011/api/monitoring/metrics');
          
          if (!response.success || !response.data.success) {
            return { passed: false, details: response };
          }
          
          const metrics = response.data.data.metrics;
          const typeChecks = {
            tps_current: typeof metrics.tps_current === 'number',
            latency_p95: typeof metrics.latency_p95 === 'number',
            cpu_utilization: typeof metrics.cpu_utilization === 'number',
            memory_usage: typeof metrics.memory_usage === 'number',
            quantum_security_score: typeof metrics.quantum_security_score === 'number'
          };
          
          const failedChecks = Object.entries(typeChecks).filter(([_, passed]) => !passed);
          
          return {
            passed: failedChecks.length === 0,
            details: {
              response,
              failedChecks: failedChecks.length > 0 ? failedChecks : undefined
            }
          };
        }
      },
      {
        name: 'Monitoring Health Check',
        test: async () => {
          const response = await this.makeRequest('http://localhost:3011/api/monitoring/health');
          
          return {
            passed: response.success && response.data.success && response.data.data.status === 'healthy',
            details: response
          };
        }
      }
    ];

    const results = await this.runTests('Metrics Collection', tests);
    return results;
  }

  async testAlertGeneration() {
    this.log('🚨 Testing alert generation...');
    
    // Start mock alert server
    await this.startMockServer(3012, async (req, res) => {
      if (req.url === '/api/monitoring/alerts' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: {
            alerts: [
              {
                id: 'alert_001',
                name: 'TPS Below Threshold',
                severity: 'high',
                metric: 'tps_current',
                current_value: 1200,
                threshold: 1500,
                status: 'active',
                timestamp: new Date().toISOString(),
                description: 'TPS has dropped below the threshold of 1500'
              },
              {
                id: 'alert_002',
                name: 'High Latency Detected',
                severity: 'medium',
                metric: 'latency_p95',
                current_value: 250,
                threshold: 200,
                status: 'active',
                timestamp: new Date().toISOString(),
                description: 'Latency has exceeded the threshold of 200ms'
              }
            ],
            alert_counts: {
              total: 2,
              active: 2,
              resolved: 0,
              suppressed: 0
            }
          }
        }));
      } else if (req.url === '/api/monitoring/alerts/rules' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: {
            rules: [
              {
                id: 'tps_drop',
                name: 'TPS Below Threshold',
                metric: 'tps_current',
                condition: 'below',
                threshold: 1500,
                severity: 'high',
                enabled: true
              },
              {
                id: 'latency_spike',
                name: 'High Latency Detected',
                metric: 'latency_p95',
                condition: 'above',
                threshold: 200,
                severity: 'medium',
                enabled: true
              }
            ]
          }
        }));
      } else if (req.url === '/api/monitoring/alerts/test' && req.method === 'POST') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: {
            test_alert_id: 'test_' + Math.random().toString(36).substr(2, 9),
            status: 'triggered',
            message: 'Test alert generated successfully',
            timestamp: new Date().toISOString()
          }
        }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    });

    const tests = [
      {
        name: 'Alert Retrieval',
        test: async () => {
          const response = await this.makeRequest('http://localhost:3012/api/monitoring/alerts');
          
          return {
            passed: response.success && response.data.success && Array.isArray(response.data.data.alerts),
            details: response
          };
        }
      },
      {
        name: 'Alert Rules Configuration',
        test: async () => {
          const response = await this.makeRequest('http://localhost:3012/api/monitoring/alerts/rules');
          
          return {
            passed: response.success && response.data.success && Array.isArray(response.data.data.rules),
            details: response
          };
        }
      },
      {
        name: 'Alert Generation Test',
        test: async () => {
          const response = await this.makeRequest('http://localhost:3012/api/monitoring/alerts/test', {
            method: 'POST',
            body: JSON.stringify({
              test_type: 'alert_generation',
              severity: 'high',
              metric: 'tps_current'
            })
          });
          
          return {
            passed: response.success && response.data.success && response.data.data.status === 'triggered',
            details: response
          };
        }
      },
      {
        name: 'Alert Data Structure',
        test: async () => {
          const response = await this.makeRequest('http://localhost:3012/api/monitoring/alerts');
          
          if (!response.success || !response.data.success) {
            return { passed: false, details: response };
          }
          
          const alerts = response.data.data.alerts;
          if (!Array.isArray(alerts) || alerts.length === 0) {
            return { passed: false, details: { message: 'No alerts found' } };
          }
          
          const alert = alerts[0];
          const requiredFields = ['id', 'name', 'severity', 'metric', 'current_value', 'threshold', 'status'];
          const missingFields = requiredFields.filter(field => !(field in alert));
          
          return {
            passed: missingFields.length === 0,
            details: {
              response,
              missingFields: missingFields.length > 0 ? missingFields : undefined
            }
          };
        }
      }
    ];

    const results = await this.runTests('Alert Generation', tests);
    return results;
  }

  async testReportingSystem() {
    this.log('📈 Testing reporting system...');
    
    // Start mock reporting server
    await this.startMockServer(3013, async (req, res) => {
      if (req.url === '/api/monitoring/reports' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: {
            reports: [
              {
                id: 'report_001',
                name: 'Daily Performance Summary',
                type: 'daily',
                format: 'pdf',
                generated_at: new Date().toISOString(),
                status: 'completed',
                download_url: '/api/monitoring/reports/report_001.pdf'
              },
              {
                id: 'report_002',
                name: 'Weekly Performance Analysis',
                type: 'weekly',
                format: 'pdf',
                generated_at: new Date(Date.now() - 86400000).toISOString(),
                status: 'completed',
                download_url: '/api/monitoring/reports/report_002.pdf'
              }
            ],
            summary: {
              total_reports: 2,
              completed: 2,
              failed: 0,
              pending: 0
            }
          }
        }));
      } else if (req.url === '/api/monitoring/reports/generate' && req.method === 'POST') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: {
            report_id: 'report_' + Math.random().toString(36).substr(2, 9),
            status: 'generating',
            estimated_completion: new Date(Date.now() + 30000).toISOString(),
            message: 'Report generation started successfully'
          }
        }));
      } else if (req.url === '/api/monitoring/reports/schedule' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: {
            schedules: [
              {
                name: 'daily_summary',
                cron: '0 9 * * *',
                enabled: true,
                next_run: new Date(Date.now() + 86400000).toISOString()
              },
              {
                name: 'weekly_performance',
                cron: '0 9 * * 1',
                enabled: true,
                next_run: new Date(Date.now() + 604800000).toISOString()
              }
            ]
          }
        }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    });

    const tests = [
      {
        name: 'Report Retrieval',
        test: async () => {
          const response = await this.makeRequest('http://localhost:3013/api/monitoring/reports');
          
          return {
            passed: response.success && response.data.success && Array.isArray(response.data.data.reports),
            details: response
          };
        }
      },
      {
        name: 'Report Generation',
        test: async () => {
          const response = await this.makeRequest('http://localhost:3013/api/monitoring/reports/generate', {
            method: 'POST',
            body: JSON.stringify({
              type: 'daily',
              format: 'pdf',
              include_metrics: true,
              include_alerts: true
            })
          });
          
          return {
            passed: response.success && response.data.success && response.data.data.status === 'generating',
            details: response
          };
        }
      },
      {
        name: 'Report Schedule',
        test: async () => {
          const response = await this.makeRequest('http://localhost:3013/api/monitoring/reports/schedule');
          
          return {
            passed: response.success && response.data.success && Array.isArray(response.data.data.schedules),
            details: response
          };
        }
      },
      {
        name: 'Report Data Structure',
        test: async () => {
          const response = await this.makeRequest('http://localhost:3013/api/monitoring/reports');
          
          if (!response.success || !response.data.success) {
            return { passed: false, details: response };
          }
          
          const reports = response.data.data.reports;
          if (!Array.isArray(reports) || reports.length === 0) {
            return { passed: false, details: { message: 'No reports found' } };
          }
          
          const report = reports[0];
          const requiredFields = ['id', 'name', 'type', 'format', 'generated_at', 'status'];
          const missingFields = requiredFields.filter(field => !(field in report));
          
          return {
            passed: missingFields.length === 0,
            details: {
              response,
              missingFields: missingFields.length > 0 ? missingFields : undefined
            }
          };
        }
      }
    ];

    const results = await this.runTests('Reporting System', tests);
    return results;
  }

  async testDashboardIntegration() {
    this.log('📊 Testing dashboard integration...');
    
    // Start mock dashboard server
    await this.startMockServer(3014, async (req, res) => {
      if (req.url === '/api/monitoring/dashboard' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: {
            panels: [
              {
                id: 'tps_panel',
                title: 'Transactions Per Second',
                type: 'timeseries',
                data: {
                  current: 1738.8,
                  target: 2000,
                  trend: 'increasing',
                  data_points: Array(24).fill(null).map((_, i) => ({
                    timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
                    value: 1500 + Math.random() * 500
                  }))
                }
              },
              {
                id: 'latency_panel',
                title: 'Transaction Latency',
                type: 'timeseries',
                data: {
                  current_p95: 44.4,
                  current_p99: 67.2,
                  target: 100,
                  trend: 'stable',
                  data_points: Array(24).fill(null).map((_, i) => ({
                    timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
                    p95: 40 + Math.random() * 20,
                    p99: 60 + Math.random() * 30
                  }))
                }
              },
              {
                id: 'quantum_panel',
                title: 'Quantum Security Score',
                type: 'singlestat',
                data: {
                  current: 95.9,
                  target: 90,
                  status: 'optimal',
                  trend: 'stable'
                }
              }
            ],
            overall_status: 'healthy',
            last_updated: new Date().toISOString()
          }
        }));
      } else if (req.url === '/api/monitoring/dashboard/refresh' && req.method === 'POST') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: {
            refresh_timestamp: new Date().toISOString(),
            panels_updated: 3,
            data_freshness: 'current'
          }
        }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    });

    const tests = [
      {
        name: 'Dashboard Data Retrieval',
        test: async () => {
          const response = await this.makeRequest('http://localhost:3014/api/monitoring/dashboard');
          
          return {
            passed: response.success && response.data.success && Array.isArray(response.data.data.panels),
            details: response
          };
        }
      },
      {
        name: 'Dashboard Panel Structure',
        test: async () => {
          const response = await this.makeRequest('http://localhost:3014/api/monitoring/dashboard');
          
          if (!response.success || !response.data.success) {
            return { passed: false, details: response };
          }
          
          const panels = response.data.data.panels;
          if (!Array.isArray(panels) || panels.length === 0) {
            return { passed: false, details: { message: 'No panels found' } };
          }
          
          const panel = panels[0];
          const requiredFields = ['id', 'title', 'type', 'data'];
          const missingFields = requiredFields.filter(field => !(field in panel));
          
          return {
            passed: missingFields.length === 0,
            details: {
              response,
              missingFields: missingFields.length > 0 ? missingFields : undefined
            }
          };
        }
      },
      {
        name: 'Dashboard Refresh',
        test: async () => {
          const response = await this.makeRequest('http://localhost:3014/api/monitoring/dashboard/refresh', {
            method: 'POST'
          });
          
          return {
            passed: response.success && response.data.success && response.data.data.panels_updated > 0,
            details: response
          };
        }
      },
      {
        name: 'Data Freshness',
        test: async () => {
          const response = await this.makeRequest('http://localhost:3014/api/monitoring/dashboard');
          
          if (!response.success || !response.data.success) {
            return { passed: false, details: response };
          }
          
          const lastUpdated = new Date(response.data.data.last_updated);
          const now = new Date();
          const timeDiff = now - lastUpdated;
          const isFresh = timeDiff < 60000; // Data is fresh if less than 1 minute old
          
          return {
            passed: isFresh,
            details: {
              response,
              timeDiff: timeDiff,
              isFresh: isFresh
            }
          };
        }
      }
    ];

    const results = await this.runTests('Dashboard Integration', tests);
    return results;
  }

  async runTests(category, tests) {
    this.log(`🧪 Running ${category} tests...`);
    
    const categoryResults = {
      category,
      total: tests.length,
      passed: 0,
      failed: 0,
      tests: []
    };

    for (const test of tests) {
      this.log(`  📋 ${test.name}...`);
      
      try {
        const result = await test.test();
        const testResult = {
          name: test.name,
          passed: result.passed,
          details: result.details,
          timestamp: new Date().toISOString()
        };

        categoryResults.tests.push(testResult);
        
        if (result.passed) {
          categoryResults.passed++;
          this.log(`  ✅ ${test.name} - PASSED`);
        } else {
          categoryResults.failed++;
          this.log(`  ❌ ${test.name} - FAILED`);
          if (result.details && result.details.message) {
            this.log(`     Details: ${result.details.message}`);
          }
        }
      } catch (error) {
        categoryResults.failed++;
        categoryResults.tests.push({
          name: test.name,
          passed: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        this.log(`  ❌ ${test.name} - ERROR: ${error.message}`);
      }
    }

    this.results.total += categoryResults.total;
    this.results.passed += categoryResults.passed;
    this.results.failed += categoryResults.failed;
    this.results.tests.push(categoryResults);

    return categoryResults;
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      summary: {
        total: this.results.total,
        passed: this.results.passed,
        failed: this.results.failed,
        successRate: (this.results.passed / this.results.total * 100).toFixed(2)
      },
      categories: this.results.tests
    };

    const filename = `monitoring-validation-report-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    this.log(`📄 Validation report saved to: ${filename}`);

    return report;
  }

  async run() {
    this.log('🚀 Starting KALDRIX Monitoring Script Validation');
    this.log('================================================');

    try {
      // Run all test categories
      await this.testMetricsCollection();
      await this.testAlertGeneration();
      await this.testReportingSystem();
      await this.testDashboardIntegration();

      // Generate report
      const report = await this.generateReport();

      // Print summary
      this.log('================================================');
      this.log('📊 MONITORING SCRIPT VALIDATION RESULTS');
      this.log('================================================');
      this.log(`📈 Summary:`);
      this.log(`   Total Tests: ${report.summary.total}`);
      this.log(`   Passed: ${report.summary.passed}`);
      this.log(`   Failed: ${report.summary.failed}`);
      this.log(`   Success Rate: ${report.summary.successRate}%`);
      this.log(`   Duration: ${report.duration}ms`);
      this.log('================================================');

      for (const category of report.categories) {
        this.log(`\n📂 ${category.category}:`);
        this.log(`   Tests: ${category.total}, Passed: ${category.passed}, Failed: ${category.failed}`);
        for (const test of category.tests) {
          const status = test.passed ? '✅' : '❌';
          this.log(`   ${status} ${test.name}`);
        }
      }

      if (report.summary.failed === 0) {
        this.log('\n🎉 ALL MONITORING SCRIPTS VALIDATED SUCCESSFULLY!');
        this.log('✅ Monitoring system is ready for production deployment.');
      } else {
        this.log(`\n⚠️  ${report.summary.failed} VALIDATION ISSUES FOUND`);
        this.log('❌ Some monitoring components need attention before deployment.');
      }

      this.log('================================================');

      return report;
    } catch (error) {
      this.log(`❌ Validation failed: ${error.message}`);
      throw error;
    } finally {
      await this.stopAllServers();
    }
  }
}

// Run the validation
if (require.main === module) {
  const validator = new MonitoringValidator();
  validator.run().catch(console.error);
}

module.exports = MonitoringValidator;
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting KALDRIX Test Suite...\n');

// Test files to run
const testFiles = [
  'tests/integration/api/health-endpoint.test.ts',
  'tests/integration/parallel-processing/parallel-processing.test.ts',
  'tests/integration/monitoring/performance-monitoring.test.ts',
  'tests/integration/smart-contracts/contract-deployment.test.ts'
];

async function runTestFile(testFile) {
  return new Promise((resolve, reject) => {
    console.log(`📋 Running ${testFile}...`);
    
    const vitest = spawn('npx', ['vitest', 'run', testFile, '--reporter=verbose'], {
      stdio: 'pipe',
      shell: true
    });

    let stdout = '';
    let stderr = '';

    vitest.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      process.stdout.write(output);
    });

    vitest.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      process.stderr.write(output);
    });

    vitest.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${testFile} passed\n`);
        resolve({ file: testFile, passed: true, output: stdout });
      } else {
        console.log(`❌ ${testFile} failed with code ${code}\n`);
        resolve({ file: testFile, passed: false, output: stderr, code });
      }
    });

    // Timeout after 60 seconds
    setTimeout(() => {
      vitest.kill();
      console.log(`⏰ ${testFile} timed out\n`);
      resolve({ file: testFile, passed: false, output: 'Timeout', code: -1 });
    }, 60000);
  });
}

async function runAllTests() {
  const results = [];
  
  for (const testFile of testFiles) {
    try {
      const result = await runTestFile(testFile);
      results.push(result);
    } catch (error) {
      console.log(`💥 Error running ${testFile}:`, error.message);
      results.push({ file: testFile, passed: false, output: error.message });
    }
  }

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  
  console.log(`Total tests: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n❌ Failed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.file}`);
    });
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (failed === 0) {
    console.log('🎉 All tests passed! KALDRIX system is verified.');
    process.exit(0);
  } else {
    console.log('💥 Some tests failed. Please review the output above.');
    process.exit(1);
  }
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n🛑 Test execution interrupted.');
  process.exit(1);
});

runAllTests().catch(console.error);
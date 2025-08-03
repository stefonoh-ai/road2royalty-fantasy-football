#!/usr/bin/env node

/**
 * Road 2 Royalty Backend Monitor
 * Simple monitoring script to keep your Render backend awake
 * 
 * Usage:
 *   node monitor_backend.js           # Run once
 *   node monitor_backend.js --watch   # Continuous monitoring
 *   node monitor_backend.js --draft   # Draft day mode (more frequent checks)
 */

const https = require('https');

const BACKEND_URL = 'https://road2royalty-backend.onrender.com';
const ENDPOINTS_TO_CHECK = [
  '/',
  '/league',
  '/teams', 
  '/payment',
  '/draft-race-status'
];

// Monitoring intervals (in minutes)
const INTERVALS = {
  normal: 10,    // Check every 10 minutes
  draft: 2,      // Draft day: check every 2 minutes
  watch: 5       // Watch mode: check every 5 minutes
};

/**
 * Make HTTP request with timeout
 */
function makeRequest(url, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data,
          responseTime: Date.now() - startTime
        });
      });
    });

    const startTime = Date.now();
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.on('error', reject);
  });
}

/**
 * Check single endpoint
 */
async function checkEndpoint(endpoint) {
  const url = `${BACKEND_URL}${endpoint}`;
  
  try {
    console.log(`🔍 Checking: ${endpoint}`);
    const result = await makeRequest(url);
    
    if (result.status === 200) {
      console.log(`✅ ${endpoint} - OK (${result.responseTime}ms)`);
      return { endpoint, status: 'ok', responseTime: result.responseTime };
    } else {
      console.log(`⚠️  ${endpoint} - HTTP ${result.status}`);
      return { endpoint, status: 'warning', code: result.status };
    }
  } catch (error) {
    console.log(`❌ ${endpoint} - ERROR: ${error.message}`);
    return { endpoint, status: 'error', error: error.message };
  }
}

/**
 * Check all endpoints
 */
async function checkAllEndpoints() {
  console.log(`\n🚀 Road 2 Royalty Backend Health Check - ${new Date().toLocaleString()}`);
  console.log('=' .repeat(60));
  
  const results = [];
  
  for (const endpoint of ENDPOINTS_TO_CHECK) {
    const result = await checkEndpoint(endpoint);
    results.push(result);
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  const okCount = results.filter(r => r.status === 'ok').length;
  const totalCount = results.length;
  
  console.log('\n📊 Summary:');
  console.log(`✅ Healthy: ${okCount}/${totalCount} endpoints`);
  
  if (okCount === totalCount) {
    console.log('🎉 Backend is fully operational!');
  } else {
    console.log('⚠️  Some endpoints may need attention');
  }
  
  const avgResponseTime = results
    .filter(r => r.responseTime)
    .reduce((sum, r) => sum + r.responseTime, 0) / okCount;
    
  if (avgResponseTime) {
    console.log(`⏱️  Average response time: ${Math.round(avgResponseTime)}ms`);
  }
  
  return results;
}

/**
 * Wake up backend if sleeping
 */
async function wakeUpBackend() {
  console.log('\n😴 Backend appears to be sleeping. Attempting wake-up...');
  
  try {
    await makeRequest(BACKEND_URL, 45000); // 45 second timeout for wake-up
    console.log('✅ Backend wake-up successful!');
    
    // Wait a moment then verify
    await new Promise(resolve => setTimeout(resolve, 2000));
    const verifyResult = await makeRequest(BACKEND_URL, 10000);
    
    if (verifyResult.status === 200) {
      console.log('✅ Backend is now fully awake and responding');
      return true;
    }
  } catch (error) {
    console.log(`❌ Wake-up failed: ${error.message}`);
  }
  
  return false;
}

/**
 * Continuous monitoring
 */
async function startMonitoring(mode = 'normal') {
  const interval = INTERVALS[mode] || INTERVALS.normal;
  
  console.log(`🔄 Starting continuous monitoring (${mode} mode)`);
  console.log(`⏰ Checking every ${interval} minutes`);
  console.log('Press Ctrl+C to stop\n');
  
  // Initial check
  let results = await checkAllEndpoints();
  
  // Set up interval
  const intervalId = setInterval(async () => {
    results = await checkAllEndpoints();
    
    // If all endpoints failed, try to wake up backend
    const failedCount = results.filter(r => r.status === 'error').length;
    if (failedCount === results.length) {
      await wakeUpBackend();
    }
    
  }, interval * 60 * 1000); // Convert minutes to milliseconds
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping monitor...');
    clearInterval(intervalId);
    console.log('✅ Monitor stopped. Backend should stay awake for ~15 minutes.');
    process.exit(0);
  });
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Road 2 Royalty Backend Monitor

Usage:
  node monitor_backend.js           # Single health check
  node monitor_backend.js --watch   # Continuous monitoring (every 5 min)
  node monitor_backend.js --draft   # Draft day mode (every 2 min)
  
Options:
  --help, -h    Show this help message
  --watch       Continuous monitoring mode
  --draft       Draft day monitoring (more frequent)
    `);
    return;
  }
  
  if (args.includes('--draft')) {
    await startMonitoring('draft');
  } else if (args.includes('--watch')) {
    await startMonitoring('watch');
  } else {
    // Single check
    await checkAllEndpoints();
    console.log('\n💡 Tip: Use --watch for continuous monitoring or --draft for draft day mode');
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Script error:', error);
  process.exit(1);
});

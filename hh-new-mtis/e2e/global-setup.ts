// Global setup: reset DB once before all tests
// This avoids the race condition where each test suite calls resetDB() in parallel
// and the Express better-sqlite3 connection crashes

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

module.exports = async function globalSetup() {
  console.log('\n[Global Setup] Resetting E2E database...');

  try {
    // Delete DB file and restart container for fresh state
    try {
      execSync('docker exec hh-new-mtis-api-1 sh -c "rm -f /app/data/database.sqlite /app/data/database.sqlite-wal /app/data/database.sqlite-shm"', { stdio: 'pipe', timeout: 5000 });
    } catch(e) { /* DB might not exist */ }
    
    execSync('docker restart hh-new-mtis-api-1', { stdio: 'pipe', timeout: 30000 });
    console.log('[Global Setup] Container restarted, waiting for API...');
    
    // Wait for healthy
    const http = require('http');
    for (let i = 0; i < 30; i++) {
      try {
        await new Promise((resolve, reject) => {
          const req = http.request({
            hostname: 'localhost', port: 3000, path: '/api/health', method: 'GET',
            headers: { 'Content-Length': '0' }
          }, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => {
              try { if (JSON.parse(d).status === 'ok') resolve(); else reject(); }
              catch(e) { reject(e); }
            });
          });
          req.on('error', reject);
          req.end();
        });
        console.log('[Global Setup] API healthy');
        break;
      } catch (e) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    console.log('[Global Setup] Complete\n');
  } catch (e) {
    console.error('[Global Setup] Error:', e.message);
    process.exit(1);
  }
};

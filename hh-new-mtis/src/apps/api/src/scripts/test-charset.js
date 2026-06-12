// test-charset — Verify Content-Type header includes charset=utf-8
//
// Usage:
//   node src/scripts/test-charset.js [--base-url URL]
//
// Tests:
//   GET /api/health — default JSON response
//   GET /api/health/db — JSON with DB check
//   GET /api/ready — JSON readiness check
//
// Expected: Content-Type: application/json; charset=utf-8 on ALL responses

const http = require('http');

const BASE_URL = process.argv[2]?.replace(/^--base-url=/, '') || 'http://localhost:3000';

const ENDPOINTS = [
  '/api/health',
  '/api/health/db',
  '/api/ready',
];

let passed = 0;
let failed = 0;

async function test() {
  console.log(`🧪 Testing charset enforcement on ${BASE_URL}\n`);

  for (const endpoint of ENDPOINTS) {
    const url = new URL(endpoint, BASE_URL);
    const result = await fetch(url.href);
    const contentType = result.headers.get('content-type') || '';

    const hasCharset = contentType.includes('charset=utf-8');
    const status = hasCharset ? '✅ PASS' : '❌ FAIL';

    if (hasCharset) {
      passed++;
    } else {
      failed++;
    }

    console.log(`${status}  ${endpoint}`);
    console.log(`       Status: ${result.status}`);
    console.log(`       Content-Type: ${contentType}`);
    console.log('');
  }

  console.log(`─`.repeat(60));
  console.log(`Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.log('\n⚠️  Charset enforcement is MISSING on some endpoints!');
    console.log('   → Ensure enforceCharset() middleware is applied BEFORE routes in app.js');
    process.exit(1);
  } else {
    console.log('\n✨ All JSON responses include charset=utf-8!');
    process.exit(0);
  }
}

test().catch((err) => {
  console.error('❌ Error:', err.message);
  console.log('\n   Make sure the server is running: node src/index.js');
  process.exit(1);
});

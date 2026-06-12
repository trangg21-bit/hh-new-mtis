/**
 * M02 QA Test Script — test 8 API routes
 * Run: node src/apps/api/test-routes.js
 * Requires: server running (npm start) with ENABLE_E2E_TEST_HOOKS=true
 */
const http = require('http');
const BASE = 'http://localhost:3000';

let passed = 0;
let failed = 0;
let token = null;

function req(method, path, body = null, auth = true) {
  return new Promise((resolve) => {
    const opts = {
      hostname: 'localhost', port: 3000,
      path, method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (auth && token) opts.headers['Authorization'] = `Bearer ${token}`;
    const r = http.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    r.on('error', e => resolve({ status: 0, body: { error: e.message } }));
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

async function test(name, fn) {
  try {
    const result = await fn();
    if (result.status >= 200 && result.status < 300) {
      passed++;
      console.log(`  ✅ ${name} (${result.status})`);
    } else if (result.status === 404 && name.includes('not found')) {
      passed++;
      console.log(`  ✅ ${name} (${result.status} - expected)`);
    } else {
      failed++;
      console.log(`  ❌ ${name} — status=${result.status}`, JSON.stringify(result.body).slice(0, 120));
    }
  } catch (e) {
    failed++;
    console.log(`  ❌ ${name} — crash: ${e.message}`);
  }
  return result;
}

async function run() {
  console.log('\n═══════════════════════════════════════');
  console.log('  M02 QA Test Suite — System Administration');
  console.log('═══════════════════════════════════════\n');

  // Step 1: Login to get token
  console.log('── Step 1: Auth ──');
  const login = await req('POST', '/api/auth/login', { username: 'admin', password: 'admin123' });
  if (login.status === 200 && login.body.token) {
    token = login.body.token;
    console.log('  ✅ Login OK');
  } else {
    console.log('  ❌ Login FAILED — cannot proceed');
    process.exit(1);
  }

  // Step 2: Reset DB to clean state
  console.log('\n── Step 2: Reset DB ──');
  await test('Reset DB', () => req('POST', '/api/admin/reset-db', { password: 'admin123' }));

  // Step 3: F-M02-001 — Units
  console.log('\n── F-M02-001: Unit Management ──');
  let res = await test('GET /api/units (empty)', () => req('GET', '/api/units'));
  res = await test('POST /api/units — create unit', () => req('POST', '/api/units', { name: 'Phòng KCHT', code: 'KCHT', type: 'department' }));
  const unitId = res.body.id;
  res = await test('GET /api/units (1 item)', () => req('GET', '/api/units'));
  res = await test('GET /api/units/:id', () => req('GET', `/api/units/${unitId}`));
  res = await test('POST /api/units — create child', () => req('POST', '/api/units', { name: 'Tổ GIS', code: 'GIS', parent_id: unitId }));
  res = await test('POST /api/units — duplicate code', () => req('POST', '/api/units', { name: 'Trùng', code: 'KCHT' }));
  if (res.status === 409) { passed++; console.log('  ✅ POST /api/units — duplicate code rejected (409)'); }
  else { failed++; console.log(`  ❌ POST /api/units — duplicate code expected 409 got ${res.status}`); }
  res = await test('PUT /api/units/:id — update', () => req('PUT', `/api/units/${unitId}`, { name: 'Phòng KCHT Sửa', code: 'KCHT' }));
  res = await test('GET /api/units/tree', () => req('GET', '/api/units/tree'));

  // Step 4: F-M02-002 — Interconnect Config
  console.log('\n── F-M02-002: Interconnect Configuration ──');
  res = await test('POST /api/interconnect-configs', () => req('POST', '/api/interconnect-configs', {
    system_name: 'LGSP Hải Phòng', system_code: 'LGSP-HP', endpoint_url: 'https://lgsp.haiphong.gov.vn/api', auth_type: 'api_key', auth_config: '{"key":"xxx"}'
  }));
  const intId = res.body.id;
  res = await test('GET /api/interconnect-configs', () => req('GET', '/api/interconnect-configs'));

  // Step 5: F-M02-003 — Admin Accounts
  console.log('\n── F-M02-003: Admin Accounts ──');
  res = await test('POST /api/admin-accounts — create', () => req('POST', '/api/admin-accounts', {
    username: 'admin2', password: 'pass123', full_name: 'Admin 2', role: 'Chuyên viên'
  }));
  const adminId = res.body.id;
  res = await test('PUT /api/admin-accounts/:id/reset-password', () => req('PUT', `/api/admin-accounts/${adminId}/reset-password`, { password: 'newpass456' }));

  // Step 6: F-M02-004 — Approval
  console.log('\n── F-M02-004: Approval Management ──');
  res = await test('POST /api/approval/requests — create request', () => req('POST', '/api/approval/requests', {
    workflow_id: 1, title: 'Phê duyệt đơn vị mới', requester_id: 1
  }));
  const reqId = res.body.id;
  res = await test('GET /api/approval/requests', () => req('GET', '/api/approval/requests'));

  // Step 7: F-M02-005 — Audit Logs
  console.log('\n── F-M02-005: Audit Log Viewer ──');
  res = await test('GET /api/audit-logs', () => req('GET', '/api/audit-logs'));

  // Step 8: F-M02-006 — System Config
  console.log('\n── F-M02-006: System Configuration ──');
  res = await test('POST /api/system-config', () => req('POST', '/api/system-config', {
    key: 'site_name', value: 'Hệ thống quản lý KCHT', description: 'Tên hệ thống', category: 'general'
  }));
  res = await test('GET /api/system-config/site_name', () => req('GET', '/api/system-config/site_name'));
  res = await test('GET /api/system-config', () => req('GET', '/api/system-config'));

  // Step 9: F-M02-007 — Permission Policies
  console.log('\n── F-M02-007: Permission Policies ──');
  res = await test('GET /api/permission-policies', () => req('GET', '/api/permission-policies'));

  // Step 10: F-M02-008 — Backup
  console.log('\n── F-M02-008: Backup ──');
  res = await test('GET /api/backup', () => req('GET', '/api/backup'));
  res = await test('POST /api/backup/create', () => req('POST', '/api/backup/create'));

  // Step 11: Health check + logs
  console.log('\n── System Health ──');
  res = await test('GET /api/health', () => req('GET', '/api/health', null, false));
  res = await test('GET /api/health/db', () => req('GET', '/api/health/db', null, false));

  // Summary
  const total = passed + failed;
  console.log('\n═══════════════════════════════════════');
  console.log(`  RESULTS: ${passed}/${total} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════\n');
  process.exit(failed > 0 ? 1 : 0);
}

run();

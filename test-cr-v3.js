const http = require('http');

function apiCall(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const payload = body ? JSON.stringify(body) : '';
    
    const req = http.request({
      hostname: 'localhost', port: 3000, path, method,
      headers, 'Content-Length': Buffer.byteLength(payload)
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d, headers: res.headers }));
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function main() {
  // 1. Login
  const login = await apiCall('POST', '/api/auth/login', { username: 'admin', password: 'admin123' });
  const token = JSON.parse(login.body).token;
  console.log('✅ Login OK');

  // 2. Test CR-V3-02: Self-delete with WRONG password → should be 400
  const delWrong = await apiCall('DELETE', '/api/users/self', { password: 'wrong_password_123' }, token);
  console.log(`\n🔍 CR-V3-02 (self-delete wrong pw): status=${delWrong.status}`);
  if (delWrong.status === 400) console.log('   ✅ PASS - rejects wrong password');
  else console.log(`   ❌ FAIL - expected 400, got ${delWrong.status}: ${delWrong.body}`);

  // 3. Test CR-V3-02: Self-delete with CORRECT password → should be 200
  const delOk = await apiCall('DELETE', '/api/users/self', { password: 'admin123' }, token);
  console.log(`\n🔍 CR-V3-02 (self-delete correct pw): status=${delOk.status}`);
  if (delOk.status === 200) console.log('   ✅ PASS - deletes account');
  else console.log(`   ❌ FAIL - expected 200, got ${delOk.status}: ${delOk.body}`);

  // 4. Re-login as admin (after self-delete, need admin to restore)
  console.log('\n🔁 Re-seeding admin account...');
  await apiCall('POST', '/api/admin/reset-db', null, token);
  
  // 5. Login again after reset
  const login2 = await apiCall('POST', '/api/auth/login', { username: 'admin', password: 'admin123' });
  const token2 = JSON.parse(login2.body).token;
  
  // 6. Test CR-V3-03: Change password → check login_log has password_changed entry
  const pwdBefore = await apiCall('GET', '/api/auth/login-log?status=password_changed&page=1&limit=10', null, token2);
  const pwdBeforeJson = JSON.parse(pwdBefore.body);
  const beforeCount = pwdBeforeJson.total;
  console.log(`\n🔍 CR-V3-03 (password_change log before): total=${beforeCount}`);

  await apiCall('PUT', '/api/auth/change-password', { old_password: 'admin123', new_password: 'newP@ss123' }, token2);
  
  const pwdAfter = await apiCall('GET', '/api/auth/login-log?status=password_changed&page=1&limit=10', null, token2);
  const pwdAfterJson = JSON.parse(pwdAfter.body);
  const afterCount = pwdAfterJson.total;
  console.log(`🔍 CR-V3-03 (password_change log after): total=${afterCount}`);
  if (afterCount > beforeCount) console.log('   ✅ PASS - new log entry created');
  else console.log('   ❌ FAIL - no new log entry');

  // 7. Test CR-V3-01: E2E reset with wrong password
  const resetWrong = await apiCall('POST', '/api/admin/reset-db', { password: 'wrong_admin_pw' }, token2);
  console.log(`\n🔍 CR-V3-01 (E2E reset wrong pw): status=${resetWrong.status}`);
  if (resetWrong.status === 400 || resetWrong.status === 401 || resetWrong.status === 403) console.log('   ✅ PASS - rejects wrong password');
  else console.log(`   ❌ FAIL - expected 400/401/403, got ${resetWrong.status}: ${resetWrong.body}`);

  // 8. E2E reset with correct password
  const resetOk = await apiCall('POST', '/api/admin/reset-db', { password: 'admin123' }, token2);
  console.log(`🔍 CR-V3-01 (E2E reset correct pw): status=${resetOk.status}`);
  if (resetOk.status === 200) console.log('   ✅ PASS - resets with correct password');
  else console.log(`   ❌ FAIL - expected 200, got ${resetOk.status}: ${resetOk.body}`);

  // 9. Re-login after reset
  const login3 = await apiCall('POST', '/api/auth/login', { username: 'admin', password: 'admin123' });
  console.log(`\n🔁 Re-login after reset: status=${login3.status} ✅`);
}

main().catch(e => console.error('Error:', e.message));

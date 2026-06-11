const http = require('http');

function apiCall(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const payload = body ? JSON.stringify(body) : '';

    const r = http.request({
      hostname: 'localhost', port: 3000, path, method,
      headers, 'Content-Length': Buffer.byteLength(payload)
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    r.on('error', reject);
    if (payload) r.write(payload);
    r.end();
  });
}

(async function main() {
  // 1. Login
  console.log('=== Login ===');
  const login = await apiCall('POST', '/api/auth/login', { username: 'admin', password: 'admin123' });
  const loginData = JSON.parse(login.body);
  console.log('Status:', login.status);
  if (login.status === 200 && loginData.token) {
    console.log('✅ Login OK, token length:', loginData.token.length);
    const token = loginData.token;

    // 2. Test CR-V3-02: GET /api/users/self to verify user exists
    console.log('\n=== Verify user exists ===');
    const me = await apiCall('GET', '/api/auth/me', null, token);
    const meData = JSON.parse(me.body);
    console.log('GET /auth/me status:', me.status);
    console.log('User id:', meData.user.id);
    console.log('User username:', meData.user.username);

    // 3. Test CR-V3-02: DELETE /api/users/self with WRONG password
    console.log('\n=== CR-V3-02: Self-delete with WRONG password ===');
    const delWrong = await apiCall('DELETE', '/api/users/self', { password: 'wrong_password_123' }, token);
    const delWrongData = JSON.parse(delWrong.body);
    console.log('Status:', delWrong.status);
    console.log('Body:', delWrong.body);
    if (delWrong.status === 400 && delWrongData.error && delWrongData.error.includes('Mật khẩu')) {
      console.log('✅ PASS - rejects wrong password');
    } else {
      console.log('❌ FAIL - expected 400 with password error');
    }

    // 4. Test CR-V3-02: DELETE /api/users/self with NO password
    console.log('\n=== CR-V3-02: Self-delete with NO password ===');
    const delNoPw = await apiCall('DELETE', '/api/users/self', null, token);
    const delNoPwData = JSON.parse(delNoPw.body);
    console.log('Status:', delNoPw.status);
    console.log('Body:', delNoPw.body);
    if (delNoPw.status === 400 && delNoPwData.error && delNoPwData.error.includes('Thiếu')) {
      console.log('✅ PASS - rejects missing password');
    } else {
      console.log('❌ FAIL - expected 400 with missing password error');
    }

    // 5. Test CR-V3-03: Change password → check login_log has password_changed
    console.log('\n=== CR-V3-03: Password change audit log ===');
    const logBefore = await apiCall('GET', '/api/auth/login-log?status=password_changed&page=1&limit=10', null, token);
    const logBeforeData = JSON.parse(logBefore.body);
    const beforeCount = logBeforeData.total;
    console.log('password_changed log count before:', beforeCount);

    // Need to change password - need a new valid password that passes validation
    const pwdChange = await apiCall('PUT', '/api/auth/change-password', {
      old_password: 'admin123',
      new_password: 'NewP@ssw0rd1!'
    }, token);
    const pwdChangeData = JSON.parse(pwdChange.body);
    console.log('Change password status:', pwdChange.status);
    console.log('Change password body:', pwdChange.body);

    const logAfter = await apiCall('GET', '/api/auth/login-log?status=password_changed&page=1&limit=10', null, token);
    const logAfterData = JSON.parse(logAfter.body);
    const afterCount = logAfterData.total;
    console.log('password_changed log count after:', afterCount);
    if (afterCount > beforeCount) {
      console.log('✅ PASS - new log entry created');
    } else {
      console.log('❌ FAIL - no new log entry');
    }

    // 6. Test CR-V3-01: E2E reset with wrong password
    console.log('\n=== CR-V3-01: E2E reset with WRONG password ===');
    const resetWrong = await apiCall('POST', '/api/admin/reset-db', { password: 'wrong_admin_pw' }, token);
    const resetWrongData = JSON.parse(resetWrong.body);
    console.log('Status:', resetWrong.status);
    console.log('Body:', resetWrong.body);
    if (resetWrong.status === 400) {
      console.log('✅ PASS - rejects wrong password');
    } else {
      console.log('❌ FAIL - expected 400, got ' + resetWrong.status);
    }

    // 7. E2E reset with correct password
    console.log('\n=== CR-V3-01: E2E reset with CORRECT password ===');
    const resetOk = await apiCall('POST', '/api/admin/reset-db', { password: 'admin123' }, token);
    const resetOkData = JSON.parse(resetOk.body);
    console.log('Status:', resetOk.status);
    console.log('Body:', resetOk.body);
    if (resetOk.status === 200) {
      console.log('✅ PASS - resets with correct password');
    } else {
      console.log('❌ FAIL - expected 200, got ' + resetOk.status);
    }

    // 8. Re-login after reset
    console.log('\n=== Re-login after reset ===');
    const login2 = await apiCall('POST', '/api/auth/login', { username: 'admin', password: 'admin123' });
    const login2Data = JSON.parse(login2.body);
    console.log('Login after reset status:', login2.status);
    if (login2.status === 200 && login2Data.token) {
      console.log('✅ PASS - can re-login with admin123');
    } else {
      console.log('❌ FAIL - cannot re-login');
    }

  } else {
    console.log('❌ Login failed:', login.body);
  }
})();

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend, Gauge } from 'k6/metrics';

// Custom metrics
const loginSuccessRate = new Rate('login_success_rate');
const loginDuration = new Trend('login_duration');
const loginErrorRate = new Rate('login_error_rate');

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // ramp up to 10 users
    { duration: '2m', target: 10 },    // stay at 10
    { duration: '30s', target: 30 },   // ramp up to 30
    { duration: '2m', target: 30 },    // stay at 30
    { duration: '30s', target: 50 },   // ramp up to 50
    { duration: '2m', target: 50 },    // stay at 50
    { duration: '30s', target: 0 },    // ramp down
  ],
  thresholds: {
    login_duration: ['p(95)<1000', 'p(99)<2000'],
    login_success_rate: ['rate>=0.9'],
    login_error_rate: ['rate<=0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // 1. Login
  const loginPayload = JSON.stringify({
    username: 'admin',
    password: 'admin123'
  });

  const loginRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' }
  });

  loginSuccessRate.check(loginRes, { 'login success': (r) => r.status === 200 });
  loginErrorRate.check(loginRes, { 'login error': (r) => r.status !== 200 });
  loginDuration.add(loginRes.timings.duration);

  const success = check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'has token': (r) => {
      const body = JSON.parse(r.body);
      return body.token !== undefined;
    }
  });

  if (!success) {
    console.log(`Login failed: ${loginRes.status} - ${loginRes.body}`);
    return;
  }

  const token = JSON.parse(loginRes.body).token;

  // 2. GET /api/auth/me
  const headers = { Authorization: `Bearer ${token}` };
  const meRes = http.get(`${BASE_URL}/api/auth/me`, { headers });

  check(meRes, {
    'me status 200': (r) => r.status === 200,
    'me has user': (r) => {
      const body = JSON.parse(r.body);
      return body.user !== undefined;
    }
  });

  // 3. GET /api/users
  const usersRes = http.get(`${BASE_URL}/api/users`, { headers });

  check(usersRes, {
    'users status 200': (r) => r.status === 200,
    'users has data': (r) => {
      const body = JSON.parse(r.body);
      return body.users !== undefined;
    }
  });

  // 4. GET /api/admin/stats
  const statsRes = http.get(`${BASE_URL}/api/admin/stats`, { headers });

  check(statsRes, {
    'stats status 200': (r) => r.status === 200,
    'stats has total_users': (r) => {
      const body = JSON.parse(r.body);
      return body.total_users !== undefined;
    }
  });

  sleep(1);
}

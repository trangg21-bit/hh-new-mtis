---
feature-id: M-001
document: "dashboard-blocker-resolution"
output-mode: "lean"
last-updated: "2026-06-13"
module: "M-001 User Management"
---

# Dashboard Blocker Resolution Report

**Date:** 2026-06-13  
**Author:** Lead Business Analyst (ETC AI)  
**Status:** Both blockers RESOLVED via analysis of existing backend architecture

---

## Executive Summary

This report resolves 2 blockers from the BA dashboard requirements analysis. Both blockers are resolved **without creating new API endpoints** — the existing backend already provides sufficient data through `GET /api/admin/stats` and `GET /api/health` endpoints. The dashboard will use mock data as fallback for demo purposes and switch to real API data when deployed.

---

## Blocker 1: API_MISSING — Resolution: REUSE EXISTING APIs

### Finding

The dashboard spec proposed 2 new API endpoints:
- `GET /api/admin/alerts`
- `GET /api/admin/system-health`

### Analysis of Existing Backend

After auditing `src/apps/api/src/app.js` and all route files, the system already has:

| Proposed API | Existing Equivalent | Auth Requirement |
|---|---|---|
| `GET /api/admin/alerts` | `GET /api/admin/stats` (line 167-195 of app.js) — includes `failed_logins_30d`, `locked_accounts`, `active_sessions` which serve as alert data | `authMiddleware` + `adminMiddleware` |
| `GET /api/admin/system-health` | `GET /api/health` (line 279-281) + `GET /api/ready` (line 294-301) — shallow and deep health checks | No auth required (public) |

Additionally:
- `GET /api/auth/login-log` already provides recent activity (used by dashboard `loadActivity()`)
- `GET /api/health/db` provides DB health status
- `GET /api/health` provides system uptime status
- Alert webhook service exists at `services/alertService.js` but is for **outbound notifications**, not dashboard display

### Decision: ✅ RESOLVED — No new APIs needed

**Rationale:**
1. **`/api/admin/alerts`**: The `GET /api/admin/stats` endpoint already returns `locked_accounts`, `failed_logins_30d`, and `active_sessions` — these ARE the alert data the dashboard needs. The dashboard's "pending_requests" stat card can reuse `failed_logins_30d` (failed login attempts requiring admin attention).

2. **`/api/admin/system-health`**: The `GET /api/health` endpoint already returns `{status, time}`. The dashboard currently hardcodes `system-api-status` to `🟢 Online` after `loadStats()` succeeds — this is sufficient for current needs.

### Recommended Dashboard Changes

**No backend changes required.** The dashboard should:

1. Display system health using existing `/api/health` response
2. Use existing `/api/admin/stats` fields for alert-related cards:
   - `locked_accounts` → "Tài khoản bị khóa" card (already implemented)
   - `failed_logins_30d` → "Yêu cầu chờ" card (replace `pending_requests` mock value)
3. Update dashboard to show real API status from `/api/health` endpoint

---

## Blocker 2: UNRESOLVED_AMBIGUITY — Resolution: DECISIONS MADE

### 2.1 Mock Data — User Count Recommendation

| Metric | Recommended Mock Value | Source/Justification |
|--------|----------------------|---------------------|
| `total_users` | **247** | Current MOCK_STATS value in dashboard.js (line 43). Represents a government agency with ~250 employees across 3 org levels |
| `active_sessions` | **18** | ~7% of total — realistic concurrent session ratio for government work hours |
| `locked_accounts` | **5** | ~2% lock rate — reasonable for brute-force protection threshold |
| `active_modules` | **1** | Only M01 is deployed; M02-M11 are planned |
| `total_modules` | **11** | Full roadmap M01-M11 |
| `failed_logins_30d` | **23** | ~9% of login volume in 30 days — realistic for security monitoring |
| `totp_enabled` | **3** | ~1.2% adoption — early-stage MFA rollout |

**Context:** This is a pilot for "Cục Hàng hải Việt Nam" (Vietnam Maritime Administration). 247 users represents a medium-sized government agency with headquarters and port authority branches.

### 2.2 Refresh Strategy — Decision: MANUAL + EVENT-DRIVEN

| Component | Strategy | Rationale |
|-----------|----------|-----------|
| Stat cards | **Manual refresh on navigation** | Dashboard is SPA with hash routing; refresh on route change is sufficient |
| Activity feed | **Poll 30s interval** | Login-log API is lightweight (SQLite); 30s is acceptable for real-time feel |
| System health | **Check on every load** | `/api/health` is instant; no polling needed |
| Module roadmap | **Static data (no refresh)** | Module roadmap is static configuration, changes infrequently |

**Decision: MANUAL REFRESH (not polling, not WebSocket)**

**Reasons:**
1. **Architecture simplicity:** The system uses vanilla JS SPA without a WebSocket server. Adding WebSocket would require backend changes (new endpoint, connection management).
2. **Scale-appropriate:** With ~250 users, polling every 30s is trivial (single SQLite query). No need for WebSocket complexity.
3. **SPA routing pattern:** The SPA already reloads data on `afterRender()` for each screen. Dashboard `loadStats()` + `loadActivity()` already follows this pattern.
4. **No real-time alerts needed:** Dashboard is informational, not operational monitoring. 30s delay is acceptable for alert visibility.

**Implementation:**
- `loadStats()`: Called once on dashboard render (afterRender hook)
- `loadActivity()`: Called once on dashboard render, with 30s `setInterval` poll
- Add a "Refresh" button on stat cards for manual re-fetch
- No WebSocket — out of scope for current phase

### 2.3 Report Export Scope — Decision: REUSE EXISTING MECHANISMS

The dashboard currently shows a "Báo cáo" quick-access item. Based on existing functionality:

| Export Feature | Status | Implementation |
|---------------|--------|----------------|
| User list Excel export | ✅ Implemented | `SCREEN_USERS.exportExcel()` — inline HTML table export |
| Login log export | 🟡 Inherited from M02 | `GET /api/audit-logs/export` placeholder exists |
| Dashboard summary report | ❌ Not implemented | New feature — NOT in scope for M01 dashboard |

**Decision:** Dashboard export scope is limited to:
1. **User data** — already exported via user list screen
2. **Login log** — already accessible via login-log screen  
3. **Dashboard overview** — NOT implementing new export at this stage; M08 Reporting module will handle this

---

## Revised API Contract (for frontend reference)

### `GET /api/admin/stats` (existing, no changes needed)

**Auth:** `authMiddleware` + `adminMiddleware`  
**Response:**
```json
{
  "total_users": 247,
  "total_groups": 3,
  "total_organizations": 3,
  "active_sessions": 18,
  "locked_accounts": 5,
  "totp_enabled": 3,
  "recent_logins": 120,
  "failed_logins_30d": 23,
  "users_by_role": [
    { "role": "system-admin", "count": 1 },
    { "role": "director", "count": 2 },
    { "role": "port-authority-leader", "count": 4 },
    { "role": "infrastructure-officer", "count": 240 }
  ]
}
```

### `GET /api/health` (existing, no changes needed)

**Auth:** None (public)  
**Response:**
```json
{
  "status": "ok",
  "time": "2026-06-13T10:30:00.000Z"
}
```

### `GET /api/health/db` (existing, no changes needed)

**Auth:** None (public)  
**Response:**
```json
{
  "status": "ok",
  "db": true,
  "time": "2026-06-13T10:30:00.000Z"
}
```

### `GET /api/auth/login-log` (existing, already used by dashboard)

**Auth:** `authMiddleware` (admin can see all, regular users see own)  
**Query params:** `limit`, `page`, `status`, `username`, `from_date`, `to_date`  
**Response:**
```json
{
  "logs": [
    {
      "id": 1,
      "username": "admin",
      "ip": "192.168.1.10",
      "device": "Chrome / macOS",
      "status": "success",
      "logged_at": "2026-06-13T10:20:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 5
}
```

---

## Dashboard Data Mapping (Revised)

| Dashboard Stat Card | Data Source | API Field |
|--------------------|-------------|-----------|
| Tổng người dùng | `/api/admin/stats` | `total_users` |
| Phiên đang hoạt động | `/api/admin/stats` | `active_sessions` |
| Tài khoản bị khóa | `/api/admin/stats` | `locked_accounts` |
| Tổng số module | Static | 11 |
| Module đang chạy | Static | 1 |
| Yêu cầu chờ | `/api/admin/stats` | `failed_logins_30d` (replaces `pending_requests`) |
| Hoạt động gần đây | `/api/auth/login-log` | `logs[]` (latest 5 entries) |
| System API Status | `/api/health` | `status` field (🟢 Online / 🟡 Demo) |

---

## Implementation Notes for Frontend Developer

### Changes needed in `dashboard.js`:

1. **Replace mock `pending_requests` with real `failed_logins_30d`:**
   ```javascript
   // In loadStats(), replace:
   pending_requests: MOCK_STATS.pending_requests
   // With:
   pending_requests: data.failed_logins_30d || MOCK_STATS.pending_requests
   ```

2. **Update system API status check:**
   ```javascript
   // After loadStats() succeeds, also check /api/health
   try {
     const health = await apiGet('/api/health');
     apiStatusEl.textContent = health.status === 'ok' ? '🟢 Online' : '🟡 Degraded';
   } catch {
     apiStatusEl.textContent = '🔴 Offline';
   }
   ```

3. **Activity feed refresh interval:**
   ```javascript
   // Add in afterRender(), after loadActivity():
   this._activityInterval = setInterval(() => this.loadActivity(), 30000);
   ```

4. **No mock data fallback for `failed_logins_30d`:**
   The fallback should default to `0` not the mock value, since this is security-relevant data.

### No backend changes needed — all endpoints exist and are functional.

---

## Verdict

| Blocker | Status | Action |
|---------|--------|--------|
| API_MISSING | ✅ RESOLVED | Reuse existing `/api/admin/stats` and `/api/health` endpoints |
| UNRESOLVED_AMBIGUITY | ✅ RESOLVED | Mock data set defined, polling strategy decided, export scope limited |

**No blockers remain. Dashboard implementation can proceed with existing APIs.**

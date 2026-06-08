# M01 — SRE & Observability Audit

## Verdict: Not-ready

## Audit Date: 2026-06-08

## Methodology

Đọc toàn bộ backend code (app.js, index.js, route files, middleware, services), Dockerfile, docker-compose.yml. Đánh giá theo Google SRE Workbook (Monitoring Distributed Systems, Managing Incidents), OpenTelemetry best practices, và 12-Factor App methodology. Focus: structured logging, metrics, tracing, health checks, alerting, SLO, incident response.

## Findings

### BLOCKER (0)

Không có blocker — đây là prototype (ADR-002), mức độ observability thấp được chấp nhận. Tuy nhiên, thiếu nghiêm trọng với production.

### HIGH (4)

| ID | Severity | Location | Description | SLO Impact | Remediation |
|----|----------|----------|-------------|------------|-------------|
| SRE-01 | HIGH | `index.js:4-8` | **No graceful shutdown**: Không handle SIGTERM/SIGINT. Khi Docker stop container, process bị kill ngay, không chờ in-flight requests hoàn thành. Kết nối DB không được đóng. | User đang login thì container restart → request fail, session corrupt | Thêm: `process.on('SIGTERM', () => { server.close(() => { db.close(); process.exit(0); }) })`. Set timeout 10s. |
| SRE-02 | HIGH | `app.js:108-110` | **Health check không kiểm tra DB**: `/api/health` chỉ trả `{status:'ok', time:...}` — không verify DB connection. Nếu DB bị corrupt, health check vẫn 200 OK → load balancer tiếp tục gửi traffic. | Auth request đến node có DB lỗi → crash/mất dữ liệu → error rate spike | Health check query DB: `SELECT 1`, return 503 nếu fail. Thêm `/api/ready` (startup) và `/api/live` (runtime) riêng. |
| SRE-03 | HIGH | Tất cả file | **Không structured logging**: Tất cả dùng `console.log`/`console.error`. Không timestamp format, không log level, không request ID, không JSON structured → không parse được bằng log aggregator (ELK, Loki, CloudWatch). | Incident: "login bị lỗi" → không grep được log theo request → MTTR cao | Dùng `pino` hoặc `winston` với JSON format. Mỗi log entry có: `timestamp, level, requestId, userId, route, message, error.stack`. |
| SRE-04 | HIGH | `middleware/authMiddleware.js:3-12` | **Không request tracing / correlation ID**: authMiddleware không tạo hoặc propagate `X-Request-ID`. Không thể trace 1 request qua các middleware khác nhau hoặc frontend → backend. | Incident với 1 user cụ thể → không thể theo dõi request của user đó qua logs | Middleware tạo UUID cho mỗi request (`req.id = uuid()`), gán vào `res.setHeader('X-Request-ID', req.id)`, pass vào logger context. |

### MEDIUM (5)

| ID | Severity | Location | Description | Remediation |
|----|----------|----------|-------------|-------------|
| SRE-05 | MEDIUM | Toàn bộ route | **Không metrics endpoint**: Không có `/metrics` (Prometheus format). Không counters cho: `login_success_total`, `login_fail_total`, `totp_verify_fail_total`, `rate_limited_total`, `account_locked_total`, `password_reset_total`, `jwt_invalid_total`, `api_request_duration_seconds`. | Thêm `prom-client` library. Expose `/metrics`. Instrument tất cả auth endpoints với RED metrics (Rate, Errors, Duration). |
| SRE-06 | MEDIUM | `Dockerfile` | **Docker HEALTHCHECK thiếu**: Không có `HEALTHCHECK` instruction. Docker không biết container có healthy không → restart policy `unless-stopped` vô nghĩa nếu app crash nhưng container vẫn chạy. | Thêm: `HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD node -e "require('http').get('http://localhost:3000/api/health',r=>process.exit(r.statusCode===200?0:1))"` |
| SRE-07 | MEDIUM | `app.js:20`, `docker-compose.yml` | **No alerting hooks**: Không webhook/webhook URL cho alerting. Các sự kiện critical (5 failed login → lockout, TOTP brute force, DB lỗi) chỉ log console. Ops team không biết khi có incident. | Implement webhook notifier (Slack, Teams, hoặc custom). Trigger khi: lockout xảy ra, rate limit bị hit >10 lần/phút, DB query fail. |
| SRE-08 | MEDIUM | `db.js:8-9` | **SQLite WAL không checkpoint**: WAL mode enabled nhưng không có auto-checkpoint. WAL file tăng vô hạn nếu có nhiều write → disk full. | Thêm định kỳ: `db.pragma('wal_checkpoint(TRUNCATE)')` trong `setInterval` mỗi 30 phút. |
| SRE-09 | MEDIUM | Tất cả route | **No performance baselines**: Không load test, không benchmark. Không biết p99 login latency, QPS tối đa, concurrent user limit. | Viết k6/Artillery script load test login + CRUD. Đo baseline: login p50/p99, users list p99. Set SLO từ baseline. |

### LOW (4)

| ID | Severity | Location | Description | Remediation |
|----|----------|----------|-------------|-------------|
| SRE-10 | LOW | `index.js:4-8` | **No startup probe**: API listen ngay mà không verify DB ready. Nếu DB file chưa mount → crash với lỗi không rõ ràng. | Startup check: `db.prepare('SELECT 1').get()` trước `app.listen()`. Log "DB ready". |
| SRE-11 | LOW | `auth.js:140-145` | **Logout không log event**: POST /logout không log gì vào login_log. Không biết user nào logout khi nào. | Log logout event vào login_log với status `logout`. |
| SRE-12 | LOW | `db.js:5-6` | **Không backup strategy**: SQLite file không có backup schedule, không có restore procedure. RPO = last backup time → infinite nếu chưa từng backup. | Cron: copy SQLite file ra `backups/` mỗi ngày (khi WAL checkpointed). Document restore procedure. |
| SRE-13 | LOW | `index.js:1-8` | **No unhandled error handler**: Không `process.on('uncaughtException')` hoặc `unhandledRejection`. Unhandled error → process crash không log. | Thêm global handler: log error, flush logger, exit(1). |

### INFO (2)

| ID | Location | Description |
|----|----------|-------------|
| SRE-14 | `docker-compose.yml:12-16` | Volume mount `./docs/ui:/app/public` cho phép hot-reload frontend — good cho dev. Nhưng không nên có trong production config. |
| SRE-15 | `app.js:17` | Express trên Node 22 — event loop có worker threads support nếu cần offload bcrypt trong tương lai. |

## Recommended SLOs for M01

| SLI | Target | Measurement | Window |
|-----|--------|-------------|--------|
| Login availability | 99.9% | `POST /api/auth/login` 200 response rate | 30 days |
| Login latency (p99) | < 1000ms | Duration of login request (full flow: query + bcrypt + JWT sign + session insert) | 30 days |
| Login error rate | < 1% | 4xx+5xx / total login requests | 30 days |
| Auth middleware latency (p99) | < 50ms | JWT verify + DB session check | 30 days |
| Password reset email delivery | < 5 min | Time from POST /forgot-password to email sent (via mock → prod) | 30 days |
| Failed login rate (security) | < 5% of all logins | `failed` / total login_log entries | 7 days |
| Rate limit hit rate | < 0.1% | Rate limited requests / total requests | 7 days |

## Operational Readiness Scorecard

| Capability | Current State | Gap |
|------------|--------------|-----|
| Structured Logging | console.log (unstructured) | Cần pino/winston JSON |
| Request Tracing | Không có correlation ID | Cần UUID middleware + propagate |
| Health Check | `/api/health` (shallow) | Cần DB check + /ready + /live |
| Metrics | Không có | Cần prom-client + /metrics |
| Alerting | Không có | Cần webhook notifier |
| Graceful Shutdown | Không có | Cần SIGTERM handler |
| Startup Probe | Không có DB check | Cần DB readiness check |
| Docker HEALTHCHECK | Không có | Cần HEALTHCHECK instruction |
| Backup/Restore | Không có | Cần SQLite backup cron |
| Load Testing | Chưa làm | Cần k6/Artillery baseline |
| Runbooks | Không có | Cần document incident response |
| Log Retention | Docker logs (default) | Cần log rotation + ship to aggregator |

## Summary

- **Total**: 15 findings (4 HIGH, 5 MEDIUM, 4 LOW, 2 INFO)
- **SRE Readiness**: 0/12 capabilities có sẵn — prototype stage, chấp nhận theo ADR-002
- **Critical gaps for production**:
  - Graceful shutdown (SRE-01): ảnh hưởng trực tiếp đến user experience khi deploy
  - Health check không DB (SRE-02): load balancer không detect node lỗi
  - Không structured logging (SRE-03): incident response không khả thi
  - Không request tracing (SRE-04): không debug được lỗi user-specific
- **Low-hanging fruit**: HEALTHCHECK (SRE-06, 3 dòng Dockerfile), startup probe (SRE-10, 2 dòng), WAL checkpoint (SRE-08, setInterval)

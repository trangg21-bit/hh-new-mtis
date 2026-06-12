# MTIS (M01 - User Management) - Local Quickstart Guide

## Project Location
- Source code: `C:\Users\trangtt1\HH.new\hh-new-mtis\src\apps\api\`
- Docker compose: `C:\Users\trangtt1\HH.new\hh-new-mtis\docker-compose.yml`
- Environment: `C:\Users\trangtt1\HH.new\hh-new-mtis\.env`

## Start the Service
```powershell
cd C:\Users\trangtt1\HH.new\hh-new-mtis
docker-compose up --build -d
```

## Stop the Service
```powershell
cd C:\Users\trangtt1\HH.new\hh-new-mtis
docker-compose down
```

## Verify Health
```powershell
curl.exe http://localhost:3000/api/health
# Expected: {"status":"ok","time":"2026-06-12T..."}
```

## API Endpoints
| Endpoint | Description | Auth |
|----------|------------|------|
| `GET /api/health` | Health check | Public |
| `POST /api/auth/login` | User login | Public |
| `POST /api/auth/register` | User registration | Public |
| `GET /api/users` | List users | Admin |
| `POST /api/users` | Create user | Admin |
| `GET /api/organizations` | List orgs | Admin |
| `POST /api/organizations` | Create org | Admin |
| `GET /api/permissions` | List permissions | Admin |
| `GET /api/groups` | List groups | Admin |

## Key Details
- **Stack**: Express.js + SQLite (better-sqlite3)
- **Port**: 3000 (mapped to host)
- **Database**: SQLite at `./src/apps/api/data/database.sqlite` (volume-mapped)
- **Node version**: 22 (Alpine)
- **JWT Secret & TOTP Key**: configured via `.env`

## Reset Database (if needed)
```powershell
cd C:\Users\trangtt1\HH.new\hh-new-mtis
node reset-db.js
node reset-admin-pw.js
```

## E2E Tests
```powershell
npx playwright test
```

---
feature-id: HH-INTEL-001
document: tech-brief
generated: 2026-06-05
confidence: Medium
---

# MTIS — Tech Brief

## Workspace Configuration

| Field | Value |
|---|---|
| Repo type | mono |
| Name | HH.New |
| Package manager | pnpm |
| ID prefix | HH |

## Services

| Name | Type | Stack | Path | Port | Modules served |
|---|---|---|---|---|---|
| mtis-api | service | TBD (NestJS/FastAPI) | src/services/mtis-api | 3000 | M01-M09 |
| mtis-gis | service | TBD (Geoserver/MapServer) | src/services/mtis-gis | 8080 | M07, M10 |
| mtis-web | app | TBD (React SPA) | src/apps/mtis-web | 3001 | All modules |

## Shared Infrastructure

| Component | Technology | Rationale |
|---|---|---|
| Database | SQL Server 2022 Standard (per TKCT spec) | Hỗ trợ spatial data GIS |
| Spatial/GIS DB | PostGIS hoặc SQL Server Spatial | Dữ liệu không gian KCHT |
| ENC Chart Server | Có thể dùng third-party (S-57/S-100) | 108 mảnh hải đồ |
| Cache | Redis | Session management, caching |
| Object Storage | MinIO | Lưu trữ tài liệu đính kèm |

## Auth

| Item | Value |
|---|---|
| Model | Role-based (14 roles) |
| Multi-tenant | Single tenant (Cục Hàng hải VN) |

## Scaffold Order

1. mtis-api (core backend — database-dependent)
2. mtis-web (frontend — API-dependent)
3. mtis-gis (GIS service — infrastructure)
4. ENC chart integration (specialized pipeline)
5. Data digitization (M11 — runs in parallel)

# Project: HH.New — Hệ thống thông tin quản lý Kết cấu Hạ tầng Giao thông Hàng hải (MTIS)

## Overview
Hệ thống quản lý tập trung thông số kỹ thuật, tài sản, vận hành bảo trì, quy hoạch kết cấu hạ tầng giao thông hàng hải trên nền GIS và hải đồ điện tử. Chủ đầu tư: Bộ Xây Dựng - Cục Hàng hải Việt Nam.

## Repo Config
| Field | Value |
|---|---|
| repo-type | mono |
| feature-prefix | HH |
| output-mode | lean |
| default-path | S |
| package-manager | pnpm |
| input-watch-dir | docs/input |

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React SPA (Vite) — TBC |
| Backend | NestJS — TBC |
| Database | SQL Server 2022 Standard |
| Auth | Custom JWT (Role-based, 14 roles) |
| Cache | Redis (session, caching) |
| GIS | GeoServer + OpenLayers (S-57/S-100) |
| Deployment | Docker, Windows/Linux Server |
| CI/CD | Skip |

## Docs-Path Formula
| Scenario | docs_path |
|---|---|
| mono — cross-cutting | `docs/features/{feature-id}` |
| mono — app: {app-name} | `src/apps/{app-name}/docs/features/{feature-id}` |
| mono — service: {svc-name} | `src/services/{svc-name}/docs/features/{feature-id}` |

## Active Apps / Services (monorepo only)
| Name | Stack | Type | Path |
|---|---|---|---|
| mtis-api | TBD | service | src/services/mtis-api |
| mtis-web | TBD | app | src/apps/mtis-web |
| mtis-gis | TBD | service | src/services/mtis-gis |

## Key Decisions
- Database: SQL Server 2022 Standard (theo TKCT)
- Auth: Custom JWT, role-based (14 roles), single tenant
- GIS tích hợp với ENC hải đồ điện tử (108 mảnh, S-57/S-100)
- CSDL thuộc tính riêng, CSDL không gian riêng (dual-DB architecture)
- Liên thông LGSP/NDXP với Bộ GTVT và các đơn vị ngoài

## Modules (from /from-doc analysis)
| Module | Features | Risk | Status |
|---|---|---|---|
| M01 — User Management | 10 | P0 | proposed |
| M02 — System Administration | 8 | P0 | proposed |
| M03 — Technical Parameters Management | 26 | P0 | proposed |
| M04 — Operations & Maintenance | 8 | P0 | proposed |
| M05 — Planning Management | 3 | P0 | proposed |
| M06 — Asset Management | 14 | P0 | proposed |
| M07 — GIS/Map Infrastructure Mgmt | 8 | P0 | proposed |
| M08 — Reporting & Statistics | 8 | P0 | proposed |
| M09 — Data Interconnection & Sharing | 6 | P0 | proposed |
| M10 — Nautical Chart Editing | 10 | P0 | proposed |
| M11 — Infrastructure DB Creation | 4 | P0 | proposed |

## PM Integration Notes
- Read this file at every pipeline intake (Stage 1)
- Resolve docs_path from Docs-Path Formula table above
- For mono: ask user which app/service if not clear from request
- Write resolved docs_path into _state.md frontmatter before any delegation
- When invoked with no arguments: scan `input-watch-dir` for unprocessed files → auto-trigger consulting-intelligence-extractor pipeline

## Last scaffold
```yaml
date: 2026-06-05
preset: standard
stack: mono
features: ['HH-NEW']
package-manager: pnpm
```

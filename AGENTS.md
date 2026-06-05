# Project: HH.New

## Overview
Xây dựng Hệ thống thông tin quản lý Kết cấu Hạ tầng Giao thông Hàng hải (MTIS) cho Cục Hàng hải Việt Nam — Bộ Xây Dựng.

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
| Frontend | TBD (React SPA đề xuất) |
| Backend | TBD (NestJS đề xuất) |
| Database | SQL Server 2022 Standard |
| GIS | PostGIS / SQL Server Spatial |
| Auth | Role-based (14 roles) |
| Cache | Redis |
| Deployment | TBD |
| CI/CD | Skip |

## Docs-Path Formula
| Scenario | docs_path |
|---|---|
| mono — cross-cutting | `docs/features/{feature-id}` |
| mono — service: mtis-api | `src/services/mtis-api/docs/features/{feature-id}` |
| mono — service: mtis-gis | `src/services/mtis-gis/docs/features/{feature-id}` |
| mono — app: mtis-web | `src/apps/mtis-web/docs/features/{feature-id}` |

## Active Apps / Services (monorepo only)
| Name | Stack | Type | Path |
|---|---|---|---|
| mtis-api | TBD | service | src/services/mtis-api |
| mtis-gis | Geoserver | service | src/services/mtis-gis |
| mtis-web | TBD | app | src/apps/mtis-web |

## Key Decisions
- Database: SQL Server 2022 Standard (theo TKCT)
- GIS: Spatial database + ENC S-57/S-100 integration
- Liên thông LGSP + NDXP + CSDL Bộ GTVT
- 3-level approval workflow (Chuyên viên → Lãnh đạo Cảng vụ → Lãnh đạo Cục)
- Phân quyền role-based với 14 roles
- An toàn thông tin cấp độ 3

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
features: []
package-manager: pnpm
```

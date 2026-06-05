# ADR-001: Tech Stack Selection
**Date:** 2026-06-05 | **Status:** Accepted

## Context
Hệ thống thông tin quản lý Kết cấu Hạ tầng Giao thông Hàng hải (MTIS) cho Cục Hàng hải Việt Nam. Phân tích từ tài liệu TKCT.

## Decision
| Layer | Choice | Alternatives |
|---|---|---|
| Frontend | React SPA (Vite) đề xuất | TBD |
| Backend | NestJS đề xuất | TBD |
| Database | SQL Server 2022 Standard | theo TKCT |
| GIS | SQL Server Spatial / PostGIS | — |
| Auth | Role-based (14 roles) | — |
| Cache | Redis | — |
| ENC | S-57/S-100 integration | — |

## Rationale
TKCT chỉ định SQL Server 2022 Standard (có spatial support) và yêu cầu tích hợp hải đồ điện tử S-57/S-100. Kiến trúc monorepo phù hợp với nhiều service (API + GIS + Web).

## Consequences
- Cần xác nhận framework frontend/backend với PO
- Cần xác nhận cơ chế tích hợp ENC client (third-party vs tự phát triển)
- Bảo mật cấp độ 3 theo NĐ 85/2016

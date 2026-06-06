# Execution Plan — Resume Module (SDLC Pipeline)

## 1. Strategy Overview

**3-Layer Architecture:**
```
UI/UX (Frontend)  →  API/Backend (Business Logic)  →  DB (Unchanged)
<── Free redesign             └── View layer che NHOM ─── <── Locked
```

**Zero DB Change** — per ADR-001. All NHOM abstraction, FK traversal, and business rules in backend layer.

## 2. Module Execution Order

| Priority | Module | Dependencies | Risk | Est. Waves | Strategy |
|----------|--------|-------------|------|-----------|----------|
| **1** | **M01 User Management** | None | Low | 2-3 | Build first, verify local build works |
| 2 | M02 System Admin | M01 | Low | 2-3 | After M01 stable |
| 3 | M03 Technical Parameters | M02 | **High** (688 req) | 8-12 | Largest module — split into sub-waves |
| 4 | M04 Operations & Maintenance | M03 | Medium | 3-5 | |
| 5 | M05 Planning | M03 | Low | 2-3 | |
| 6 | M06 Asset Management | M03 | **High** (482 req) | 6-8 | |
| 7 | M07 GIS Map | M03, M10 | Medium | 4-6 | Leaflet already prototyped |
| 8 | M08 Reporting | All above | Medium | 3-5 | |
| 9 | M09 Data Interconnection | All above | **High** (LGSP/NDXP) | 4-6 | External integration |
| 10 | M10 Nautical Chart | M03 | **High** (S-57/S-100) | 6-8 | ENC specialist needed |
| 11 | M11 Database Creation | None | Low | 2-3 | Data migration |

## 3. Pipeline Stages (per module)

Each module runs through:
1. **BA** (Business Analyst) — Lean spec: acceptance criteria + rules
2. **SA** (System Architect) — Routes, entities, permissions
3. **UI/UX Designer** — Screen composition (prototype exists)
4. **Security Audit** — Per module
5. **Tech Lead** — Wave plan + task breakdown
6. **Backend/Frontend Dev** — Code implementation
7. **QA** — Test + evidence
8. **Reviewer** — Code gate

## 4. Framework Decision

**Pending:** Framework choice (NestJS/Express + React/Vue) is not yet blocking for M01 — start with backend logic, UI can use HTML prototype. Decision to be made before M03 (large module).

## 5. Key Milestones

| Milestone | Criteria | Target |
|-----------|----------|--------|
| M01 runnable locally | Login, CRUD users, list groups | Phase 2 complete |
| M01+M02 stable | Auth flow, system config | After M02 |
| M03 core CRUD | Port/Berth/Channel management | After M03 wave 1-4 |
| Dashboard live | Cross-module stats | After M08 |
| Full system | All 11 modules integrated | All phases |

## 6. Revision History

| Date | Change | Author |
|------|--------|--------|
| 2026-06-06 | Initial plan | ETC AI |

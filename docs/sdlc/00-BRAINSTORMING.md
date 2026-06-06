# Brainstorming Notes — MTIS SDLC

## 1. Database Architecture (from DD)

### Source
Document: `MOT_VMD_MTIS_DD_ 3.0_PHCV_Final.pdf` (128MB, pages 34-250 extracted)

### Tables Overview (43 tables)
- **21 business tables**: KCHT_CB, KCHT_ATHH, KCHT_CC, KCHT_MVT, KCHT_VBPL, KCHT_GIS_DOI_TUONG, TS_QL, TS_QL_*, VH_KT_BT_SC, QH_BEN_CANG, QLHS, COM_REPORT, COM_SEQ, COM_SYNC, DM_APP_PARAM
- **3 dictionary tables**: DM_DON_VI_HANH_CHINH, DM_DON_VI_VH_KT, DM_QUOC_TICH
- **13 auth tables**: AUTH_USER, AUTH_GROUP, AUTH_GROUP_PERMISSION, AUTH_MENU, AUTH_ORG...
- **3 metadata tables**: COM_DATA_EXT (JSON), COM_DATA_GEO (geometry), COM_DATA_LOG (history)
- **3 exchange tables**: COM_DATA_TEMP, MSG_INBOX, MSG_OUTBOX (LGSP/NDXP sync)

### Key Pattern: Single-Table Inheritance (STI)
All infrastructure types stored in `KCHT_CB` with `NHOM` discriminator:
- `CB` → Cảng biển
- `BC` → Bến cảng
- `CC` → Cầu cảng
- `BP` → Bến phao
- `TTB` → Trang thiết bị
- `CT` → Cầu tàu
- `ND` → Khu neo đậu
- `CSSCDT` → Công trình sửa chữa tàu
- `LHH` → Luồng hàng hải

### Foreign Key Map
```
FK_CANG_BIEN  →  appears in KCHT_ATHH, KCHT_CB, QH_BEN_CANG  (3 tables)
FK_BEN_CANG   →  appears in KCHT_CB (self-ref, 1 table)
FK_CAU_CANG   →  appears in KCHT_CB (self-ref, 1 table)
FK_LUONG_HH   →  appears in KCHT_ATHH, KCHT_CB  (2 tables)
FK_DON_VI_QL  →  appears in 9 tables (universal)
```

### Missing
- No explicit CASCADE rules in spec
- No migration scripts
- FK fields are logical (varchar naming), may not have physical constraints

## 2. Strategic Decisions

### Decision 1: Zero DB Change
**Date:** 2026-06-06
**Problem:** Cannot modify the database (third-party owned).
**Solution:** Use SQL VIEWs + COM_DATA_EXT (JSON) + Application Layer abstraction.
**See:** [ADR-001](../adr/ADR-001-zero-db-change.md)

### Decision 2: ENC Viewer — Leaflet
**Status:** Pending (not yet finalized)
**Options:** Leaflet (free, simple) vs MapLibre GL (WebGL, more powerful) vs custom SVG
**Proposed:** Leaflet 1.9.4 with CartoDB no-labels + NOAA ENC as placeholder

### Decision 3: Framework Selection
**Status:** Pending
**Options:** NestJS + React (matching reference system) vs Express + Vue
**Blocking for:** M03 (large module, needs framework)

## 3. Risk Register

| ID | Risk | Stage | Likelihood | Impact | Mitigation |
|----|------|-------|-----------|--------|-----------|
| R01 | DB schema differs from DD | Development | Medium | High | Verify DB on first access, create mapping delta |
| R02 | No cascade rules → orphan data | Go-live | Medium | High | Soft delete (STATUS=0), application-level integrity |
| R03 | STI pattern causes complex queries | Dev/Maintain | High | Medium | SQL VIEWs to abstract NHOM |
| R04 | Spatial query perf (COM_DATA_GEO) | Go-live | Medium | Medium | Spatial index on geometry column |
| R05 | LGSP sync failures undetected | Ops | Medium | High | Sync monitor + alert when fail > 3x |
| R06 | Missing UI field not in DB | Dev | Medium | Low | COM_DATA_EXT (JSON) as extension |
| R07 | New entity type needed (new NHOM) | Maintain | Low | Medium | COM_DATA_EXT + app-level handling |
| R08 | Cannot migrate to PostGIS later | Maintain | Low | Medium | Use WKT/WKB standard, avoid SQL Server spatial functions |

## 4. Open Questions
- [ ] DB thật có khớp với DD không? → Cần verify khi có quyền truy cập
- [ ] Framework: NestJS + React hay Express + Vue? → Quyết định trước M03
- [ ] ENC tile server: có VMS-N/VMS-S nội bộ không? → Hay dùng NOAA tạm?
- [ ] LGSP/NDXP endpoint thật có sẵn để test không?
- [ ] AUTH_USER_PASS có hash method nào quy định không?

## 5. Revision History

| Date | Note | Author |
|------|------|--------|
| 2026-06-06 | Initial analysis from DD document | ETC AI |
| 2026-06-06 | Risk register, strategic decisions | ETC AI |

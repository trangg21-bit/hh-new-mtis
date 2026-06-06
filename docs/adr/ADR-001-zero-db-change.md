# ADR-001: Zero Database Change Strategy

## Status
Accepted (2026-06-06)

## Context
The project uses a database designed by a third party (DD document — `MOT_VMD_MTIS_DD_ 3.0_PHCV_Final.pdf`). The project team does not own or control this database schema. The DB uses a Single-Table Inheritance (STI) pattern via the `NHOM` discriminator column:

- `KCHT_CB` stores 11 entity types (CB, BC, CC, BP, TTB, CT, ND, CSSCDT, LHH, ...) in one table
- `KCHT_ATHH` stores 11 maritime safety entity types (DBNT, NT, VTS, RADAR, AIS, CCTV, ...) in one table
- `KCHT_MVT` stores 6 telecom entity types

Foreign keys are logicolumnar (FK_ prefixed columns) but lack explicit physical CONSTRAINT definitions with CASCADE rules in the DD specification.

Total: ~43 tables across business, dictionary, auth, metadata, and exchange schemas.

## Decision
**We will NOT modify the database schema.** Instead:

1. **View Layer** — Create SQL Server VIEWs that abstract the `NHOM` discriminator, exposing clean entity-specific virtual tables (e.g., `V_CANG_BIEN`, `V_BEN_CANG`, `V_CAU_CANG`)
2. **JSON Extension** — Use existing `COM_DATA_EXT` table (JSON column) for any additional fields not present in the base schema — no new columns needed
3. **Spatial Query** — Use `COM_DATA_GEO` with SQL Server spatial indexes for GIS proximity queries (assign buoys to ports by bounding box)
4. **Soft Delete** — All deletions go through STATUS = 0, never physical DELETE — avoids cascade issues
5. **Index Only** — The only DB changes allowed are adding INDEX (filtered, spatial, composite) which are reversible and non-breaking

## Consequences

### Positive
- Zero dependency on DB owner for schema changes
- Safe to deploy against an unknown/locked database
- All data model abstraction happens in application layer (controllable)

### Negative
- STI pattern in KCHT_CB means queries need NHOM filtering at the view level
- JSON extension (COM_DATA_EXT) is less performant than dedicated columns — acceptable for < 2000 records
- Spatial proximity queries are approximate (not FK-guaranteed) for buoy-to-port assignment

## Related
- [Execution Plan](../sdlc/00-EXECUTION-PLAN.md)
- [Brainstorming Notes](../sdlc/00-BRAINSTORMING.md)
- [UI Guidelines](../ui/UI-GUIDELINES.md)

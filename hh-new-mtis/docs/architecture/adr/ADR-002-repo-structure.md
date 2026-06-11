# ADR-002: Repository Structure
**Date:** 2026-06-05 | **Status:** Accepted

## Decision
**Monorepo (pnpm workspaces + Turborepo)**

Docs-path formula:
| Scenario | docs_path |
|---|---|
| mono — cross-cutting | `docs/features/{feature-id}` |
| mono — app: {app-name} | `src/apps/{app-name}/docs/features/{feature-id}` |
| mono — service: {svc-name} | `src/services/{svc-name}/docs/features/{feature-id}` |

## Rationale
pnpm workspaces với Turborepo cho phép quản lý nhiều app/service trong cùng một repo, chia sẻ code qua `src/shared/`.

## Consequences
- Feature pipeline artifacts theo docs_path tương ứng.
- Thêm service/app mới qua /new-project.

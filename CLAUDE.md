# HH.New

Dự án mới — khung monorepo chờ bổ sung tài liệu yêu cầu.

## Stack
Monorepo (pnpm + Turborepo)

## Quick Start
```bash
pnpm install
cp .env.example .env
pnpm dev
```

## Commands
```bash
pnpm dev         # start dev (turbo)
pnpm build       # production build
pnpm test        # unit tests
pnpm lint        # lint format check
pnpm typecheck   # type checking
```

## Architecture
- **Repo type:** monorepo (pnpm + Turborepo)
- **Docs path:** `docs/features/{feature-id}` (cross-cutting)
- **Feature prefix:** HH
- **ADRs:** `docs/architecture/adr/`

## Pipeline
Đẩy tài liệu vào `docs/input/` và dùng `/from-doc` để phân tích yêu cầu.

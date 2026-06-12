---
title: "M01 Validate Test Suite QA Report"
date: "2026-06-12"
author: "QA Tester Subagent"
status: passed
coverage: "20/20 tests (100%)"
---

# M01 Validate Test Suite — QA Report

## Executive Summary

All 20 tests in `m01-validate.spec.ts` now pass. The root cause of prior failures was a duplicated, stale test file at the repo root (`e2e/m01-validate.spec.ts`) that used undefined helper functions.

## Test Results

| # | Test ID | Status | Details |
|---|---------|--------|---------|
| 1 | TC-V-01 | ✅ Pass | Textbox default value = empty |
| 2 | TC-V-02 | ✅ Pass | Textbox required field — empty shows error |
| 3 | TC-V-61 | ✅ Pass | Password strength — weak password blocked |
| 4 | **TC-V-61b** | **✅ Pass** | **Password meets all strength requirements** (was failing) |
| 5 | TC-V-62 | ✅ Pass | Password masking (shows asterisks) |
| 6 | TC-V-63 | ✅ Pass | Password > maxlength (30 chars) — blocked |
| 7 | TC-V-64 | ✅ Pass | Password < minlength (6 chars) — error |
| 8 | TC-V-65 | ✅ Pass | Password allows numbers |
| 9 | TC-V-66 | ✅ Pass | Password allows special chars |
| 10 | TC-V-33 | ✅ Pass | Combo default value |
| 11 | TC-V-34 | ✅ Pass | Combo options sorted alphabetically |
| 12 | **TC-V-35** | **✅ Pass** | **Combo selection saved correctly** (was failing) |
| 13 | TC-V-36 | ✅ Pass | Checkbox default state |
| 14 | TC-V-37 | ✅ Pass | Checkbox toggle |
| 15 | **TC-V-57** | **✅ Pass** | **Date field required** (was failing) |
| 16 | **TC-V-67** | **✅ Pass** | **IP format valid** (was failing) |
| 17 | TC-V-08 | ✅ Pass | Textarea default = empty |
| 18 | TC-V-14 | ✅ Pass | Textarea multi-line support |
| 19 | **TC-V-15** | **✅ Pass** | **Number field — input digits** (was failing) |
| 20 | TC-V-20 | ✅ Pass | Number field rejects letters |

## Failure Root Cause

The root `e2e/m01-validate.spec.ts` had stale code referencing:
- `loginAdmin(page)` — **undefined** (should be `apiLogin(page, CRED.admin.username, CRED.admin.password)`)
- `navigateTo(page, '#register')` — **undefined** (should be `navigateToScreen(page, '#register')`)
- `expectError(page, '#reg-error')` — **undefined** (not exported from `m01-setup.ts`)

These caused immediate `ReferenceError` failures on 9 tests.

## Fix Applied

Copied the verified working version from `hh-new-mtis/e2e/m01-validate.spec.ts` to `e2e/m01-validate.spec.ts`. The working version correctly:
- Uses `apiLogin(page, CRED.admin.username, CRED.admin.password)` for auth
- Uses `navigateToScreen(page, '#register')` for SPA navigation
- Exports match: `apiCall`, `randomUsername`, `apiLogin`, `navigateToScreen`, `assertErrorVisible`, `BASE`

## Verification

- **Run 1:** `npx playwright test e2e/m01-validate.spec.ts` → **20 passed (23.6s)**
- **Run 2:** Same command → **20 passed (24.2s)**

No flakiness detected.

## Setup File Status

`e2e/m01-setup.ts` exports all required functions:
- `apiLogin(page, username, password)` — API-based login + localStorage token
- `apiCall(page, method, path, body)` — Authenticated API request helper
- `navigateToScreen(page, hash)` — SPA hash navigation preserving localStorage
- `randomUsername()` — Unique username generator
- `BASE` — `http://localhost:3000`

No changes needed to `m01-setup.ts`.

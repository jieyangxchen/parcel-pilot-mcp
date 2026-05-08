# Parcel Pilot MCP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-first MCP server that uses persistent Taobao, JD, and Cainiao browser sessions to return personal package progress.

**Architecture:** The MCP server delegates login and sync work to provider adapters backed by Playwright persistent browser contexts. Normalized package data is stored in local JSON and served through package-focused MCP tool handlers.

**Tech Stack:** TypeScript, Node.js 20, MCP SDK, Playwright Chromium, Vitest, JSON file storage, systemd/Docker deployment docs.

---

## File Structure

- `src/domain/types.ts`: normalized package and provider types.
- `src/config.ts`: environment-driven runtime paths and settings.
- `src/storage/json-package-store.ts`: JSON file persistence for package records.
- `src/services/package-service.ts`: package filtering, tracking, and date logic.
- `src/browser/browser-session-manager.ts`: persistent Playwright browser profile management.
- `src/providers/provider.ts`: provider interface and shared provider result types.
- `src/providers/html-parsing.ts`: small DOM-independent parsing helpers for package cards.
- `src/providers/taobao-provider.ts`: Taobao login, sync, and parsing adapter.
- `src/providers/jd-provider.ts`: JD login, sync, and parsing adapter.
- `src/providers/cainiao-provider.ts`: Cainiao login, sync, and parsing adapter.
- `src/mcp/tool-handlers.ts`: testable tool handler functions.
- `src/server.ts`: MCP server registration over stdio.
- `src/**/*.test.ts`: Vitest coverage for service, storage, parsing, and tool handlers.
- `README.md`: local/server deployment and operation guide.
- `scripts/aliyun-deploy.sh`: repeatable SSH deployment helper.

## Tasks

### Task 1: Define package service behavior

- [ ] Write failing tests for `PackageService` in `src/services/package-service.test.ts`.
- [ ] Run `npm test -- src/services/package-service.test.ts` and verify missing implementation failure.
- [ ] Implement `src/domain/types.ts` and `src/services/package-service.ts`.
- [ ] Run the service tests and verify they pass.

### Task 2: Add JSON persistence

- [ ] Write failing tests for `JsonPackageStore` in `src/storage/json-package-store.test.ts`.
- [ ] Implement local JSON read, write, and upsert behavior.
- [ ] Run the storage tests and verify they pass.

### Task 3: Add provider parsing

- [ ] Write failing tests for Taobao and JD static HTML package card parsing.
- [ ] Implement parser helpers and provider parser methods.
- [ ] Run parser tests and verify they pass.

### Task 4: Add browser-session login and sync adapters

- [ ] Write tests for login response shape using mocked browser sessions.
- [ ] Implement persistent profile paths, screenshot artifact paths, and provider sync flows.
- [ ] Run provider tests and verify they pass.

### Task 5: Add MCP handlers and server

- [ ] Write failing tests for `login_taobao`, `login_jd`, `login_cainiao`, `sync_packages`, `get_my_packages`, `track_package`, and `get_delivered_today` handlers.
- [ ] Implement handler factory and stdio MCP server registration.
- [ ] Run MCP handler tests and TypeScript build.

### Task 6: Add docs and deployment helper

- [ ] Write README with QR login, Aliyun deployment, security, and troubleshooting sections.
- [ ] Add `.env.example` and `scripts/aliyun-deploy.sh`.
- [ ] Run `npm test`, `npm run build`, and inspect git status for sensitive files.

# Personal Package Assistant MCP Design

## Goal

Build a public, local-first MCP server for personal use on a Linux server. The user scans Taobao, JD, and Cainiao login QR codes once, the server keeps isolated browser sessions locally, and later AI clients can ask MCP tools for package progress.

## Architecture

The project uses browser-session automation instead of official developer APIs because the intended user has no Taobao/JD developer credentials. A persistent Playwright Chromium profile is stored per provider on the user's own server. The MCP layer exposes package-oriented tools, while provider adapters handle login, sync, and tracking page parsing.

No account password, cookie, browser profile, QR screenshot, or package cache is committed to git. If a provider triggers captcha, two-factor login, or risk control, the tool returns a manual-action-required response and never bypasses the challenge.

## Components

- `BrowserSessionManager`: creates persistent Chromium contexts under a configured local profile directory.
- `TaobaoProvider`: opens Taobao login and package pages, captures QR screenshots, and parses visible package cards.
- `JdProvider`: opens JD login and order/package pages, captures QR screenshots, and parses visible package cards.
- `CainiaoProvider`: opens Cainiao login/package pages, captures QR screenshots, and parses visible package cards.
- `JsonPackageStore`: stores normalized package records in local JSON.
- `PackageService`: filters waiting packages, tracks a package by ID or tracking number, and returns packages delivered today.
- `MCP server`: exposes `login_taobao`, `login_jd`, `login_cainiao`, `sync_packages`, `get_my_packages`, `track_package`, and `get_delivered_today`.

## Data Flow

1. User calls `login_taobao` or `login_jd`.
2. Provider opens a persistent browser session and saves a screenshot under `var/login`.
3. User scans the QR code from the screenshot or uses noVNC/SSH forwarding to complete login.
4. User calls `sync_packages`.
5. Providers scrape package cards from logged-in pages and upsert normalized package records.
6. AI calls read-only package tools and receives structured MCP JSON.

## Server Deployment

The first deployment target is a personal Aliyun Linux server. Recommended access is SSH plus either private MCP stdio usage, SSH tunnel, VPN, or a protected process manager. The MCP service should not expose unauthenticated browser-session control to the public internet.

## Testing

Unit tests cover package filtering, tracking, delivered-today date handling, JSON store upserts, tool handler behavior, and provider parsing against static HTML fixtures. Live Taobao/JD/Cainiao login and sync are documented as manual verification because they require user QR login and may vary by account risk controls.

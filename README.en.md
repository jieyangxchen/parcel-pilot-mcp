<h1 align="center">Parcel Pilot MCP</h1>

<p align="center">
  <strong>Your private package-tracking copilot for Taobao, JD, and Cainiao.</strong>
</p>

<p align="center">
  <a href="README.md">中文</a>
  ·
  <a href="#quick-start">Quick start</a>
  ·
  <a href="#mcp-tools">MCP tools</a>
  ·
  <a href="#security-model">Security</a>
</p>

<p align="center">
  <img alt="Node.js 20+" src="https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white" />
  <img alt="MCP stdio" src="https://img.shields.io/badge/MCP-stdio-blue" />
  <img alt="Playwright browser sessions" src="https://img.shields.io/badge/Playwright-browser%20sessions-2EAD33?logo=playwright&logoColor=white" />
  <img alt="License MIT" src="https://img.shields.io/badge/license-MIT-black" />
</p>

Parcel Pilot MCP lets you scan a shopping-site login QR code once, keeps the
browser session in a private local profile, and gives your AI client structured
package data through MCP.

Ask your assistant:

```text
Show me all packages that are still on the way.
Did anything arrive today?
Track my Taobao order from last week.
```

It is designed for personal use on your own Mac or private Linux server. It is
not an official Taobao, JD, or Cainiao API integration.

## Highlights

| Feature | What you get |
| --- | --- |
| Local-first login | QR login happens in your own Playwright Chromium profile. |
| AI-ready tools | Exposes `get_my_packages`, `track_package`, and `get_delivered_today` over MCP stdio. |
| Multi-provider shape | Taobao, JD, and Cainiao share one normalized package model. |
| Deployable anywhere | Runs locally on macOS or inside Docker on a private Linux server. |
| Honest boundaries | Captcha, SMS, slider, and risk-control checks stay manual. No bypass logic. |

## Example Output

```json
{
  "packages": [
    {
      "id": "taobao-1234567890",
      "source": "taobao",
      "title": "USB-C cable",
      "status": "in_transit",
      "carrier": "Cainiao",
      "trackingNumber": "YT123456789CN",
      "lastEvent": "Transporting, estimated delivery today",
      "updatedAt": "2026-05-08T09:00:00.000+08:00"
    }
  ]
}
```

## Provider Status

| Provider | Status | Notes |
| --- | --- | --- |
| Taobao | Browser-session parser available | Parses the bought-list order page and extracts order-level logistics summaries such as "transporting, estimated delivery today". |
| JD | Browser-session adapter scaffolded | Login/session flow is present; selectors should be verified against your own account before relying on it. |
| Cainiao | Browser-session adapter scaffolded | Login/session flow is present; selectors should be verified against your own account before relying on it. |

Shopping sites change frequently, so provider parsers are expected to need
maintenance.

## Quick Start

```bash
npm install
npm run build
```

Playwright installs Chromium during `npm install`. On Linux, install Chromium
system dependencies if Playwright asks for them:

```bash
npx playwright install-deps chromium
```

Copy `.env.example` to `.env`:

```bash
PACKAGE_ASSISTANT_DATA_DIR=./data
PACKAGE_ASSISTANT_PROFILE_DIR=./browser-profiles
PACKAGE_ASSISTANT_ARTIFACT_DIR=./var
PACKAGE_ASSISTANT_HEADLESS=true
PACKAGE_ASSISTANT_TIMEZONE=Asia/Shanghai
```

For first login on macOS, use a visible Chromium window:

```bash
PACKAGE_ASSISTANT_HEADLESS=false node dist/cli/open-login-browser.js taobao
```

After scanning the QR code and completing any manual verification:

```bash
node dist/cli/call-tool.js sync_packages '{"source":"taobao"}'
node dist/cli/call-tool.js get_my_packages
node dist/cli/call-tool.js track_package '{"packageId":"taobao-ORDER_ID"}'
```

## MCP Client Config

Use stdio from any MCP-compatible client:

```json
{
  "mcpServers": {
    "parcel-pilot": {
      "command": "node",
      "args": ["/absolute/path/parcel-pilot-mcp/dist/server.js"],
      "env": {
        "PACKAGE_ASSISTANT_DATA_DIR": "/absolute/path/parcel-pilot-mcp/data",
        "PACKAGE_ASSISTANT_PROFILE_DIR": "/absolute/path/parcel-pilot-mcp/browser-profiles",
        "PACKAGE_ASSISTANT_ARTIFACT_DIR": "/absolute/path/parcel-pilot-mcp/var",
        "PACKAGE_ASSISTANT_HEADLESS": "true",
        "PACKAGE_ASSISTANT_TIMEZONE": "Asia/Shanghai"
      }
    }
  }
}
```

## First Login Flow

1. Ask your AI client to call `login_taobao`, `login_jd`, or `login_cainiao`.
2. Open the returned `screenshotPath`, usually under `var/login/`.
3. Scan the QR code with your phone.
4. Complete any captcha, SMS, slider, or risk-control prompt manually.
5. Call `sync_packages`.
6. Ask `get_my_packages`, `track_package`, or `get_delivered_today`.

If a QR screenshot expires too quickly or the site needs interaction, run with
a visible browser through noVNC, SSH X forwarding, or a desktop session:

```bash
PACKAGE_ASSISTANT_HEADLESS=false npm run dev
```

## MCP Tools

| Tool | Purpose |
| --- | --- |
| `login_taobao` | Opens or refreshes the Taobao login flow and returns login artifacts. |
| `login_jd` | Opens or refreshes the JD login flow and returns login artifacts. |
| `login_cainiao` | Opens or refreshes the Cainiao login flow and returns login artifacts. |
| `sync_packages` | Syncs package data from one provider or all configured providers. |
| `get_my_packages` | Lists normalized package records, with filters for pending or delivered packages. |
| `track_package` | Returns details for a known package id. |
| `get_delivered_today` | Lists packages delivered today in the configured timezone. |

## Private Linux Server

Recommended server shape:

- Docker and Docker Compose.
- SSH-only access.
- MCP launched through stdio by an AI client on the same host, or through SSH/VPN.
- No public unauthenticated HTTP endpoint.

Deploy from your workstation:

```bash
./scripts/aliyun-deploy.sh user@your-server:/opt/parcel-pilot-mcp
```

Run one-off login and sync commands on the server:

```bash
cd /opt/parcel-pilot-mcp
docker compose run --rm -T package-assistant node dist/cli/call-tool.js login_taobao
docker compose run --rm -T package-assistant node dist/cli/call-tool.js login_jd
docker compose run --rm -T package-assistant node dist/cli/call-tool.js login_cainiao
docker compose run --rm -T package-assistant node dist/cli/call-tool.js sync_packages
```

For an interactive remote browser:

```bash
cd /opt/parcel-pilot-mcp
docker compose run --rm --service-ports package-assistant ./scripts/remote-browser.sh taobao
ssh -N -L 6080:127.0.0.1:6080 user@your-server
```

Then open:

```text
http://127.0.0.1:6080/vnc.html?autoconnect=true&resize=scale
```

Example MCP config through SSH:

```json
{
  "mcpServers": {
    "parcel-pilot": {
      "command": "ssh",
      "args": [
        "user@your-server",
        "cd /opt/parcel-pilot-mcp && docker compose run --rm -T package-assistant"
      ]
    }
  }
}
```

## Security Model

Treat `browser-profiles/` like an already logged-in browser.

- Do not commit `data/`, `var/`, `browser-profiles/`, `.env`, or `tmp-login/`.
- Do not expose the MCP process, noVNC, or temporary login browser to the public internet.
- Use this for your own account on a machine you control.
- Anyone with access to the saved browser profile may be able to view orders,
  logistics, addresses, and account pages.
- This project does not bypass captcha, slider verification, SMS verification,
  or risk-control prompts.
- Keep payment risk low by disabling small-amount passwordless payment,
  automatic deductions, and low-friction checkout features in related shopping
  and payment accounts.

## Development

```bash
npm test
npm run build
```

Useful local commands:

```bash
npm run call-tool -- get_my_packages
npm run call-tool -- sync_packages '{"source":"taobao"}'
```

## Roadmap

- Harden JD and Cainiao selectors with more real-world account layouts.
- Add opt-in redaction for product names and addresses in tool output.
- Add provider health diagnostics for expired sessions and blocked pages.
- Add sample MCP client recipes for Claude Desktop, Codex, and other clients.

## License

MIT

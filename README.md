# Personal Package Assistant MCP

Local-first MCP server for personal package tracking on Taobao, JD, and Cainiao.

This project is designed for a personal Linux server: scan the Taobao/JD QR login once, keep the browser sessions on your own machine, then ask an AI client to call MCP tools such as `get_my_packages` and `track_package`.

## What It Does

- Opens Taobao, JD, and Cainiao login pages in persistent Playwright Chromium profiles.
- Returns QR-login screenshot paths for manual login.
- Reuses the saved browser sessions for later syncs.
- Normalizes package records into a local JSON cache.
- Exposes MCP tools over stdio:
  - `login_taobao`
  - `login_jd`
  - `login_cainiao`
  - `sync_packages`
  - `get_my_packages`
  - `track_package`
  - `get_delivered_today`

## Safety Model

This is not an official Taobao/JD API integration. It uses your own local browser sessions.

- Do not commit `data/`, `var/`, `browser-profiles/`, or `.env`.
- Do not expose the MCP process directly to the public internet.
- Use this for your own account on your own server.
- Captcha, slider verification, SMS verification, and risk-control prompts must be completed manually. This project does not bypass them.

## Install

```bash
npm install
npm run build
```

Playwright installs Chromium during `npm install`. On Linux, install browser system dependencies if Playwright asks for them:

```bash
npx playwright install-deps chromium
```

## Configure

Copy `.env.example` to `.env` and adjust paths if needed:

```bash
PACKAGE_ASSISTANT_DATA_DIR=./data
PACKAGE_ASSISTANT_PROFILE_DIR=./browser-profiles
PACKAGE_ASSISTANT_ARTIFACT_DIR=./var
PACKAGE_ASSISTANT_HEADLESS=true
PACKAGE_ASSISTANT_TIMEZONE=Asia/Shanghai
```

## Run Locally

```bash
npm run build
npm start
```

For MCP clients, configure stdio command:

```json
{
  "mcpServers": {
    "personal-package-assistant": {
      "command": "node",
      "args": ["/absolute/path/personal-package-assistant-mcp/dist/server.js"],
      "env": {
        "PACKAGE_ASSISTANT_DATA_DIR": "/absolute/path/personal-package-assistant-mcp/data",
        "PACKAGE_ASSISTANT_PROFILE_DIR": "/absolute/path/personal-package-assistant-mcp/browser-profiles",
        "PACKAGE_ASSISTANT_ARTIFACT_DIR": "/absolute/path/personal-package-assistant-mcp/var",
        "PACKAGE_ASSISTANT_HEADLESS": "true",
        "PACKAGE_ASSISTANT_TIMEZONE": "Asia/Shanghai"
      }
    }
  }
}
```

## First Login

1. Ask your AI client to call `login_taobao`.
2. Open the returned `screenshotPath`, usually `var/login/taobao-login.png`.
3. Scan the QR code with your phone and complete any manual verification.
4. Repeat with `login_jd` and `login_cainiao` if you want those sources.
5. Call `sync_packages`.
6. Ask `get_my_packages`, `track_package`, or `get_delivered_today`.

If QR screenshots are not enough because the site requires interaction, run the server with a visible browser through noVNC, SSH X forwarding, or a desktop session:

```bash
PACKAGE_ASSISTANT_HEADLESS=false npm run dev
```

## Aliyun Personal Server Deployment

Recommended server setup:

- Docker and Docker Compose
- Private SSH access
- MCP used over stdio by an AI client running on the same server, or through SSH/VPN
- No public unauthenticated HTTP endpoint

Deploy from your workstation:

```bash
./scripts/aliyun-deploy.sh user@your-server:/opt/personal-package-assistant-mcp
```

The script uploads source and builds the Docker image on the server. Run one-off tools for login and verification:

```bash
cd /opt/personal-package-assistant-mcp
docker compose run --rm -T package-assistant node dist/cli/call-tool.js login_taobao
docker compose run --rm -T package-assistant node dist/cli/call-tool.js login_jd
docker compose run --rm -T package-assistant node dist/cli/call-tool.js login_cainiao
docker compose run --rm -T package-assistant node dist/cli/call-tool.js sync_packages
```

The screenshots are written under `var/login/` on the server.

For an interactive login page that does not expire before you scan, start the remote browser:

```bash
cd /opt/personal-package-assistant-mcp
docker compose run --rm --service-ports package-assistant ./scripts/remote-browser.sh taobao
```

Then create an SSH tunnel from your workstation:

```bash
ssh -N -L 6080:127.0.0.1:6080 user@your-server
```

Open:

```text
http://127.0.0.1:6080/vnc.html?autoconnect=true&resize=scale
```

For an MCP client that can reach the server through SSH, configure stdio with:

```json
{
  "mcpServers": {
    "personal-package-assistant": {
      "command": "ssh",
      "args": [
        "user@your-server",
        "cd /opt/personal-package-assistant-mcp && docker compose run --rm -T package-assistant"
      ]
    }
  }
}
```

## systemd Example

MCP over stdio is usually launched by the client, so a long-running service is optional. If you wrap it in another local MCP bridge, keep the service private:

```ini
[Unit]
Description=Personal Package Assistant MCP
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/personal-package-assistant-mcp
Environment=PACKAGE_ASSISTANT_DATA_DIR=/opt/personal-package-assistant-mcp/data
Environment=PACKAGE_ASSISTANT_PROFILE_DIR=/opt/personal-package-assistant-mcp/browser-profiles
Environment=PACKAGE_ASSISTANT_ARTIFACT_DIR=/opt/personal-package-assistant-mcp/var
Environment=PACKAGE_ASSISTANT_HEADLESS=true
Environment=PACKAGE_ASSISTANT_TIMEZONE=Asia/Shanghai
ExecStart=/usr/bin/node /opt/personal-package-assistant-mcp/dist/server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

## Current Limits

- Taobao and JD page selectors may need updates when their websites change.
- The first implementation parses stable package-card selectors and visible logistics/order HTML. Real accounts should verify parsing after login.

## Development

```bash
npm test
npm run build
```

#!/usr/bin/env bash
set -euo pipefail

PROVIDER="${1:-taobao}"
export DISPLAY="${DISPLAY:-:99}"

Xvfb "$DISPLAY" -screen 0 1366x900x24 >/tmp/package-assistant-xvfb.log 2>&1 &
XVFB_PID=$!

fluxbox >/tmp/package-assistant-fluxbox.log 2>&1 &
FLUXBOX_PID=$!

x11vnc -display "$DISPLAY" -forever -shared -nopw -listen 0.0.0.0 -rfbport 5900 >/tmp/package-assistant-x11vnc.log 2>&1 &
X11VNC_PID=$!

websockify --web=/usr/share/novnc/ 0.0.0.0:6080 localhost:5900 >/tmp/package-assistant-novnc.log 2>&1 &
NOVNC_PID=$!

cleanup() {
  kill "$NOVNC_PID" "$X11VNC_PID" "$FLUXBOX_PID" "$XVFB_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "noVNC ready on http://127.0.0.1:6080/vnc.html?autoconnect=true&resize=scale"
node dist/cli/open-login-browser.js "$PROVIDER"

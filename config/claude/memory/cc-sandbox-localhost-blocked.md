---
name: cc-sandbox-localhost-blocked
description: CC command sandbox blocks loopback/localhost network too — curl to 127.0.0.1 fails (HTTP 000) until sandbox is disabled.
metadata: 
  node_type: memory
  type: reference
  originSessionId: 0182cc24-0575-4246-8682-f5c539cb5a87
---

The CC command sandbox's network allowlist (github / *.githubusercontent / npm / pypi) blocks **loopback** connections too, not just remote hosts. Empirically: `curl http://127.0.0.1:5173/...` returned `HTTP 000` (connect failure) under the sandbox even though the local server was confirmed up; the identical curl returned `HTTP 200` with `dangerouslyDisableSandbox: true`.

**How to apply:** when verifying a locally-running server/dev-port (vite, node, a launchd service) with curl/wget/nc, run that probe with `dangerouslyDisableSandbox: true` from the start — `HTTP 000` / "connection refused" under sandbox is the restriction biting, not evidence the server is down. Check the server's own log (or `lsof -iTCP:<port> -sTCP:LISTEN`) to confirm liveness independently. Related: [[cc-hook-env-propagation]].

---
name: cc-sandbox-blocks-keychain-auth
description: CC command sandbox blocks macOS keychain/keyring reads — git push (osxkeychain) and gh (keyring) falsely appear unauthenticated until sandbox is disabled. Sole carrier of the sandbox-off-for-auth guidance since the CLAUDE.md ## Sandbox section was removed (ADR-028 migration, 2026-07-10).
metadata:
  node_type: memory
  type: reference
  originSessionId: 549c4bbe-9121-4024-9752-40a82737e1e6
---

The CC command sandbox blocks access to the macOS keychain/keyring, so credential lookups that work fine outside it fail under it. Two empirical hits in one session on the Developer repo (HTTPS `origin`, `credential.helper=osxkeychain`):

- `git push` → `fatal: could not read Username for 'https://github.com': Device not configured` (the `osxkeychain` helper returns nothing, git falls back to a no-TTY prompt → ENXIO). Identical push succeeded with `dangerouslyDisableSandbox: true`.
- `gh auth status` → "The token in default is invalid"; with the sandbox off the SAME token reports `✓ Logged in … (keyring)`, valid, scopes `gist`/`read:org`/`repo`.

**How to apply:** for any auth-touching git/gh command on this repo — `git push`, `git pull`/`fetch` over HTTPS, `gh` calls — run it with `dangerouslyDisableSandbox: true` on the **first** attempt. Do NOT run the in-sandbox attempt first: the keychain block makes it a guaranteed false failure, so the sandbox-first try is pure wasted round-trip (re-confirmed 2026-06-28: in-sandbox `git push` → "could not read Username … Device not configured", identical push succeeded immediately sandbox-off). If a keychain-auth signal ("invalid token" / "could not read Username" / "Device not configured") ever appears from a command you *did* run in-sandbox, read it as the sandbox biting, NOT a real credential problem — don't send the user to `gh auth login` on that signal alone; retry sandbox-off. Read-only git (status/log/diff/commit) stays in-sandbox as normal — this directive is only for the auth-touching network commands.

**TLS half of the story — settled 2026-07-10.** The old global-CLAUDE.md `## Sandbox` section blamed a blanket "proxy breaks TLS to GitHub"; diagnosis showed two separable failures: (1) `api.github.com` was missing from `sandbox.network.allowedDomains` — fixed by adding `*.github.com` (unauthenticated HTTPS to GitHub now works in-sandbox: `git ls-remote`, `curl` verified); (2) `gh` is a Go binary whose macOS TLS verification needs the `trustd` Mach service, blocked in-sandbox (`x509: OSStatus -26276`; no env workaround — `GODEBUG=x509usefallbackroots` is a no-op in this gh build). `sandbox.enableWeakerNetworkIsolation: true` would fix (2) but was deliberately reverted: the keychain block above still stops authenticated gh regardless, so the setting would buy only unauthenticated-Go-tool TLS at a documented exfiltration-vector cost. The `## Sandbox` sections in global and nxtlvl-core CLAUDE.md were REMOVED per [[nxtlvl-multi-cli-compilers]]/ADR-028 (portable source of truth — that instruction was the leak exhibit other CLIs ingested); this memory is now the only carrier. Sibling of the network restriction in [[cc-sandbox-localhost-blocked]]; this repo's push/PR workflow context is [[claude-config-repo]] and [[developer-repo-git-workflow]].

---
name: cc-sandbox-blocks-keychain-auth
description: CC command sandbox blocks macOS keychain/keyring reads — git push (osxkeychain) and gh (keyring) falsely appear unauthenticated until sandbox is disabled.
metadata:
  node_type: memory
  type: reference
  originSessionId: 549c4bbe-9121-4024-9752-40a82737e1e6
---

The CC command sandbox blocks access to the macOS keychain/keyring, so credential lookups that work fine outside it fail under it. Two empirical hits in one session on the Developer repo (HTTPS `origin`, `credential.helper=osxkeychain`):

- `git push` → `fatal: could not read Username for 'https://github.com': Device not configured` (the `osxkeychain` helper returns nothing, git falls back to a no-TTY prompt → ENXIO). Identical push succeeded with `dangerouslyDisableSandbox: true`.
- `gh auth status` → "The token in default is invalid"; with the sandbox off the SAME token reports `✓ Logged in … (keyring)`, valid, scopes `gist`/`read:org`/`repo`.

**How to apply:** for any auth-touching git/gh command on this repo — `git push`, `git pull`/`fetch` over HTTPS, `gh` calls — run it with `dangerouslyDisableSandbox: true` on the **first** attempt. Do NOT run the in-sandbox attempt first: the keychain block makes it a guaranteed false failure, so the sandbox-first try is pure wasted round-trip (re-confirmed 2026-06-28: in-sandbox `git push` → "could not read Username … Device not configured", identical push succeeded immediately sandbox-off). If a keychain-auth signal ("invalid token" / "could not read Username" / "Device not configured") ever appears from a command you *did* run in-sandbox, read it as the sandbox biting, NOT a real credential problem — don't send the user to `gh auth login` on that signal alone; retry sandbox-off. Read-only git (status/log/diff/commit) stays in-sandbox as normal — this directive is only for the auth-touching network commands. Sibling of the network restriction in [[cc-sandbox-localhost-blocked]]; this repo's push/PR workflow context is [[claude-config-repo]] and [[developer-repo-git-workflow]].

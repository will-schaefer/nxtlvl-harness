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

**How to apply:** treat "invalid token" / "could not read Username" / keychain-auth failures as the sandbox biting, NOT a real credential problem. Don't send the user to `gh auth login` or re-auth on this signal alone — re-run the git/gh command with `dangerouslyDisableSandbox: true` first to confirm. For routine `git push`/`gh` on this repo, expect to run them sandbox-off (or add a `/sandbox` rule). Sibling of the network restriction in [[cc-sandbox-localhost-blocked]]; this repo's push/PR workflow context is [[claude-config-repo]] and [[developer-repo-git-workflow]].

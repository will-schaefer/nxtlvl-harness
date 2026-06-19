---
name: user-max-subscription
description: "The user is on a Claude Max subscription — per-token cost tracking is irrelevant to their tooling decisions."
metadata:
  node_type: memory
  type: user
  originSessionId: d04f38f2-2d92-4957-b1c6-f8379cee9434
---

The user is on a **Claude Max** subscription, so per-token/per-session **cost tracking carries no value** for them. When porting or designing tooling, drop cost-metric machinery by default (e.g. nxtlvl's context monitor omitted ecc's cost dimension and the cost-tracker dependency entirely).

**How to apply:** don't propose or carry cost-warning / cost-tracking features unless the user asks; spend the saved complexity budget on quality signals (context, loops, scope) instead. Relates to [[nxtlvl-context-alert-hook]] and [[compose-on-native-quality-first]].

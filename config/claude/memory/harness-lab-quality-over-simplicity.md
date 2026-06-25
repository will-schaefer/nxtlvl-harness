---
name: harness-lab-quality-over-simplicity
description: "On harness-lab, agent quality is the top priority — accept heavier/complex machinery when it raises quality; never trade quality for simplicity."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 0090f65f-e07b-4458-9f78-608ca52a1892
---

When developing harness-lab, prioritize the **quality of the agents it produces** above all
else — including above simplicity. Heavier or more complex machinery (richer gates, adversarial
tool-grant audits, dedicated reviewer agents, fuller capability schemas) is acceptable and
*wanted* when it raises agent quality. Do NOT reflexively default to YAGNI / minimal-gate /
"simplest thing that works" here the way the global simplicity rule suggests.

**Why:** the user stated it directly — "I want to prioritize agent quality over everything
else… I'm okay to have more complex/heavy aspects if the quality increase is worth it. I don't
want to prioritize simplicity to the detriment of quality." Sharpens
[[compose-on-native-quality-first]] from a general lens into an explicit override of the
simplicity default, scoped to harness-lab.

**How to apply:** lead with the highest-quality option, not the leanest; justify machinery by
the quality it buys, not by its cost; reserve simplicity arguments for when they cost no
quality. Surface the quality↔complexity trade-off explicitly and let the user weigh it, rather
than pre-cutting on YAGNI. Note this does NOT loosen the objective-gate discipline (ADR-009/033)
— richer quality work lives in the pressure-test/warn layers, the gate still blocks only on
objective criteria. Related: [[nxtlvl-harness-lab-status]].

'use strict';
/**
 * adapter.js — the SUT bridge for the dangerous-bash gate (the only
 * capability-specific glue). A corpus `input` (a command string) → the graded
 * value (the gate's exit code: 0 = allow/warn, 2 = block).
 *
 * `env = {}` is load-bearing: it neutralizes the NXTLVL_DANGEROUS_BASH kill
 * switch so the eval measures the LIVE gate regardless of the runner's
 * environment — the same hermeticity trick dangerous-bash.test.js uses.
 *
 * This bridge can only express the 35 corpus-shaped cases (command → exit code).
 * The other 18 unit-test cases (malformed-stdin fail-open, kill-switch values,
 * detector-unit contracts) vary something the adapter cannot reach and stay the
 * unit test's job — that is the principled eval↔test boundary.
 */
const { decide } = require('../../dangerous-bash.js');

exports.run = (command) => decide(JSON.stringify({ tool_input: { command } }), {}).code;

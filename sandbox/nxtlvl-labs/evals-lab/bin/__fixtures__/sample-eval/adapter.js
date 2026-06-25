'use strict';
// Synthetic SUT for the engine's own fast, isolated tests: classify a number's
// parity. Deliberately trivial and self-contained — the REAL eval (with a real
// system-under-test) is the dangerous-bash eval that lives with the capability.
exports.run = (n) => n % 2;

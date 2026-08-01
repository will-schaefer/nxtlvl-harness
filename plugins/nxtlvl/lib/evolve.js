// evolve — deterministic instinct clustering engine for /evolve (Task 5.4a).
// Reads the instinct store via instincts.list, applies the strong-bar filter,
// clusters strong instincts by domain topic, classifies each cluster into
// exactly one type (agent|skill|command) and returns the sorted candidate set.
//
// NO LLM, NO file writes. Pure + deterministic — all confidence math uses the
// raw stored confidence, so the same store yields the same candidates whenever
// it is read.
//
// Adopted from ecc's `instinct-cli.py cmd_evolve` with five deliberate
// adaptations:
//   ADAPTATION 1 — strong-bar filter (ecc computed the set but never filtered).
//   ADAPTATION 2 — partition into exactly one type (ecc overlapped types).
//   ADAPTATION 3 — total sort order (ecc's (-size,-avg) left tie order to dict).
//   ADAPTATION 4 — cluster on the domain topic, not the normalized trigger.
//     ecc keyed clusters on the trigger text with a handful of keywords stripped,
//     which is an exact-string match in disguise: observer-written triggers are
//     long, specific sentences, so no two ever collide and every cluster is a
//     singleton. The domain field already carries a "<topic> / <specific thing>"
//     label, so its leading words are the topic the habits actually share.
//   ADAPTATION 5 — gate on RAW confidence, not decayed effective confidence.
//     Decay (30-day half-life) answers "was this used recently"; graduation asks
//     "is this habit well established". Gating graduation on the decayed value
//     made an instinct at raw 0.90 ineligible ~5 days after its last
//     reinforcement, so the bar was effectively unreachable. Decay still governs
//     recall — which instincts load into a session — it just no longer blocks
//     graduation.

'use strict';

const { list } = require('./instincts.js');

const DEFAULT_STRONG_BAR = 0.8;

// --- normalizeDomain ----------------------------------------------------------
// Cluster key = the leading words of the domain label (ADAPTATION 4).
//
// Domains are authored as "<topic> / <specific thing>", e.g.
// "multi-cli compiler / codex config re-serialization". Taking the first
// DOMAIN_KEY_WORDS words of the topic groups sibling habits ("multi-cli compiler
// / apply() directory handling") while keeping genuinely different activities
// apart ("multi-cli review / ..." stays its own family).
//
// lowercase → replace every character outside [a-z0-9 -] with a space (this
// folds the "/" separator away while keeping hyphenated words like "multi-cli"
// intact) → drop word-fragments carrying no letter or digit → take the first
// DOMAIN_KEY_WORDS words.
const DOMAIN_KEY_WORDS = 2;

function normalizeDomain(domain) {
  if (domain === undefined || domain === null) return '';
  const words = String(domain)
    .toLowerCase()
    .replace(/[^a-z0-9 -]+/g, ' ')
    .split(/\s+/)
    .filter((word) => /[a-z0-9]/.test(word));
  return words.slice(0, DOMAIN_KEY_WORDS).join(' ');
}

// --- evolve -------------------------------------------------------------------
// evolve({ projectId, strongBar? } = {}, env?, home?)
//   -> { candidates: Candidate[], considered: number, total: number }
//
// A `now` key is accepted and ignored — evolve no longer does time math
// (ADAPTATION 5). It stays tolerated so existing call sites keep working.
//
// Candidate = {
//   type: "agent" | "skill" | "command",
//   clusterKey: string,     // normalized domain topic the members share
//   instinctIds: string[],  // sorted ascending
//   size: number,
//   avgConfidence: number,  // mean RAW confidence
//   domains: string[],      // distinct, sorted ascending
// }
function evolve({ projectId, strongBar } = {}, env, home) {
  const bar = strongBar !== undefined && strongBar !== null ? strongBar : DEFAULT_STRONG_BAR;

  // Step 1: load all instincts for the project (project + global).
  const all = list({ projectId }, env, home);
  const total = all.length;

  // Step 2: strong filter on raw confidence (ADAPTATION 1 + ADAPTATION 5).
  const rawConfidence = (inst) => (Number.isFinite(inst.confidence) ? inst.confidence : 0);
  const strong = all.filter((inst) => rawConfidence(inst) >= bar);
  const considered = strong.length;

  // Step 3: cluster on the domain topic (ADAPTATION 4). An instinct with no
  // usable domain has no topic to group on — it is counted in `considered` but
  // cannot cluster, so it is left out rather than pooled under an empty key
  // (which would fabricate a cluster out of unrelated domainless habits).
  const clusters = new Map(); // clusterKey -> instinct[]
  for (const inst of strong) {
    const key = normalizeDomain(inst.domain);
    if (key === '') continue;
    if (!clusters.has(key)) clusters.set(key, []);
    clusters.get(key).push(inst);
  }

  // Step 4: classify each cluster into exactly one type (ADAPTATION 2 — partition).
  const candidates = [];
  for (const [clusterKey, members] of clusters) {
    const size = members.length;
    const rawConfs = members.map(rawConfidence);
    const avgConfidence = rawConfs.reduce((sum, v) => sum + v, 0) / size;

    let type;
    if (size >= 3 && avgConfidence >= 0.75) {
      type = 'agent';
    } else if (size >= 2) {
      type = 'skill';
    } else if (size === 1 && members[0].domain === 'workflow') {
      type = 'command';
    } else {
      // Singleton non-workflow: not a candidate.
      continue;
    }

    // instinctIds sorted ascending for determinism; domains distinct + sorted ascending.
    const instinctIds = members.map((m) => m.id).sort();
    const domains = [...new Set(members.map((m) => m.domain).filter(Boolean))].sort();

    candidates.push({ type, clusterKey, instinctIds, size, avgConfidence, domains });
  }

  // Step 5: deterministic total ordering (ADAPTATION 3).
  // (a) type rank: agent=0 < skill=1 < command=2
  // (b) -size (larger first)
  // (c) -avgConfidence (higher first)
  // (d) clusterKey ascending (final tiebreak)
  const typeRank = { agent: 0, skill: 1, command: 2 };
  candidates.sort((a, b) => {
    const rankDiff = typeRank[a.type] - typeRank[b.type];
    if (rankDiff !== 0) return rankDiff;
    const sizeDiff = b.size - a.size;
    if (sizeDiff !== 0) return sizeDiff;
    const confDiff = b.avgConfidence - a.avgConfidence;
    if (confDiff !== 0) return confDiff;
    return a.clusterKey < b.clusterKey ? -1 : a.clusterKey > b.clusterKey ? 1 : 0;
  });

  return { candidates, considered, total };
}

module.exports = { evolve, normalizeDomain };

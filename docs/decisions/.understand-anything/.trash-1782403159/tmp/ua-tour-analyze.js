#!/usr/bin/env node
const fs = require('fs');

try {
  const inPath = process.argv[2];
  const outPath = process.argv[3];
  const g = JSON.parse(fs.readFileSync(inPath, 'utf8'));
  const nodes = g.nodes || [];
  const edges = g.edges || [];
  const layers = g.layers || [];

  const byId = new Map(nodes.map(n => [n.id, n]));
  const fanIn = new Map(), fanOut = new Map();
  for (const n of nodes) { fanIn.set(n.id, 0); fanOut.set(n.id, 0); }
  for (const e of edges) {
    if (fanOut.has(e.source)) fanOut.set(e.source, fanOut.get(e.source) + 1);
    if (fanIn.has(e.target)) fanIn.set(e.target, fanIn.get(e.target) + 1);
  }

  const nm = id => (byId.get(id) || {}).name || id;
  const sm = id => (byId.get(id) || {}).summary || '';

  const fanInRanking = [...fanIn.entries()]
    .map(([id, c]) => ({ id, fanIn: c, name: nm(id) }))
    .sort((a, b) => b.fanIn - a.fanIn).slice(0, 20);
  const fanOutRanking = [...fanOut.entries()]
    .map(([id, c]) => ({ id, fanOut: c, name: nm(id) }))
    .sort((a, b) => b.fanOut - a.fanOut).slice(0, 20);

  // supersede/amend chains: depends_on edges with summary
  const chains = edges
    .filter(e => e.type === 'depends_on')
    .map(e => ({ source: e.source, target: e.target, summary: e.summary || '' }));

  const nodeSummaryIndex = {};
  for (const n of nodes) nodeSummaryIndex[n.id] = { name: n.name, type: n.type, summary: n.summary };

  const out = {
    scriptCompleted: true,
    fanInRanking,
    fanOutRanking,
    supersedeAmendChains: chains,
    layers: { count: layers.length, list: layers },
    nodeSummaryIndex,
    totalNodes: nodes.length,
    totalEdges: edges.length
  };
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  process.exit(0);
} catch (err) {
  console.error(err.stack || String(err));
  process.exit(1);
}

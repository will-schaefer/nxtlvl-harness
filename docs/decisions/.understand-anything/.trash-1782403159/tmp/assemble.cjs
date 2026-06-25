const fs = require('fs');
const I = process.argv[2];
const NOW = process.argv[3];
const COMMIT = process.argv[4];
const g = JSON.parse(fs.readFileSync(I + '/assembled-graph.json', 'utf8'));
const scan = JSON.parse(fs.readFileSync(I + '/scan-result.json', 'utf8'));
let layers = JSON.parse(fs.readFileSync(I + '/layers.json', 'utf8'));
if (!Array.isArray(layers)) layers = layers.layers || [];
let tour = JSON.parse(fs.readFileSync(I + '/tour.json', 'utf8'));
if (!Array.isArray(tour)) tour = tour.steps || tour.tour || [];
layers = layers.map((l) => ({
  id: l.id || ('layer:' + (l.name || 'x').toLowerCase().replace(/[^a-z0-9]+/g, '-')),
  name: l.name,
  description: l.description,
  nodeIds: l.nodeIds || l.nodes || [],
}));
tour.sort((a, b) => a.order - b.order);
const graph = {
  version: '1.0.0',
  project: {
    name: scan.projectName || scan.name || 'nxtlvl ADRs',
    languages: scan.languages || ['markdown'],
    frameworks: scan.frameworks || [],
    description: scan.description || scan.projectDescription || 'Architecture Decision Records for nxtlvl.',
    analyzedAt: NOW,
    gitCommitHash: COMMIT,
  },
  nodes: g.nodes,
  edges: g.edges,
  layers,
  tour,
};
fs.writeFileSync(I + '/assembled-graph.json', JSON.stringify(graph, null, 2));
console.log('Assembled: nodes', graph.nodes.length, 'edges', graph.edges.length, 'layers', layers.length, 'tour', tour.length);
console.log('project:', graph.project.name, '| analyzedAt', graph.project.analyzedAt);

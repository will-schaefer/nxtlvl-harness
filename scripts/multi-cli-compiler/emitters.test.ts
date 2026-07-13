import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  MANAGED_BEGIN,
  MANAGED_END,
  classifyAgentsSkillEntry,
  compileAntigravityAgent,
  compileAntigravityMcpServers,
  compileAntigravityRule,
  compileCodexAgent,
  compileCodexMcpServerLines,
  findClaudeOnlyTokens,
  isCompilerManagedAgentFile,
  isLabSeedOwnedToml,
  looksLikeHandConvertedRule,
  mergeMcpConfigJson,
  parseClaudeAgentSource,
  tomlDeliversMcpServer,
  upsertManagedTomlBlock,
} from './emitters.ts';

const BODY = ['project_doc_fallback_filenames = ["CLAUDE.md"]'];

test('managed block lands before the first TOML table', () => {
  const existing = 'model = "gpt-5.4"\napprovals_reviewer = "auto"\n[projects."/x"]\ntrust_level = "trusted"\n';
  const result = upsertManagedTomlBlock(existing, BODY);
  const managedAt = result.indexOf(MANAGED_BEGIN);
  const tableAt = result.indexOf('[projects."/x"]');
  assert.ok(managedAt !== -1 && tableAt !== -1);
  assert.ok(managedAt < tableAt, 'managed keys must stay top-level (before any table)');
  assert.ok(result.includes('model = "gpt-5.4"'), 'existing top-level keys preserved');
  assert.ok(result.includes('trust_level = "trusted"'), 'existing tables preserved');
});

test('managed block upsert is idempotent', () => {
  const existing = 'model = "gpt-5.4"\n[projects."/x"]\ntrust_level = "trusted"\n';
  const once = upsertManagedTomlBlock(existing, BODY);
  const twice = upsertManagedTomlBlock(once, BODY);
  assert.equal(twice, once);
});

test('managed block body is replaced in place on re-run', () => {
  const once = upsertManagedTomlBlock('[projects."/x"]\n', BODY);
  const updated = upsertManagedTomlBlock(once, ['project_doc_fallback_filenames = ["CLAUDE.md", "AGENTS.override.md"]']);
  assert.ok(updated.includes('"AGENTS.override.md"'));
  assert.ok(!updated.includes('= ["CLAUDE.md"]\n'), 'old body line removed');
  assert.equal(updated.split(MANAGED_BEGIN).length, 2, 'exactly one managed block');
  assert.equal(updated.split(MANAGED_END).length, 2);
});

test('managed block appends when the file has no tables', () => {
  const result = upsertManagedTomlBlock('model = "gpt-5.4"\n', BODY);
  assert.ok(result.startsWith('model = "gpt-5.4"'));
  assert.ok(result.trimEnd().endsWith(MANAGED_END));
});

test('managed block works on an empty file', () => {
  const result = upsertManagedTomlBlock('', BODY);
  assert.ok(result.startsWith(MANAGED_BEGIN));
  assert.ok(result.endsWith('\n'));
});

test('antigravity rule carries frontmatter, notice, and the body verbatim', () => {
  const rule = compileAntigravityRule({
    trigger: 'always_on',
    description: 'Global conventions "quoted" safely.',
    sourceLabel: '~/.claude/CLAUDE.md',
    body: '# Global conventions\n\nSome portable guidance.\n',
  });
  assert.ok(rule.startsWith('---\ntrigger: always_on\n'));
  assert.ok(rule.includes('description: "Global conventions \\"quoted\\" safely."'));
  assert.ok(rule.includes('Generated from ~/.claude/CLAUDE.md'));
  assert.ok(rule.includes('# Global conventions\n\nSome portable guidance.\n'));
});

test('antigravity rule strips pre-existing source frontmatter instead of nesting it', () => {
  const rule = compileAntigravityRule({
    trigger: 'model_decision',
    description: 'x',
    sourceLabel: 'src.md',
    body: '---\ntitle: old\n---\n# Heading\n',
  });
  assert.ok(!rule.includes('title: old'));
  assert.ok(rule.includes('# Heading'));
});

test('portability sweep catches Claude-only tokens and dedups them', () => {
  const tokens = findClaudeOnlyTokens(
    'pass dangerouslyDisableSandbox: true, see claude.ai/code, run /nxtlvl:audit, again dangerouslyDisableSandbox',
  );
  assert.deepEqual(tokens.sort(), ['/nxtlvl:', 'claude.ai/code', 'dangerouslyDisableSandbox'].sort());
});

test('portability sweep passes portable content', () => {
  assert.deepEqual(
    findClaudeOnlyTokens('Run the nxtlvl brainstorming skill, then the show-me spec → plan format.'),
    [],
  );
});

test('retire guard accepts hand-converted rules and rejects everything else', () => {
  assert.ok(looksLikeHandConvertedRule('---\ntrigger: always_on\ndescription: x\n---\n# Rule\n'));
  assert.ok(!looksLikeHandConvertedRule('# Just a markdown file\n\ntrigger: mentioned in prose\n'));
  assert.ok(!looksLikeHandConvertedRule(''));
});

const CLAUDE_AGENT = `---
name: context-scout
description: Read-only scout.
allowed-tools:
  - read
  - grep
  - glob
model: sonnet
---

# context-scout

Return file pointers only.
`;

test('agent parser reads list-style allowed-tools and removes frontmatter from the body', () => {
  const agent = parseClaudeAgentSource(CLAUDE_AGENT, 'fallback-name');
  assert.equal(agent.name, 'context-scout');
  assert.equal(agent.description, 'Read-only scout.');
  assert.deepEqual(agent.tools, ['read', 'grep', 'glob']);
  assert.equal(agent.body, '# context-scout\n\nReturn file pointers only.');
});

test('Codex agent transform uses documented top-level keys and read-only degradation', () => {
  const source = parseClaudeAgentSource(CLAUDE_AGENT, 'fallback-name');
  const compiled = compileCodexAgent(source);
  assert.ok(compiled.includes('name = "context-scout"'));
  assert.ok(compiled.includes('description = "Read-only scout."'));
  assert.ok(compiled.includes('sandbox_mode = "read-only"'));
  assert.ok(compiled.includes('developer_instructions = '));
  assert.ok(compiled.includes('Claude Code tool allowlist: read, grep, glob.'));
  assert.ok(!compiled.includes('[agent]'));
  assert.ok(isCompilerManagedAgentFile(compiled));
});

test('Codex agent transform does not force a sandbox for an editing agent', () => {
  const source = parseClaudeAgentSource(
    '---\nname: worker\ndescription: Can edit.\ntools: Read, Edit, Bash\n---\n\nMake the change.\n',
    'fallback-name',
  );
  assert.ok(!compileCodexAgent(source).includes('sandbox_mode = "read-only"'));
});

test('Antigravity agent transform maps file and orchestration tools', () => {
  const source = parseClaudeAgentSource(
    '---\nname: orchestrator\ndescription: Coordinates work.\ntools: Read, exec, Task, TaskCreate, CallMcpTool, AskPermission, DefineSubagent\n---\n\nDelegate carefully.\n',
    'fallback-name',
  );
  const compiled = compileAntigravityAgent(source);
  assert.ok(compiled.includes('tools: ["ask_permission", "call_mcp_tool", "define_subagent", "invoke_subagent", "manage_task", "run_command", "view_file"]'));
  assert.ok(compiled.includes('Delegate carefully.'));
  assert.ok(isCompilerManagedAgentFile(compiled));
});

// --- increment 2: repo-scope MCP emitters ---

test('codex mcp lines: http server with url only', () => {
  const lines = compileCodexMcpServerLines('deepwiki', { url: 'https://mcp.deepwiki.com/mcp' });
  assert.deepEqual(lines, ['[mcp_servers.deepwiki]', 'url = "https://mcp.deepwiki.com/mcp"']);
});

test('codex mcp lines: http server with headers becomes http_headers inline table', () => {
  const lines = compileCodexMcpServerLines('api', {
    url: 'https://example.com/mcp',
    headers: { Authorization: 'Bearer abc' },
  });
  assert.deepEqual(lines, [
    '[mcp_servers.api]',
    'url = "https://example.com/mcp"',
    'http_headers = { "Authorization" = "Bearer abc" }',
  ]);
});

test('codex mcp lines: stdio server with args and env', () => {
  const lines = compileCodexMcpServerLines('local', {
    command: 'npx',
    args: ['-y', 'some-server'],
    env: { TOKEN: 'x' },
  });
  assert.deepEqual(lines, [
    '[mcp_servers.local]',
    'command = "npx"',
    'args = ["-y", "some-server"]',
    'env = { "TOKEN" = "x" }',
  ]);
});

test('codex mcp lines: non-identifier server name gets quoted', () => {
  const lines = compileCodexMcpServerLines('my server', { url: 'https://x.example/mcp' });
  assert.equal(lines[0], '[mcp_servers."my server"]');
});

test('antigravity mcp: http becomes serverUrl, stdio is skipped', () => {
  const result = compileAntigravityMcpServers({
    deepwiki: { url: 'https://mcp.deepwiki.com/mcp' },
    local: { command: 'npx', args: ['-y', 'thing'] },
  });
  assert.deepEqual(result.servers, {
    deepwiki: { serverUrl: 'https://mcp.deepwiki.com/mcp' },
  });
  assert.deepEqual(result.skippedStdio, ['local']);
});

test('mcp_config merge: fresh file gets sorted deterministic shape', () => {
  const merged = mergeMcpConfigJson(null, { deepwiki: { serverUrl: 'https://mcp.deepwiki.com/mcp' } });
  assert.equal(
    merged,
    '{\n  "mcpServers": {\n    "deepwiki": {\n      "serverUrl": "https://mcp.deepwiki.com/mcp"\n    }\n  }\n}\n',
  );
});

test('mcp_config merge: byte-stable against the lab seed output', () => {
  const seedEmitted =
    '{\n  "mcpServers": {\n    "deepwiki": {\n      "serverUrl": "https://mcp.deepwiki.com/mcp"\n    }\n  }\n}\n';
  const merged = mergeMcpConfigJson(seedEmitted, {
    deepwiki: { serverUrl: 'https://mcp.deepwiki.com/mcp' },
  });
  assert.equal(merged, seedEmitted, 'identical desired state must be a byte no-op');
});

test('mcp_config merge: preserves foreign keys and servers, compiled wins per name', () => {
  const existing = JSON.stringify(
    {
      otherSetting: true,
      mcpServers: {
        keepMe: { serverUrl: 'https://keep.example/mcp' },
        deepwiki: { serverUrl: 'https://stale.example/mcp' },
      },
    },
    null,
    2,
  );
  const merged = JSON.parse(
    mergeMcpConfigJson(existing, { deepwiki: { serverUrl: 'https://mcp.deepwiki.com/mcp' } }),
  );
  assert.equal(merged.otherSetting, true);
  assert.equal(merged.mcpServers.keepMe.serverUrl, 'https://keep.example/mcp');
  assert.equal(merged.mcpServers.deepwiki.serverUrl, 'https://mcp.deepwiki.com/mcp');
});

test('mcp_config merge: invalid existing JSON throws instead of clobbering', () => {
  assert.throws(() => mergeMcpConfigJson('{not json', { a: { serverUrl: 'https://x/mcp' } }));
});

const SKILL_MD = '---\nname: grill-me\n---\n\nRun a `/grilling` session.\n';
const LINK_TARGET = '../../.claude/skills/grill-me';

test('skill relocation: empty slot creates the symlink', () => {
  assert.equal(classifyAgentsSkillEntry({ kind: 'missing' }, LINK_TARGET, SKILL_MD), 'create');
});

test('skill relocation: correct existing symlink is a no-op', () => {
  assert.equal(
    classifyAgentsSkillEntry({ kind: 'symlink', linkTarget: LINK_TARGET }, LINK_TARGET, SKILL_MD),
    'ok',
  );
});

test('skill relocation: symlink pointing elsewhere is a conflict, never retargeted', () => {
  assert.equal(
    classifyAgentsSkillEntry(
      { kind: 'symlink', linkTarget: '/somewhere/else/grill-me' },
      LINK_TARGET,
      SKILL_MD,
    ),
    'conflict',
  );
});

test('skill relocation: byte-identical copy migrates to a symlink', () => {
  assert.equal(
    classifyAgentsSkillEntry({ kind: 'directory', skillMd: SKILL_MD }, LINK_TARGET, SKILL_MD),
    'migrate',
  );
});

test('skill relocation: foreign same-name skill is a conflict (undefined behavior in Devin)', () => {
  assert.equal(
    classifyAgentsSkillEntry(
      { kind: 'directory', skillMd: '---\nname: grill-me\n---\n\nA different skill.\n' },
      LINK_TARGET,
      SKILL_MD,
    ),
    'conflict',
  );
});

test('skill relocation: directory without SKILL.md and plain files are conflicts', () => {
  assert.equal(
    classifyAgentsSkillEntry({ kind: 'directory', skillMd: null }, LINK_TARGET, SKILL_MD),
    'conflict',
  );
  assert.equal(classifyAgentsSkillEntry({ kind: 'file' }, LINK_TARGET, SKILL_MD), 'conflict');
});

test('lab seed ownership detection and delivery check', () => {
  const seedFile =
    '# Generated from .agents/stack.toml by scripts/sync-agent-configs.ts.\nmodel = "gpt-5.5"\n\n[mcp_servers.deepwiki]\nurl = "https://mcp.deepwiki.com/mcp"\nenabled = true\n';
  assert.ok(isLabSeedOwnedToml(seedFile));
  assert.ok(!isLabSeedOwnedToml('model = "gpt-5.5"\n'));
  assert.ok(tomlDeliversMcpServer(seedFile, 'deepwiki', 'https://mcp.deepwiki.com/mcp'));
  assert.ok(!tomlDeliversMcpServer(seedFile, 'deepwiki', 'https://other.example/mcp'));
  assert.ok(!tomlDeliversMcpServer(seedFile, 'missing', 'https://mcp.deepwiki.com/mcp'));
});

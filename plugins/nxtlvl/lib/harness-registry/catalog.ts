import * as path from 'node:path';

export const CATALOG_OWNERS = ['core', 'wiki', 'lab'] as const;
export type CatalogOwner = (typeof CATALOG_OWNERS)[number];

export const COMPONENT_KINDS = [
  'plugin',
  'application',
  'service',
  'engine',
  'subsystem',
] as const;
export type ComponentKind = (typeof COMPONENT_KINDS)[number];

export const CAPABILITY_KINDS = [
  'skill',
  'agent',
  'command',
  'hook',
  'mcp-server',
  'script',
  'configuration-module',
  'workflow',
] as const;
export type CapabilityKind = (typeof CAPABILITY_KINDS)[number];

export interface CatalogCapabilityRoot {
  path: string;
  kind: CapabilityKind;
  entry: string;
}

export interface CatalogEntryOverride {
  path: string;
  name?: string;
  control_parent?: string;
  related_components?: string[];
}

export interface CatalogComponent {
  id: string;
  name: string;
  kind: ComponentKind;
  root: string;
  capability_roots: CatalogCapabilityRoot[];
  exclusions?: string[];
  entry_overrides?: CatalogEntryOverride[];
}

export interface CatalogFragment {
  schema_version: 1;
  owner: CatalogOwner;
  components: CatalogComponent[];
}

export interface CatalogFinding {
  code: string;
  severity: 'error' | 'warning';
  path: string;
  message: string;
}

export interface CatalogValidationResult {
  value: CatalogFragment | null;
  findings: CatalogFinding[];
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOneOf<const T extends readonly string[]>(value: unknown, values: T): value is T[number] {
  return typeof value === 'string' && values.includes(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isSafeRelativePath(value: unknown): value is string {
  if (!isNonEmptyString(value) || value.includes('\0') || path.isAbsolute(value)) return false;
  return !value.split(/[\\/]/u).includes('..');
}

function finding(code: string, at: string, message: string): CatalogFinding {
  return { code, severity: 'error', path: at, message };
}

function findUnknownFields(
  value: UnknownRecord,
  allowed: readonly string[],
  at: string,
  findings: CatalogFinding[],
): void {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      const fieldPath = at === '$' ? `$.${key}` : `${at}.${key}`;
      findings.push(finding('catalog.unknown_field', fieldPath, `Unknown catalog field: ${key}.`));
    }
  }
}

function validateCatalog(input: unknown): CatalogValidationResult {
  if (!isRecord(input)) {
    return {
      value: null,
      findings: [finding('catalog.invalid_type', '$', 'Catalog must be an object.')],
    };
  }

  const findings: CatalogFinding[] = [];
  findUnknownFields(input, ['schema_version', 'owner', 'components'], '$', findings);

  if (input.schema_version !== 1) {
    findings.push(finding('catalog.invalid_schema_version', '$.schema_version', 'schema_version must be 1.'));
  }

  const owner = input.owner;
  if (!isOneOf(owner, CATALOG_OWNERS)) {
    findings.push(finding('catalog.invalid_owner', '$.owner', 'owner must be core, wiki, or lab.'));
  }

  const components = input.components;
  if (!Array.isArray(components)) {
    findings.push(finding('catalog.invalid_components', '$.components', 'components must be an array.'));
    return { value: null, findings };
  }

  const normalized: CatalogComponent[] = [];
  const seenIds = new Set<string>();

  for (const [index, candidate] of components.entries()) {
    const at = `$.components[${index}]`;
    if (!isRecord(candidate)) {
      findings.push(finding('catalog.invalid_component', at, 'Component must be an object.'));
      continue;
    }

    findUnknownFields(
      candidate,
      ['id', 'name', 'kind', 'root', 'capability_roots', 'exclusions', 'entry_overrides'],
      at,
      findings,
    );

    const before = findings.length;
    if (!isNonEmptyString(candidate.id)) {
      findings.push(finding('catalog.invalid_component_id', `${at}.id`, 'Component id must be a non-empty string.'));
    } else {
      if (isOneOf(owner, CATALOG_OWNERS) && !candidate.id.startsWith(`${owner}/component/`)) {
        findings.push(finding('catalog.invalid_component_id', `${at}.id`, `Component id must start with ${owner}/component/.`));
      }
      if (seenIds.has(candidate.id)) {
        findings.push(finding('catalog.duplicate_component_id', `${at}.id`, `Duplicate component id: ${candidate.id}.`));
      }
      seenIds.add(candidate.id);
    }

    if (!isNonEmptyString(candidate.name)) {
      findings.push(finding('catalog.invalid_component_name', `${at}.name`, 'Component name must be a non-empty string.'));
    }
    if (!isOneOf(candidate.kind, COMPONENT_KINDS)) {
      findings.push(finding('catalog.invalid_component_kind', `${at}.kind`, `Component kind must be one of: ${COMPONENT_KINDS.join(', ')}.`));
    }
    if (!isSafeRelativePath(candidate.root)) {
      findings.push(finding('catalog.invalid_component_root', `${at}.root`, 'Component root must be a safe relative path.'));
    }

    const roots = candidate.capability_roots;
    if (!Array.isArray(roots)) {
      findings.push(finding('catalog.invalid_capability_roots', `${at}.capability_roots`, 'capability_roots must be an array.'));
    } else {
      for (const [rootIndex, root] of roots.entries()) {
        const rootAt = `${at}.capability_roots[${rootIndex}]`;
        if (!isRecord(root)) {
          findings.push(finding('catalog.invalid_capability_root', rootAt, 'Capability root must be an object.'));
          continue;
        }
        findUnknownFields(root, ['path', 'kind', 'entry'], rootAt, findings);
        if (!isSafeRelativePath(root.path)) {
          findings.push(finding('catalog.invalid_capability_path', `${rootAt}.path`, 'Capability path must be a safe relative path.'));
        }
        if (!isOneOf(root.kind, CAPABILITY_KINDS)) {
          findings.push(finding('catalog.invalid_capability_kind', `${rootAt}.kind`, `Capability kind must be one of: ${CAPABILITY_KINDS.join(', ')}.`));
        }
        if (!isSafeRelativePath(root.entry)) {
          findings.push(finding('catalog.invalid_capability_entry', `${rootAt}.entry`, 'Capability entry must be a safe relative path or file pattern.'));
        }
      }
    }

    const exclusions = candidate.exclusions;
    if (exclusions !== undefined) {
      if (!Array.isArray(exclusions)) {
        findings.push(finding('catalog.invalid_exclusions', `${at}.exclusions`, 'exclusions must be an array.'));
      } else {
        for (const [exclusionIndex, exclusion] of exclusions.entries()) {
          if (!isSafeRelativePath(exclusion)) {
            findings.push(finding(
              'catalog.invalid_exclusion',
              `${at}.exclusions[${exclusionIndex}]`,
              'Exclusion must be a safe relative path or file pattern.',
            ));
          }
        }
      }
    }

    const entryOverrides = candidate.entry_overrides;
    if (entryOverrides !== undefined) {
      if (!Array.isArray(entryOverrides)) {
        findings.push(finding('catalog.invalid_entry_overrides', `${at}.entry_overrides`, 'entry_overrides must be an array.'));
      } else {
        for (const [overrideIndex, override] of entryOverrides.entries()) {
          const overrideAt = `${at}.entry_overrides[${overrideIndex}]`;
          if (!isRecord(override)) {
            findings.push(finding('catalog.invalid_entry_override', overrideAt, 'Entry override must be an object.'));
            continue;
          }
          findUnknownFields(
            override,
            ['path', 'name', 'control_parent', 'related_components'],
            overrideAt,
            findings,
          );
          if (!isSafeRelativePath(override.path)) {
            findings.push(finding('catalog.invalid_override_path', `${overrideAt}.path`, 'Override path must be a safe relative path.'));
          }
          if (override.name !== undefined && !isNonEmptyString(override.name)) {
            findings.push(finding('catalog.invalid_override_name', `${overrideAt}.name`, 'Override name must be a non-empty string.'));
          }
          if (override.control_parent !== undefined && !isNonEmptyString(override.control_parent)) {
            findings.push(finding('catalog.invalid_control_parent', `${overrideAt}.control_parent`, 'control_parent must be a non-empty identity.'));
          }
          if (override.related_components !== undefined) {
            if (!Array.isArray(override.related_components)
              || override.related_components.some((item) => !isNonEmptyString(item))) {
              findings.push(finding(
                'catalog.invalid_related_components',
                `${overrideAt}.related_components`,
                'related_components must contain non-empty component identities.',
              ));
            }
          }
        }
      }
    }

    if (findings.length === before) {
      const normalizedComponent: CatalogComponent = {
        id: candidate.id as string,
        name: candidate.name as string,
        kind: candidate.kind as ComponentKind,
        root: candidate.root as string,
        capability_roots: (roots as UnknownRecord[]).map((root) => ({
          path: root.path as string,
          kind: root.kind as CapabilityKind,
          entry: root.entry as string,
        })),
      };
      if (exclusions !== undefined) {
        normalizedComponent.exclusions = [...(exclusions as string[])];
      }
      if (entryOverrides !== undefined) {
        normalizedComponent.entry_overrides = (entryOverrides as UnknownRecord[]).map((override) => {
          const normalizedOverride: CatalogEntryOverride = { path: override.path as string };
          if (override.name !== undefined) normalizedOverride.name = override.name as string;
          if (override.control_parent !== undefined) {
            normalizedOverride.control_parent = override.control_parent as string;
          }
          if (override.related_components !== undefined) {
            normalizedOverride.related_components = [...(override.related_components as string[])];
          }
          return normalizedOverride;
        });
      }
      normalized.push(normalizedComponent);
    }
  }

  if (findings.length > 0 || !isOneOf(owner, CATALOG_OWNERS) || input.schema_version !== 1) {
    return { value: null, findings };
  }

  return {
    value: { schema_version: 1, owner, components: normalized },
    findings,
  };
}

export function validateCatalogFragment(input: unknown): CatalogValidationResult {
  try {
    return validateCatalog(input);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown validation error.';
    return {
      value: null,
      findings: [finding('catalog.validation_failed', '$', `Catalog validation failed safely: ${message}`)],
    };
  }
}

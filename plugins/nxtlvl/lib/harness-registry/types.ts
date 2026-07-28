import type { CapabilityKind, CatalogOwner, ComponentKind } from './catalog.ts';

export type RegistryPhase =
  | 'catalog-only'
  | 'imported'
  | 'parity-ready'
  | 'authoritative';

export type DesiredDeploymentState = 'active' | 'benched';

export interface RegistryState {
  schemaVersion: 1;
  phase: RegistryPhase;
  desired: Record<string, DesiredDeploymentState>;
  appliedFingerprints: Record<string, string>;
}

export interface RegistryFinding {
  code: string;
  severity: 'error' | 'warning';
  message: string;
  source?: string;
  path?: string;
}

export interface ComponentSnapshot {
  id: string;
  owner: CatalogOwner;
  name: string;
  kind: ComponentKind;
  sourceRoot: string;
  availability: 'available' | 'unavailable';
  processState?: 'running' | 'stopped' | 'unknown';
}

export interface CapabilitySnapshot {
  id: string;
  componentId: string;
  name: string;
  kind: CapabilityKind;
  entryPath: string;
  controlMode: 'self' | 'parent' | 'read-only';
  controlId: string;
  controlReason?: string;
  lifecycle: 'development' | 'graduated';
  deployment: 'active' | 'benched' | 'drift' | 'external' | 'unavailable';
  provenance: string[];
  development?: {
    source: string;
    stage: string;
    manifestPath: string;
    cellRoot: string;
    target?: string;
  };
  evidence: {
    evaluations: number;
    tests: number;
    latestStatus?: 'passed' | 'failed' | 'error';
  };
}

export interface ResourceSnapshot {
  id: string;
  capabilityId: string;
  source: string;
  kind: string;
  relativePath: string;
  displayName: string;
  previewSupported: boolean;
}

export interface HarnessSnapshot {
  schemaVersion: 1;
  generatedAt: string;
  phase: RegistryPhase;
  parityEligible: boolean;
  components: ComponentSnapshot[];
  capabilities: CapabilitySnapshot[];
  resources: ResourceSnapshot[];
  findings: RegistryFinding[];
}

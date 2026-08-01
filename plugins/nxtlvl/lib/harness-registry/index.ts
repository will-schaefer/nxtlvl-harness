export {
  CAPABILITY_KINDS,
  CATALOG_OWNERS,
  COMPONENT_KINDS,
  validateCatalogFragment,
} from './catalog.ts';
export { loadCatalogFragment } from './catalog-file.ts';
export {
  activate,
  bench,
  checkParity,
  cutover,
  defaultParityDir,
  exitCodeFor,
  importObserved,
  loadRegistry,
  reconcile,
  registryExists,
} from './authority.ts';
export { runParity } from './parity.ts';
export {
  applyClaudeProjection,
  applyCodexProjection,
  fileSha256,
  fingerprintManaged,
  isExternalOrReadOnlyId,
  isFamilyManagedComponentId,
  managedFromDesired,
  projectClaudeCandidate,
  projectCodexCandidate,
} from './projectors.ts';
export {
  defaultClaudeProviderPaths,
  defaultCodexProviderPaths,
  FAMILY_PLUGIN_COMPONENTS,
  readClaudeProvider,
  readCodexProvider,
} from './providers.ts';
export { resolveContainedRealPath } from './discovery.ts';
export { buildSnapshot } from './snapshot.ts';
export { readRegistry, readSnapshot, writeRegistry, writeSnapshot } from './store.ts';
export type {
  CapabilityKind,
  CatalogCapabilityRoot,
  CatalogComponent,
  CatalogEntryOverride,
  CatalogFinding,
  CatalogFragment,
  CatalogOwner,
  CatalogValidationResult,
  ComponentKind,
} from './catalog.ts';
export type { SnapshotInput, SnapshotRepositoryInput } from './snapshot.ts';
export type { StoreOptions } from './store.ts';
export type {
  ClaudeProviderPaths,
  CodexProviderPaths,
  ProviderCapabilityObservation,
  ProviderName,
  ProviderObservation,
  ProviderPluginObservation,
} from './providers.ts';
export type {
  ApplyResult,
  ClaudeProjection,
  CodexProjection,
  ProjectorFinding,
} from './projectors.ts';
export type { AuthorityOptions } from './authority.ts';
export type { ParityOptions, ParityRunResult } from './parity.ts';
export type {
  CapabilitySnapshot,
  ComponentSnapshot,
  DesiredDeploymentState,
  HarnessSnapshot,
  OperationOutcome,
  OperationResult,
  ParityReport,
  RegistryFinding,
  RegistryPhase,
  RegistryState,
  ResourceSnapshot,
} from './types.ts';

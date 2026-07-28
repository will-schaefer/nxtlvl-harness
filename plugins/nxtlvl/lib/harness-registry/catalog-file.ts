import * as fs from 'node:fs';

import { parse } from 'yaml';

import {
  validateCatalogFragment,
  type CatalogFinding,
  type CatalogValidationResult,
} from './catalog.ts';

function failure(code: string, filePath: string, message: string): CatalogValidationResult {
  const finding: CatalogFinding = {
    code,
    severity: 'error',
    path: '$',
    message: `${message} Source: ${filePath}.`,
  };
  return { value: null, findings: [finding] };
}

export function loadCatalogFragment(filePath: string): CatalogValidationResult {
  let source: string;
  try {
    source = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown read error.';
    return failure('catalog.read_failed', filePath, `Could not read catalog: ${message}`);
  }

  try {
    return validateCatalogFragment(parse(source, { strict: true, uniqueKeys: true }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown parse error.';
    return failure('catalog.parse_failed', filePath, `Could not parse catalog YAML: ${message}`);
  }
}

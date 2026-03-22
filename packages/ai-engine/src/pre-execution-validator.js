const FORBIDDEN_IMPORT_PATTERNS = [
  /from\s+['"]child_process['"]/u,
  /from\s+['"]node:child_process['"]/u,
  /require\(['"]child_process['"]\)/u,
  /require\(['"]node:child_process['"]\)/u,
  /from\s+['"]vm['"]/u,
  /require\(['"]vm['"]\)/u,
];

const BLOCKED_PROCESS_PATTERNS = [
  /\bexec\s*\(/u,
  /\bspawn\s*\(/u,
  /\bfork\s*\(/u,
  /\bexecSync\s*\(/u,
  /\bspawnSync\s*\(/u,
  /process\.mainModule/u,
  /[`$][(]{1}/u,
];

const SUSPICIOUS_FILESYSTEM_PATTERNS = [
  /\/etc\//u,
  /\/proc\//u,
  /\/sys\//u,
  /\.ssh\//u,
  /\.env/u,
  /\.npmrc/u,
  /readFileSync\s*\(\s*['"]\//u,
  /writeFileSync\s*\(\s*['"]\//u,
];

function recordViolation(store, category, detail) {
  const entry = store.get(category) ?? { category, details: [] };
  if (!entry.details.includes(detail)) {
    entry.details.push(detail);
  }
  store.set(category, entry);
}

export function validateGeneratedArtifact({
  code,
  dependencies = [],
  dependencyPolicy = {},
}) {
  if (!code || typeof code !== 'string') {
    throw new Error('Generated artifact validation requires source code.');
  }

  if (!Array.isArray(dependencies)) {
    throw new Error('Dependencies must be provided as an array.');
  }

  const denylist = dependencyPolicy.denylist ?? [];
  const allowlist = dependencyPolicy.allowlist ?? null;
  const violationStore = new Map();

  for (const pattern of FORBIDDEN_IMPORT_PATTERNS) {
    if (pattern.test(code)) {
      recordViolation(violationStore, 'forbidden_import', pattern.source);
    }
  }

  for (const pattern of BLOCKED_PROCESS_PATTERNS) {
    if (pattern.test(code)) {
      recordViolation(violationStore, 'blocked_process_spawn', pattern.source);
    }
  }

  for (const pattern of SUSPICIOUS_FILESYSTEM_PATTERNS) {
    if (pattern.test(code)) {
      recordViolation(violationStore, 'suspicious_filesystem_access', pattern.source);
    }
  }

  for (const dependency of dependencies) {
    if (allowlist && !allowlist.includes(dependency)) {
      recordViolation(violationStore, 'dependency_not_allowlisted', dependency);
    }

    if (denylist.includes(dependency)) {
      recordViolation(violationStore, 'dependency_denylisted', dependency);
    }
  }

  const violations = [...violationStore.values()].map((entry) =>
    Object.freeze({
      category: entry.category,
      details: Object.freeze([...entry.details].sort()),
    }),
  );

  return Object.freeze({
    valid: violations.length === 0,
    violations: Object.freeze(violations),
  });
}

import type { CompareOptions, ComparisonSummary, DiffEntry } from "@jsontools/shared";

export interface CompareEngineResult {
  summary: ComparisonSummary;
  differences: DiffEntry[];
  processingTimeMs: number;
}

/**
 * Deep JSON comparison engine.
 * Supports nested objects, arrays, type changes, and smart ignore options.
 */
export function compareJson(
  json1: unknown,
  json2: unknown,
  options: CompareOptions = {}
): CompareEngineResult {
  const start = performance.now();
  const differences: DiffEntry[] = [];

  deepDiff(json1, json2, "$", differences, options);

  const summary: ComparisonSummary = {
    added: differences.filter((d) => d.type === "added").length,
    removed: differences.filter((d) => d.type === "removed").length,
    modified: differences.filter((d) => d.type === "modified").length,
    unchanged: differences.filter((d) => d.type === "unchanged").length,
    isEqual:
      differences.filter((d) => d.type !== "unchanged").length === 0,
  };

  return {
    summary,
    differences,
    processingTimeMs: Math.round(performance.now() - start),
  };
}

function deepDiff(
  a: unknown,
  b: unknown,
  path: string,
  diffs: DiffEntry[],
  options: CompareOptions
): void {
  // Skip ignored paths
  if (options.ignorePaths?.some((p) => path.startsWith(p))) return;

  const normalizedA = normalize(a, options);
  const normalizedB = normalize(b, options);

  if (normalizedA === normalizedB) {
    diffs.push({ path, type: "unchanged", oldValue: a, newValue: b });
    return;
  }

  const typeA = getType(a);
  const typeB = getType(b);

  // Type mismatch
  if (typeA !== typeB) {
    diffs.push({ path, type: "modified", oldValue: a, newValue: b });
    return;
  }

  if (typeA === "object" && typeB === "object") {
    const objA = a as Record<string, unknown>;
    const objB = b as Record<string, unknown>;

    const keysA = new Set(Object.keys(objA));
    const keysB = new Set(Object.keys(objB));

    const allKeys = new Set([...keysA, ...keysB]);

    for (const key of allKeys) {
      const childPath = `${path}.${key}`;
      if (keysA.has(key) && !keysB.has(key)) {
        diffs.push({ path: childPath, type: "removed", oldValue: objA[key] });
      } else if (!keysA.has(key) && keysB.has(key)) {
        diffs.push({ path: childPath, type: "added", newValue: objB[key] });
      } else {
        deepDiff(objA[key], objB[key], childPath, diffs, options);
      }
    }
    return;
  }

  if (typeA === "array" && typeB === "array") {
    const arrA = a as unknown[];
    const arrB = b as unknown[];

    if (options.ignoreOrder) {
      diffArraysUnordered(arrA, arrB, path, diffs, options);
    } else {
      diffArraysOrdered(arrA, arrB, path, diffs, options);
    }
    return;
  }

  // Primitive mismatch
  diffs.push({ path, type: "modified", oldValue: a, newValue: b });
}

function diffArraysOrdered(
  arrA: unknown[],
  arrB: unknown[],
  path: string,
  diffs: DiffEntry[],
  options: CompareOptions
): void {
  const maxLen = Math.max(arrA.length, arrB.length);
  for (let i = 0; i < maxLen; i++) {
    const childPath = `${path}[${i}]`;
    if (i >= arrA.length) {
      diffs.push({ path: childPath, type: "added", newValue: arrB[i] });
    } else if (i >= arrB.length) {
      diffs.push({ path: childPath, type: "removed", oldValue: arrA[i] });
    } else {
      deepDiff(arrA[i], arrB[i], childPath, diffs, options);
    }
  }
}

function diffArraysUnordered(
  arrA: unknown[],
  arrB: unknown[],
  path: string,
  diffs: DiffEntry[],
  options: CompareOptions
): void {
  const matchedB = new Set<number>();

  for (let i = 0; i < arrA.length; i++) {
    let found = false;
    for (let j = 0; j < arrB.length; j++) {
      if (matchedB.has(j)) continue;
      const tempDiffs: DiffEntry[] = [];
      deepDiff(arrA[i], arrB[j], `${path}[${i}]`, tempDiffs, options);
      const hasDiff = tempDiffs.some((d) => d.type !== "unchanged");
      if (!hasDiff) {
        matchedB.add(j);
        diffs.push({
          path: `${path}[${i}]`,
          type: "unchanged",
          oldValue: arrA[i],
          newValue: arrB[j],
        });
        found = true;
        break;
      }
    }
    if (!found) {
      diffs.push({ path: `${path}[${i}]`, type: "removed", oldValue: arrA[i] });
    }
  }

  for (let j = 0; j < arrB.length; j++) {
    if (!matchedB.has(j)) {
      diffs.push({ path: `${path}[${j}]`, type: "added", newValue: arrB[j] });
    }
  }
}

function getType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function normalize(value: unknown, options: CompareOptions): unknown {
  if (typeof value === "string") {
    let v = value;
    if (options.ignoreCasing) v = v.toLowerCase();
    if (options.ignoreWhitespace) v = v.trim().replace(/\s+/g, " ");
    return v;
  }
  return value;
}

/**
 * Validate JSON string. Returns parsed value or throws.
 */
export function validateJson(raw: string): {
  isValid: boolean;
  parsed: unknown;
  errors: string[];
} {
  try {
    const parsed = JSON.parse(raw);
    return { isValid: true, parsed, errors: [] };
  } catch (err) {
    return {
      isValid: false,
      parsed: null,
      errors: [(err as Error).message],
    };
  }
}

/**
 * Recursively count keys and depth in a JSON object
 */
export function analyzeJson(value: unknown): { keys: number; depth: number; size: number } {
  let keys = 0;
  let maxDepth = 0;

  function traverse(v: unknown, depth: number) {
    if (depth > maxDepth) maxDepth = depth;
    if (v && typeof v === "object") {
      if (Array.isArray(v)) {
        for (const item of v) traverse(item, depth + 1);
      } else {
        for (const [, val] of Object.entries(v as Record<string, unknown>)) {
          keys++;
          traverse(val, depth + 1);
        }
      }
    }
  }

  traverse(value, 0);
  return { keys, depth: maxDepth, size: JSON.stringify(value).length };
}

import fs from "node:fs/promises";
import path from "node:path";
import { readAll } from "./clojure-reader.js";

export const ADAPTER_PATH = ".sdd-flow/project.md";
export const BLOCK_BEGIN = /^<!--\s*BEGIN SDD-FLOW:\s*([a-z0-9-]+)\s*-->\s*$/u;
export const BLOCK_END = /^<!--\s*END SDD-FLOW:\s*([a-z0-9-]+)\s*-->\s*$/u;

// Canon files whose definitions a project copy is measured against.
const CANON_SOURCES = [
  ".sdd-flow/FLOW_CONTRACT.md",
  ".sdd-flow/references/PROJECT_ADAPTER.md",
];

/** Every ```clojure fence in a markdown document, as source strings. */
export function clojureFences(content) {
  const fences = [];
  let inFence = false;
  let buffer = [];
  for (const line of content.split(/\r?\n/u)) {
    if (!inFence) {
      if (line.trim() === "```clojure") {
        inFence = true;
        buffer = [];
      }
      continue;
    }
    if (line.trim() === "```") {
      fences.push(buffer.join("\n"));
      inFence = false;
      buffer = [];
      continue;
    }
    buffer.push(line);
  }
  return fences;
}

/**
 * Definitions keyed by name. A copy of the canon is compared to the installed
 * version by definition name, not by marker: a project that transcribed
 * `(def go-contract …)` into its own document is still comparable, however it
 * arranged the surrounding prose.
 */
export function definitions(content) {
  const found = new Map();
  for (const fence of clojureFences(content)) {
    let forms;
    try {
      forms = readAll(fence);
    } catch {
      continue; // an unreadable fence is the validator's business, not the diff's
    }
    for (const form of forms) {
      const name = definitionName(form);
      if (name && !found.has(name)) {
        found.set(name, canonicalize(form));
      }
    }
  }
  return found;
}

function definitionName(form) {
  if (form.type !== "list" || form.values.length < 2) {
    return null;
  }
  const [head, name] = form.values;
  if (head.type !== "symbol" || head.value !== "def") {
    return null;
  }
  return name.type === "symbol" ? name.value : null;
}

/** Stable text for a form: whitespace and comments drop out, content does not. */
export function canonicalize(form) {
  switch (form.type) {
    case "list":
      return `(${form.values.map(canonicalize).join(" ")})`;
    case "vector":
      return `[${form.values.map(canonicalize).join(" ")}]`;
    case "set":
      return `#{${form.values.map(canonicalize).join(" ")}}`;
    case "map":
      return `{${form.values.map(canonicalize).join(" ")}}`;
    case "string":
      return JSON.stringify(form.value);
    case "quote":
      return `'${canonicalize(form.value)}`;
    case "metadata":
      return `^${canonicalize(form.metadata)} ${canonicalize(form.value)}`;
    default:
      return form.value;
  }
}

/** Plain values out of the adapter's forms, so declarations can be read. */
export function toValue(form) {
  switch (form.type) {
    case "map": {
      const result = {};
      for (let i = 0; i < form.values.length; i += 2) {
        result[toValue(form.values[i])] = toValue(form.values[i + 1]);
      }
      return result;
    }
    case "vector":
    case "set":
      return form.values.map(toValue);
    case "list":
      return form.values.map(toValue);
    case "quote":
      return toValue(form.value);
    case "metadata":
      return toValue(form.value);
    default:
      return form.value;
  }
}

/** Declared file sets in the adapter, collected across every fence. */
export function adapterFileSets(content) {
  const canonCopy = new Set();
  const footprint = new Set();
  for (const fence of clojureFences(content)) {
    let forms;
    try {
      forms = readAll(fence);
    } catch {
      continue;
    }
    for (const form of forms) {
      collectFileSets(toValue(form), canonCopy, footprint);
    }
  }
  return { canonCopy: [...canonCopy], footprint: [...footprint] };
}

function collectFileSets(value, canonCopy, footprint) {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectFileSets(item, canonCopy, footprint);
    }
    return;
  }
  if (!value || typeof value !== "object") {
    return;
  }
  for (const [key, entry] of Object.entries(value)) {
    if (key === ":files" || key === ":footprint") {
      const target = key === ":files" ? canonCopy : footprint;
      for (const file of [entry].flat()) {
        if (typeof file === "string" && file !== "?") {
          target.add(file);
        }
      }
      continue;
    }
    collectFileSets(entry, canonCopy, footprint);
  }
}

/**
 * Compare each project copy of the canon against the installed version.
 * A definition the project never copied is not reported: only what it holds.
 */
export async function diffCanonCopies(root, files) {
  const canon = new Map();
  for (const source of CANON_SOURCES) {
    const content = await readIfPresent(path.join(root, source));
    if (content === null) {
      continue;
    }
    for (const [name, text] of definitions(content)) {
      if (!canon.has(name)) {
        canon.set(name, text);
      }
    }
  }

  const results = [];
  for (const file of files) {
    const content = await readIfPresent(path.join(root, file));
    if (content === null) {
      results.push({ file, status: "missing", definitions: [] });
      continue;
    }
    const copies = definitions(content);
    const compared = [];
    for (const [name, text] of copies) {
      if (!canon.has(name)) {
        compared.push({ name, status: "local-only" });
      } else if (canon.get(name) === text) {
        compared.push({ name, status: "same" });
      } else {
        compared.push({ name, status: "differs" });
      }
    }
    compared.sort((left, right) => left.name.localeCompare(right.name));
    results.push({ file, status: "read", definitions: compared });
  }

  const copied = new Set(
    results.flatMap((entry) =>
      entry.definitions
        .filter((definition) => definition.status !== "local-only")
        .map((definition) => definition.name),
    ),
  );
  const missing = [...canon.keys()]
    .filter((name) => !copied.has(name))
    .sort();

  return { files: results, canonOnly: missing, canonSize: canon.size };
}

/** Remove every marked sdd-flow block from a document the project owns. */
export function stripBlocks(content) {
  const lines = content.split(/\r?\n/u);
  const kept = [];
  const removed = [];
  let openId = null;
  for (const line of lines) {
    const begin = BLOCK_BEGIN.exec(line);
    if (begin && openId === null) {
      openId = begin[1];
      removed.push(openId);
      continue;
    }
    const end = BLOCK_END.exec(line);
    if (end && openId === end[1]) {
      openId = null;
      continue;
    }
    if (openId === null) {
      kept.push(line);
    }
  }
  if (openId !== null) {
    throw new Error(`unclosed sdd-flow block ${openId}`);
  }
  return { content: kept.join("\n"), removed };
}

export async function readIfPresent(absolutePath) {
  try {
    return await fs.readFile(absolutePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "EISDIR") {
      return null;
    }
    throw error;
  }
}

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  validateExampleCoverage,
  validateNormativeMarkdown,
  validateNotationCoverage,
} from "./document-validator.js";

const PACKAGE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const PACKAGE_JSON = JSON.parse(
  await fs.readFile(path.join(PACKAGE_ROOT, "package.json"), "utf8"),
);
const SCHEMA_VERSION = 1;
const CONFIG_PATH = ".sdd-flow/config.json";
const MANIFEST_PATH = ".sdd-flow/manifest.json";
const FLOW_DIRECTORIES = ["Flows", "Flows/Archive"];
const CORE_FILES = [
  [
    "templates/core/references/CLOJURE_NOTATION.md",
    ".sdd-flow/references/CLOJURE_NOTATION.md",
  ],
  [
    "templates/core/references/EXAMPLES.md",
    ".sdd-flow/references/EXAMPLES.md",
  ],
  [
    "templates/core/references/ADAPTERS.md",
    ".sdd-flow/references/ADAPTERS.md",
  ],
  ["templates/core/FLOW_CONTRACT.md", ".sdd-flow/FLOW_CONTRACT.md"],
  ["templates/core/templates/FLOW.md", ".sdd-flow/templates/FLOW.md"],
  ["templates/core/templates/RESEARCH.md", ".sdd-flow/templates/RESEARCH.md"],
];
const CODEX_FILES = [
  [
    "templates/skills/sdd-clojure-flow/SKILL.md",
    ".agents/skills/sdd-clojure-flow/SKILL.md",
  ],
  [
    "templates/skills/sdd-clojure-flow/agents/openai.yaml",
    ".agents/skills/sdd-clojure-flow/agents/openai.yaml",
  ],
  [
    "templates/skills/sdd-deep-research/SKILL.md",
    ".agents/skills/sdd-deep-research/SKILL.md",
  ],
  [
    "templates/skills/sdd-deep-research/agents/openai.yaml",
    ".agents/skills/sdd-deep-research/agents/openai.yaml",
  ],
];
const CLAUDE_FILES = [
  [
    "templates/skills/sdd-clojure-flow/SKILL.md",
    ".claude/skills/sdd-clojure-flow/SKILL.md",
  ],
  [
    "templates/claude/commands/sdd-flow/start.md",
    ".claude/commands/sdd-flow/start.md",
  ],
  [
    "templates/claude/commands/sdd-flow/resume.md",
    ".claude/commands/sdd-flow/resume.md",
  ],
  [
    "templates/claude/commands/sdd-flow/close.md",
    ".claude/commands/sdd-flow/close.md",
  ],
  [
    "templates/skills/sdd-deep-research/SKILL.md",
    ".claude/skills/sdd-deep-research/SKILL.md",
  ],
  [
    "templates/claude/commands/sdd-research.md",
    ".claude/commands/sdd-research.md",
  ],
];

export function normalizeTools(value) {
  const tools = Array.isArray(value) ? value : String(value).split(",");
  const normalized = [...new Set(tools.map((tool) => tool.trim().toLowerCase()))]
    .filter(Boolean)
    .sort();
  const unsupported = normalized.filter(
    (tool) => tool !== "codex" && tool !== "claude",
  );
  if (normalized.length === 0) {
    throw new Error("--tools requires codex, claude, or both");
  }
  if (unsupported.length > 0) {
    throw new Error(`unsupported tools: ${unsupported.join(", ")}`);
  }
  return normalized;
}

export async function initProject(projectPath, tools, { force = false } = {}) {
  const root = await existingDirectory(projectPath);
  const normalizedTools = normalizeTools(tools);
  await assertNoSymlinkPath(root, CONFIG_PATH);
  await assertNoSymlinkPath(root, MANIFEST_PATH);
  const config = await readJsonIfPresent(root, CONFIG_PATH);
  const manifest = await readJsonIfPresent(root, MANIFEST_PATH);

  if (config) {
    assertSchema(config, CONFIG_PATH);
  }
  if (manifest) {
    assertSchema(manifest, MANIFEST_PATH);
  }
  const configuredTools = config ? normalizeTools(config.tools) : null;
  const installedTools = manifest ? normalizeTools(manifest.tools) : null;
  if (configuredTools && !sameArray(configuredTools, normalizedTools)) {
    throw new Error(
      `existing ${CONFIG_PATH} selects ${configuredTools.join(",")}; refusing to replace user-owned config`,
    );
  }
  if (installedTools && !sameArray(installedTools, normalizedTools)) {
    throw new Error(
      `existing install selects ${installedTools.join(",")}; use its configured tools`,
    );
  }

  const desired = await desiredFiles(normalizedTools);
  await preflightInstall(root, desired, manifest, force);
  await writeDesired(root, desired);
  for (const directory of FLOW_DIRECTORIES) {
    await assertNoSymlinkPath(root, directory);
    await fs.mkdir(resolveInside(root, directory), { recursive: true });
  }
  if (!config) {
    await writeJsonAtomic(root, CONFIG_PATH, {
      schemaVersion: SCHEMA_VERSION,
      tools: normalizedTools,
      flowRoot: "Flows",
    });
  }
  await writeManifest(root, normalizedTools, desired);
  return {
    action: "initialized",
    root,
    tools: normalizedTools,
    managedFiles: desired.size,
  };
}

export async function updateProject(projectPath, { force = false } = {}) {
  const root = await existingDirectory(projectPath);
  await assertNoSymlinkPath(root, CONFIG_PATH);
  await assertNoSymlinkPath(root, MANIFEST_PATH);
  const config = await requireJson(root, CONFIG_PATH);
  const manifest = await requireJson(root, MANIFEST_PATH);
  assertSchema(config, CONFIG_PATH);
  assertSchema(manifest, MANIFEST_PATH);
  const tools = normalizeTools(config.tools);
  const desired = await desiredFiles(tools);

  await assertInstalledFilesUnmodified(root, manifest, force);
  await preflightNewTargets(root, desired, manifest, force);

  const stale = Object.keys(manifest.managedFiles).filter(
    (relativePath) => !desired.has(relativePath),
  );
  for (const relativePath of stale) {
    await fs.rm(resolveInside(root, relativePath), { force: true });
  }
  await writeDesired(root, desired);
  await writeManifest(root, tools, desired);
  await removeEmptyManagedDirectories(root);
  return {
    action: "updated",
    root,
    tools,
    managedFiles: desired.size,
    removed: stale,
  };
}

export async function doctorProject(projectPath) {
  const root = await existingDirectory(projectPath);
  const issues = [];
  try {
    await assertNoSymlinkPath(root, CONFIG_PATH);
    await assertNoSymlinkPath(root, MANIFEST_PATH);
  } catch (error) {
    issues.push(error.message);
    return { ok: false, root, issues };
  }
  let config;
  let manifest;
  try {
    const candidate = await requireJson(root, CONFIG_PATH);
    assertSchema(candidate, CONFIG_PATH);
    config = candidate;
  } catch (error) {
    issues.push(error.message);
  }
  try {
    const candidate = await requireJson(root, MANIFEST_PATH);
    assertSchema(candidate, MANIFEST_PATH);
    manifest = candidate;
  } catch (error) {
    issues.push(error.message);
  }
  if (!config || !manifest) {
    return { ok: false, root, issues };
  }

  let tools;
  try {
    tools = normalizeTools(config.tools);
  } catch (error) {
    issues.push(`${CONFIG_PATH}: ${error.message}`);
    return { ok: false, root, issues };
  }
  if (!sameArray(tools, manifest.tools)) {
    issues.push("config tools differ from manifest tools");
  }

  const desired = await desiredFiles(tools);
  const manifestPaths = Object.keys(manifest.managedFiles).sort();
  const desiredPaths = [...desired.keys()].sort();
  if (!sameArray(manifestPaths, desiredPaths)) {
    issues.push("manifest managed file set differs from the current package");
  }

  for (const [relativePath, source] of desired) {
    try {
      await assertNoSymlinkPath(root, relativePath);
    } catch (error) {
      issues.push(error.message);
      continue;
    }
    const absolutePath = resolveInside(root, relativePath);
    const content = await readIfPresent(absolutePath);
    if (content === null) {
      issues.push(`${relativePath}: missing`);
      continue;
    }
    const actualHash = sha256(content);
    const installedHash = manifest.managedFiles[relativePath];
    if (!installedHash) {
      issues.push(`${relativePath}: absent from manifest`);
    } else if (actualHash !== installedHash) {
      issues.push(`${relativePath}: modified after installation`);
    }
    if (actualHash !== source.hash) {
      issues.push(`${relativePath}: differs from current package template`);
    }
    if (relativePath.endsWith(".md")) {
      issues.push(
        ...validateNormativeMarkdown(content, relativePath),
      );
    }
  }

  // Coverage is validated against the INSTALLED files: a modified glossary must
  // fail on its own content, not on the package template it no longer matches.
  const glossaryContent = await readIfPresent(
    resolveInside(root, ".sdd-flow/references/CLOJURE_NOTATION.md"),
  );
  if (glossaryContent !== null) {
    issues.push(...validateNotationCoverage(glossaryContent));
  }
  const examplesContent = await readIfPresent(
    resolveInside(root, ".sdd-flow/references/EXAMPLES.md"),
  );
  if (examplesContent !== null) {
    issues.push(...validateExampleCoverage(examplesContent));
  }

  for (const directory of FLOW_DIRECTORIES) {
    try {
      await assertNoSymlinkPath(root, directory);
    } catch (error) {
      issues.push(error.message);
      continue;
    }
    const stat = await statIfPresent(resolveInside(root, directory));
    if (!stat?.isDirectory()) {
      issues.push(`${directory}: missing directory`);
    }
  }

  return {
    ok: issues.length === 0,
    root,
    tools,
    managedFiles: desired.size,
    issues,
  };
}

export async function uninstallProject(projectPath) {
  const root = await existingDirectory(projectPath);
  await assertNoSymlinkPath(root, MANIFEST_PATH);
  const manifest = await requireJson(root, MANIFEST_PATH);
  assertSchema(manifest, MANIFEST_PATH);
  await assertInstalledFilesUnmodified(root, manifest, false, false);

  const removed = [];
  for (const relativePath of Object.keys(manifest.managedFiles)) {
    const absolutePath = resolveInside(root, relativePath);
    if (await exists(absolutePath)) {
      await fs.rm(absolutePath);
      removed.push(relativePath);
    }
  }
  await fs.rm(resolveInside(root, MANIFEST_PATH));
  await removeEmptyManagedDirectories(root);
  return {
    action: "uninstalled",
    root,
    removed,
    preserved: [CONFIG_PATH, ...FLOW_DIRECTORIES],
  };
}

export async function desiredFilePaths(tools) {
  return [...(await desiredFiles(normalizeTools(tools))).keys()].sort();
}

async function desiredFiles(tools) {
  const mappings = [...CORE_FILES];
  if (tools.includes("codex")) {
    mappings.push(...CODEX_FILES);
  }
  if (tools.includes("claude")) {
    mappings.push(...CLAUDE_FILES);
  }

  const desired = new Map();
  for (const [sourcePath, targetPath] of mappings) {
    const content = await fs.readFile(
      resolveInside(PACKAGE_ROOT, sourcePath),
      "utf8",
    );
    desired.set(targetPath, { content, hash: sha256(content), sourcePath });
  }
  return desired;
}

async function preflightInstall(root, desired, manifest, force) {
  if (manifest) {
    assertSchema(manifest, MANIFEST_PATH);
    await assertInstalledFilesUnmodified(root, manifest, force);
  }
  await preflightNewTargets(root, desired, manifest, force);
}

async function preflightNewTargets(root, desired, manifest, force) {
  const known = new Set(Object.keys(manifest?.managedFiles ?? {}));
  const conflicts = [];
  for (const [relativePath, source] of desired) {
    await assertNoSymlinkPath(root, relativePath);
    if (known.has(relativePath)) {
      continue;
    }
    const content = await readIfPresent(resolveInside(root, relativePath));
    if (content !== null && sha256(content) !== source.hash && !force) {
      conflicts.push(relativePath);
    }
  }
  if (conflicts.length > 0) {
    throw new Error(
      `refusing to overwrite existing files: ${conflicts.join(", ")}; rerun with --force`,
    );
  }
}

async function assertInstalledFilesUnmodified(
  root,
  manifest,
  force,
  forceAvailable = true,
) {
  const drift = [];
  for (const [relativePath, expectedHash] of Object.entries(
    manifest.managedFiles ?? {},
  )) {
    await assertNoSymlinkPath(root, relativePath);
    const content = await readIfPresent(resolveInside(root, relativePath));
    if (content !== null && sha256(content) !== expectedHash) {
      drift.push(relativePath);
    }
  }
  if (drift.length > 0 && !force) {
    const resolution = forceAvailable
      ? "rerun with --force"
      : "restore those files or remove them manually; nothing was removed";
    throw new Error(
      `modified managed files: ${drift.join(", ")}; ${resolution}`,
    );
  }
}

async function writeDesired(root, desired) {
  for (const [relativePath, source] of desired) {
    await writeTextAtomic(root, relativePath, source.content);
  }
}

async function writeManifest(root, tools, desired) {
  const managedFiles = {};
  for (const [relativePath, source] of desired) {
    managedFiles[relativePath] = source.hash;
  }
  await writeJsonAtomic(root, MANIFEST_PATH, {
    schemaVersion: SCHEMA_VERSION,
    packageName: PACKAGE_JSON.name,
    packageVersion: PACKAGE_JSON.version,
    tools,
    managedFiles,
  });
}

async function writeJsonAtomic(root, relativePath, value) {
  await writeTextAtomic(root, relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function writeTextAtomic(root, relativePath, content) {
  await assertNoSymlinkPath(root, relativePath);
  const destination = resolveInside(root, relativePath);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  const temporary = `${destination}.tmp-${process.pid}-${crypto.randomUUID()}`;
  try {
    await fs.writeFile(temporary, content, { flag: "wx" });
    await fs.rename(temporary, destination);
  } finally {
    await fs.rm(temporary, { force: true });
  }
}

async function readJsonIfPresent(root, relativePath) {
  const content = await readIfPresent(resolveInside(root, relativePath));
  if (content === null) {
    return null;
  }
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`${relativePath}: invalid JSON: ${error.message}`);
  }
}

async function requireJson(root, relativePath) {
  const value = await readJsonIfPresent(root, relativePath);
  if (!value) {
    throw new Error(`${relativePath}: missing; run sdd-flow init first`);
  }
  return value;
}

function assertSchema(value, relativePath) {
  if (value.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(
      `${relativePath}: unsupported schema ${String(value.schemaVersion)}`,
    );
  }
  if (
    relativePath === MANIFEST_PATH &&
    (typeof value.managedFiles !== "object" ||
      value.managedFiles === null ||
      Array.isArray(value.managedFiles))
  ) {
    throw new Error(`${relativePath}: managedFiles must be an object`);
  }
  if (
    (relativePath === CONFIG_PATH || relativePath === MANIFEST_PATH) &&
    !Array.isArray(value.tools)
  ) {
    throw new Error(`${relativePath}: tools must be an array`);
  }
}

async function existingDirectory(projectPath) {
  const root = path.resolve(projectPath);
  const stat = await statIfPresent(root);
  if (!stat?.isDirectory()) {
    throw new Error(`project path is not an existing directory: ${root}`);
  }
  return fs.realpath(root);
}

async function assertNoSymlinkPath(root, relativePath) {
  const absolutePath = resolveInside(root, relativePath);
  const relativeParts = path.relative(root, absolutePath).split(path.sep);
  let current = root;
  for (const part of relativeParts) {
    current = path.join(current, part);
    const stat = await lstatIfPresent(current);
    if (stat?.isSymbolicLink()) {
      throw new Error(
        `managed path traverses a symbolic link: ${path.relative(root, current)}`,
      );
    }
    if (!stat) {
      return;
    }
  }
}

function resolveInside(root, relativePath) {
  if (path.isAbsolute(relativePath)) {
    throw new Error(`managed path must be relative: ${relativePath}`);
  }
  const resolved = path.resolve(root, relativePath);
  const prefix = `${path.resolve(root)}${path.sep}`;
  if (!resolved.startsWith(prefix)) {
    throw new Error(`managed path escapes project root: ${relativePath}`);
  }
  return resolved;
}

async function removeEmptyManagedDirectories(root) {
  const directories = [
    ".agents/skills/sdd-clojure-flow/agents",
    ".agents/skills/sdd-clojure-flow",
    ".agents/skills/sdd-deep-research/agents",
    ".agents/skills/sdd-deep-research",
    ".agents/skills",
    ".agents",
    ".claude/commands/sdd-flow",
    ".claude/commands",
    ".claude/skills/sdd-clojure-flow",
    ".claude/skills/sdd-deep-research",
    ".claude/skills",
    ".claude",
    ".sdd-flow/references",
    ".sdd-flow/templates",
    ".sdd-flow",
  ];
  for (const relativePath of directories) {
    try {
      await fs.rmdir(resolveInside(root, relativePath));
    } catch (error) {
      if (error.code !== "ENOENT" && error.code !== "ENOTEMPTY") {
        throw error;
      }
    }
  }
}

async function readIfPresent(absolutePath) {
  try {
    return await fs.readFile(absolutePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function statIfPresent(absolutePath) {
  try {
    return await fs.stat(absolutePath);
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function lstatIfPresent(absolutePath) {
  try {
    return await fs.lstat(absolutePath);
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function exists(absolutePath) {
  return (await statIfPresent(absolutePath)) !== null;
}

function sha256(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function sameArray(left, right) {
  return (
    Array.isArray(left) &&
    Array.isArray(right) &&
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

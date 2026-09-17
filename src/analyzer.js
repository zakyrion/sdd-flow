// The analyzer — one target walked into diagnostics and the report the CLI
// prints. The target is a task folder, one artifact file, or a living S2; the
// walk is the same for all three: resolve the documents in chain order, split
// them into fences, read every fence with positions, tally the rules that need
// only the form, resolve what the schema knows into a model, and tally the
// rules that read one part of an artifact against another.

import fs from "node:fs/promises";
import { statSync } from "node:fs";
import path from "node:path";
import { RULES, SCHEMA } from "./analyzer-schema.js";
import { ClojureReaderError, readAll } from "./clojure-reader.js";
import { markdownBlocks } from "./document-validator.js";
import { canonicalize, readIfPresent } from "./project-adapter.js";

// The chain order a folder is read in, and the order the report is sorted by;
// CASCADE.md stands where S1.md would.
const CHAIN = ["FLOW.md", "CONTEXT.md", "S1.md", "CASCADE.md", "S2.md"];

const KIND_BY_FILE = {
  "FLOW.md": "flow",
  "CONTEXT.md": "context",
  "S1.md": "s1",
  "S2.md": "s2",
  "CASCADE.md": "cascade",
};

const DELTA_MARKS = new Set(SCHEMA.marks);

// Rules born after the legacy one-file cascade: on a CASCADE.md they tell how
// far the document stands from today's template, not what is wrong with it.
const BORN_AFTER_LEGACY = new Set([
  ":s2/typed",
  ":converge/level",
  ":converge/unknown-entry",
  ":converge/unaccounted",
  ":converge/tally",
]);

export async function lint(target, options = {}) {
  const textMode = options.text === true;
  const documents = [];
  const fences = [];
  const model = new Map();
  const diagnostics = [];

  const templateMode = templateModeOf(target);
  await resolveTarget(target, documents);
  splitFences(documents, fences);
  readFences(fences, diagnostics);
  checkForms(fences, templateMode, diagnostics);
  resolveModel(model, fences, documents, diagnostics);
  await resolveBase(target, model, documents, fences, diagnostics);
  tallyS1(model, diagnostics);
  tallyS2Data(model, diagnostics);
  checkSpine(model, diagnostics);
  checkSlices(model, diagnostics);
  relateS1ToS2(model, diagnostics);
  const effectiveS2 = applyDelta(model, diagnostics);
  checkConvergeAndVerdict(model, effectiveS2, diagnostics);
  checkGates(model, diagnostics);
  orderDiagnostics(documents, diagnostics);
  const report = render(diagnostics, textMode);

  return { action: "linted", diagnostics, report };
}

function templateModeOf(target) {
  return path
    .resolve(target)
    .split(path.sep)
    .some((segment) => segment === "templates");
}

async function resolveTarget(target, documents) {
  const resolved = path.resolve(target);
  let stats;
  try {
    stats = await fs.stat(resolved);
  } catch {
    throw new Error(`lint target does not exist: ${resolved}`);
  }

  const files = [];
  if (stats.isDirectory()) {
    // The same folder reached through a symlink lints under one path.
    const folder = await fs.realpath(resolved);
    for (const name of CHAIN) {
      files.push(path.join(folder, name));
    }
  } else {
    files.push(resolved);
  }

  for (const file of files) {
    const source = await readIfPresent(file);
    if (source === null) {
      continue;
    }
    const named = KIND_BY_FILE[path.basename(file)];
    const kind =
      named ?? (path.basename(path.dirname(file)) === "Specs" ? "spec" : "unknown");
    documents.push({ path: file, kind, role: "target", source });
  }

  if (documents.length === 0) {
    throw new Error(`lint target holds no artifact: ${resolved}`);
  }
}

function splitFences(documents, fences) {
  for (const document of documents) {
    const blocks = markdownBlocks(document.source);
    let heading = null;
    let stage = null;
    for (const block of blocks) {
      if (block.kind === "heading") {
        heading = block.text.trim();
        const reads = heading.toLowerCase();
        if (reads === "s1" || reads === "s2") {
          stage = reads;
        }
      } else if (block.kind === "fence") {
        fences.push({
          document,
          heading,
          stage,
          line: block.line,
          source: block.text,
        });
      }
    }
  }
}

function readFences(fences, diagnostics) {
  for (const fence of fences) {
    if (fence.source.trim() === "") {
      addDiagnostic(
        diagnostics,
        ":reader/empty-fence",
        fence.document.path,
        fence.line,
        "the fence holds only whitespace",
      );
      continue;
    }
    try {
      fence.forms = readAll(fence.source, { positions: true });
    } catch (error) {
      if (!(error instanceof ClojureReaderError)) {
        throw error;
      }
      fence.error = error;
      addDiagnostic(
        diagnostics,
        ":reader/parse",
        fence.document.path,
        fence.line + error.line,
        error.message,
      );
    }
  }
}

function addDiagnostic(diagnostics, ruleId, file, line, reason) {
  const row = RULES.find((candidate) => candidate.rule === ruleId);
  if (!row) {
    // The catalogue and this module are one unit: an unknown id is a
    // programming error, not an input.
    throw new Error(`no rule row for ${ruleId}`);
  }
  const legacy = path.basename(file) === "CASCADE.md" && BORN_AFTER_LEGACY.has(ruleId);
  diagnostics.push({ rule: ruleId, severity: legacy ? ":info" : row.severity, file, line, reason });
}

function lineOf(fence, node) {
  let newlines = 0;
  for (let index = 0; index < node.start; index += 1) {
    if (fence.source[index] === "\n") {
      newlines += 1;
    }
  }
  return fence.line + 1 + newlines;
}

function checkForms(fences, templateMode, diagnostics) {
  for (const fence of fences) {
    if (!fence.forms) {
      continue;
    }
    for (const form of fence.forms) {
      walkForm(form, (node) => {
        if (node.type === "metadata") {
          checkMetadataNode(node, fence, diagnostics);
        } else if (node.type === "map") {
          checkMapNode(node, fence, diagnostics);
        } else if (node.type === "list") {
          checkListNode(node, fence, diagnostics);
        } else if (node.type === "vector") {
          checkVectorNode(node, fence, diagnostics);
        } else if (
          node.type === "symbol" ||
          node.type === "keyword" ||
          node.type === "string"
        ) {
          checkAtomNode(node, fence, templateMode, diagnostics);
        }
      });
    }
  }
}

function walkForm(node, visit) {
  visit(node);
  if (
    node.type === "list" ||
    node.type === "vector" ||
    node.type === "set" ||
    node.type === "map"
  ) {
    for (const value of node.values) {
      walkForm(value, visit);
    }
  } else if (node.type === "metadata") {
    walkForm(node.metadata, visit);
    walkForm(node.value, visit);
  } else if (node.type === "quote") {
    walkForm(node.value, visit);
  }
}

function checkMetadataNode(node, fence, diagnostics) {
  if (node.value.type === "keyword") {
    addDiagnostic(
      diagnostics,
      ":form/metadata-on-keyword",
      fence.document.path,
      lineOf(fence, node),
      `the keyword ${node.value.value} carries no metadata`,
    );
  } else if (node.value.type === "string") {
    addDiagnostic(
      diagnostics,
      ":form/metadata-on-string",
      fence.document.path,
      lineOf(fence, node),
      `the string ${canonicalize(node.value)} carries no metadata`,
    );
  }
}

function checkMapNode(node, fence, diagnostics) {
  // ── duplicate keys, and the confidence range wherever a rating stands
  const seen = new Set();
  for (let index = 0; index + 1 < node.values.length; index += 2) {
    const key = node.values[index];
    const value = node.values[index + 1];
    const text = canonicalize(key);
    if (seen.has(text)) {
      addDiagnostic(
        diagnostics,
        ":form/duplicate-key",
        fence.document.path,
        lineOf(fence, key),
        `the key ${text} stands twice in one map`,
      );
    }
    seen.add(text);
    if (text === ":confidence" && !isRating(value)) {
      addDiagnostic(
        diagnostics,
        ":form/confidence-range",
        fence.document.path,
        lineOf(fence, value),
        `:confidence ${canonicalize(value)} is not an integer from 0 to 100`,
      );
    }
  }

  // ── the two gate rules that need only this map, so the copies in FLOW.md
  //    # Decisions are checked beside the artifact that decided them
  const decided = fieldOf(node, ":auto-decided");
  if (!decided || decided.type !== "literal" || decided.value !== "true") {
    return;
  }
  const options = fieldOf(node, ":options");
  if (!options || options.type !== "vector") {
    return;
  }
  const rated = [];
  for (const option of options.values) {
    const rating = fieldOf(option, ":confidence");
    if (!rating || !isRating(rating)) {
      continue; // :form/confidence-range has already reported it
    }
    rated.push({ text: fieldOf(option, ":option"), rating: Number(rating.value) });
  }
  if (rated.length === 0) {
    return;
  }

  const ratings = rated.map((option) => option.rating).sort((left, right) => right - left);
  const top = ratings[0];
  const chosen = fieldOf(node, ":chosen");
  const atTop = rated.filter((option) => option.rating === top);
  const said = chosen && chosen.type === "string" ? chosen.value : null;
  const named = said === null ? undefined : rated.find((option) => option.text && textOf(option.text) === said);
  if (named && !atTop.includes(named)) {
    addDiagnostic(
      diagnostics,
      ":gate/chosen-not-top",
      fence.document.path,
      lineOf(fence, node),
      `:chosen is not the :option rated ${top}`,
    );
  }
  if (top < 60) {
    addDiagnostic(
      diagnostics,
      ":gate/under-bar",
      fence.document.path,
      lineOf(fence, node),
      `the top rating ${top} is below 60 — this entry does not decide`,
    );
  } else if (ratings.length > 1 && top - ratings[1] <= 10) {
    addDiagnostic(
      diagnostics,
      ":gate/under-bar",
      fence.document.path,
      lineOf(fence, node),
      `the top two ratings ${top} and ${ratings[1]} lie within 10 — this entry does not decide`,
    );
  }
}

function isRating(node) {
  return (
    node.type === "number" &&
    /^\d+$/u.test(node.value) &&
    Number(node.value) >= 0 &&
    Number(node.value) <= 100
  );
}

function fieldOf(node, key) {
  if (node.type !== "map") {
    return null;
  }
  for (let index = 0; index + 1 < node.values.length; index += 2) {
    if (textOf(node.values[index]) === key) {
      return node.values[index + 1];
    }
  }
  return null;
}

function textOf(node) {
  return node.type === "string" ? node.value : canonicalize(node);
}

function checkListNode(node, fence, diagnostics) {
  if (node.values.length === 0) {
    return;
  }
  const head = node.values[0];
  const rest = node.values.slice(1);
  const line = lineOf(fence, node);
  const named = head.type === "symbol" ? head.value : head.type === "keyword" ? head.value : null;

  if (named === "when") {
    const second = rest[1];
    const thenShaped =
      second &&
      second.type === "list" &&
      second.values[0]?.type === "keyword" &&
      second.values[0].value === ":then";
    if (rest.length !== 2 || !thenShaped) {
      addDiagnostic(
        diagnostics,
        ":form/when-shape",
        fence.document.path,
        line,
        "when takes one condition and one (:then …) node",
      );
    }
    return;
  }

  if (named === "cond") {
    const elseAt = rest
      .map((form, index) => (form.type === "keyword" && form.value === ":else" ? index : -1))
      .filter((index) => index >= 0);
    const misplaced = elseAt.length > 1 || elseAt.some((index) => index !== rest.length - 2);
    if (rest.length % 2 !== 0 || misplaced) {
      addDiagnostic(
        diagnostics,
        ":form/cond-shape",
        fence.document.path,
        line,
        "cond takes test/result pairs, with :else at most once and only as the last test",
      );
    }
    return;
  }

  if (named === "and" || named === "or") {
    const acts = rest.some(
      (form) =>
        form.type === "list" &&
        form.values[0] &&
        ((form.values[0].type === "keyword" && form.values[0].value === ":then") ||
          (form.values[0].type === "symbol" && form.values[0].value.endsWith("!"))),
    );
    if (rest.length === 0 || acts) {
      addDiagnostic(
        diagnostics,
        ":form/and-or-shape",
        fence.document.path,
        line,
        `${named} holds conditions only, and at least one`,
      );
    }
    return;
  }

  if (named === ":then" && rest.length === 0) {
    addDiagnostic(
      diagnostics,
      ":form/then-shape",
      fence.document.path,
      line,
      ":then holds one or more ordered actions",
    );
  }
}

function checkVectorNode(node, fence, diagnostics) {
  for (const key of [":id", ":decision", ":slice"]) {
    const seen = new Set();
    for (const child of node.values) {
      const value = fieldOf(child, key);
      if (!value || value.type !== "keyword") {
        continue;
      }
      if (key === ":slice" && !fieldOf(child, ":carries")) {
        continue;
      }
      const text = textOf(value);
      if (seen.has(text)) {
        addDiagnostic(
          diagnostics,
          ":form/duplicate-id",
          fence.document.path,
          lineOf(fence, child),
          `${key} ${text} stands twice in one vector`,
        );
      }
      seen.add(text);
    }
  }
}

function checkAtomNode(node, fence, templateMode, diagnostics) {
  if (templateMode) {
    return;
  }
  // A keyword's name is its text after the leading colon, so :<x> is a
  // placeholder and :x is not.
  const name = node.type === "keyword" ? node.value.slice(1) : node.value;
  if (name.length > 1 && name.startsWith("<") && name.endsWith(">")) {
    addDiagnostic(
      diagnostics,
      ":form/placeholder",
      fence.document.path,
      lineOf(fence, node),
      `${name} is a template placeholder`,
    );
  }
  if (node.type === "symbol" && node.value === "?") {
    addDiagnostic(
      diagnostics,
      ":form/open-value",
      fence.document.path,
      lineOf(fence, node),
      "an open value ? still stands here",
    );
  }
}

function resolveModel(model, fences, documents, diagnostics) {
  for (const document of documents) {
    const kindRow = SCHEMA.kinds[document.kind];
    if (!kindRow) {
      addDiagnostic(
        diagnostics,
        ":schema/unknown-kind",
        document.path,
        1,
        `${path.basename(document.path)} is no document kind the schema knows`,
      );
      model.set(document.path, {
        path: document.path,
        kind: document.kind,
        sections: new Map(),
      });
      continue;
    }

    const sections = new Map();
    const unknownHeadings = new Set();
    for (const fence of fences) {
      if (fence.document !== document || fence.heading === null) {
        continue;
      }
      const sectionName = sectionNameOf(kindRow, fence);
      if (sectionName === null) {
        if (!unknownHeadings.has(fence.heading)) {
          unknownHeadings.add(fence.heading);
          addDiagnostic(
            diagnostics,
            ":schema/unknown-section",
            document.path,
            fence.line,
            `the heading ${fence.heading} is none the ${document.kind} kind knows`,
          );
        }
        continue;
      }
      const resolved = resolveSection(
        fence,
        { name: sectionName, ...kindRow.sections[sectionName] },
        diagnostics,
      );
      const standing = sections.get(sectionName);
      if (!standing) {
        sections.set(sectionName, resolved);
        continue;
      }
      standing.defs.push(...resolved.defs);
      for (const [kind, byName] of resolved.entries) {
        const held = standing.entries.get(kind) ?? new Map();
        for (const [name, entry] of byName) {
          held.set(name, entry);
        }
        standing.entries.set(kind, held);
      }
    }

    for (const [name, row] of Object.entries(kindRow.sections)) {
      if (row.required && !sections.has(name)) {
        addDiagnostic(
          diagnostics,
          ":schema/missing-section",
          document.path,
          1,
          `the ${document.kind} kind expects a ${name} section`,
        );
      }
    }

    model.set(document.path, { path: document.path, kind: document.kind, sections });
  }
}

function sectionNameOf(kindRow, fence) {
  const wanted = fence.heading.trim().toLowerCase();
  for (const name of Object.keys(kindRow.sections)) {
    const slash = name.indexOf("/");
    const stage = slash < 0 ? null : name.slice(0, slash);
    const heading = slash < 0 ? name : name.slice(slash + 1);
    if (heading.toLowerCase() !== wanted) {
      continue;
    }
    if (stage !== null && stage !== fence.stage) {
      continue;
    }
    return name;
  }
  return null;
}

function resolveSection(fence, sectionSchema, diagnostics) {
  const section = { name: sectionSchema.name, line: fence.line, defs: [], entries: new Map() };
  const made = [];

  for (const form of fence.forms ?? []) {
    const shape = matchingShape(sectionSchema.fences, form);
    if (!shape) {
      const written =
        form.type === "list" && form.values[1]?.type === "symbol"
          ? `def ${form.values[1].value}`
          : form.type;
      addDiagnostic(
        diagnostics,
        ":schema/unknown-section",
        fence.document.path,
        lineOf(fence, form),
        `a ${written} under ${sectionSchema.name} matches none of the section's fence shapes`,
      );
      continue;
    }

    if (shape.shape === "def-map") {
      section.defs.push(fence);
      const body = form.values[2];
      for (let index = 0; index + 1 < body.values.length; index += 2) {
        const value = body.values[index + 1];
        const marked =
          value.type === "metadata" && DELTA_MARKS.has(textOf(value.metadata));
        made.push({
          name: textOf(body.values[index]),
          kind: shape.entry,
          node: marked ? value.value : value,
          mark: marked ? textOf(value.metadata) : null,
        });
      }
    } else if (shape.shape === "def-algorithm") {
      section.defs.push(fence);
      const body = form.values[2];
      made.push({ name: textOf(form.values[1]), kind: shape.entry, node: body, mark: null });
      const data = fieldOf(body, ":data");
      if (data && data.type === "map") {
        for (let index = 0; index + 1 < data.values.length; index += 2) {
          made.push({
            name: textOf(data.values[index]),
            kind: "s1-data",
            node: data.values[index + 1],
            mark: null,
          });
        }
      }
      for (const step of stepsOf(fieldOf(body, ":flow"))) {
        const payload = step.values[step.values.length - 1];
        made.push({
          name: textOf(step.values[0]),
          kind: "step",
          node: payload,
          mark: null,
        });
      }
    } else if (shape.shape === "vector") {
      form.values.forEach((child, index) => {
        const named =
          fieldOf(child, ":id") ?? fieldOf(child, ":decision") ?? fieldOf(child, ":slice");
        made.push({
          name: named ? textOf(named) : String(index),
          kind: shape.entry,
          node: child,
          mark: null,
        });
      });
    } else {
      made.push({ name: sectionSchema.name, kind: shape.entry, node: form, mark: null });
    }
  }

  for (const raw of made) {
    const entry = resolveEntry(raw.name, raw.kind, raw.node, raw.mark, fence, diagnostics);
    const held = section.entries.get(entry.kind) ?? new Map();
    held.set(entry.name, entry);
    section.entries.set(entry.kind, held);
  }
  return section;
}

function matchingShape(shapes, form) {
  for (const shape of shapes) {
    if (shape.shape === "vector" && form.type === "vector") {
      return shape;
    }
    if (shape.shape === "map" && form.type === "map") {
      return shape;
    }
    if (shape.shape !== "def-map" && shape.shape !== "def-algorithm") {
      continue;
    }
    if (
      form.type !== "list" ||
      form.values.length < 3 ||
      form.values[0].type !== "symbol" ||
      form.values[0].value !== "def" ||
      form.values[1].type !== "symbol" ||
      form.values[2].type !== "map"
    ) {
      continue;
    }
    if (shape.suffix === null || form.values[1].value.endsWith(shape.suffix)) {
      return shape;
    }
  }
  return null;
}

function stepsOf(flow) {
  if (!flow || flow.type !== "list") {
    return [];
  }
  return flow.values
    .slice(1)
    .filter((step) => step.type === "list" && step.values[0]?.type === "keyword");
}

function resolveEntry(name, kind, node, mark, fence, diagnostics) {
  const entry = { name, kind, node, mark, fence, line: lineOf(fence, node) };
  checkEntryKeys(entry, diagnostics);
  return entry;
}

function checkEntryKeys(entry, diagnostics) {
  const kindRow = SCHEMA.entries[entry.kind];
  if (!kindRow) {
    return;
  }
  const file = entry.fence.document.path;
  const body = entry.node.type === "map" ? entry.node : { type: "map", values: [] };

  // A :changed or :removed body is judged whole by :delta/changed-body, and a
  // :deferred entry stands outside the tally.
  if (entry.mark === null || entry.mark === ":added") {
    for (const [key, row] of Object.entries(kindRow.keys)) {
      if (row.required && fieldOf(body, `:${key}`) === null) {
        addDiagnostic(
          diagnostics,
          ":schema/missing-key",
          file,
          entry.line,
          `${entry.name} lacks the required key :${key}`,
        );
      }
    }
  }

  const reported = new Set();
  for (let index = 0; index + 1 < body.values.length; index += 2) {
    const keyNode = body.values[index];
    const value = body.values[index + 1];
    const text = textOf(keyNode);
    const row = kindRow.keys[text.startsWith(":") ? text.slice(1) : text];
    if (!row) {
      if (!reported.has(text)) {
        reported.add(text);
        addDiagnostic(
          diagnostics,
          ":schema/unknown-key",
          file,
          lineOf(entry.fence, keyNode),
          `the ${entry.kind} entry kind does not know the key ${text}`,
        );
      }
      continue;
    }
    if (row.shape && !hasShape(value, row.shape)) {
      addDiagnostic(
        diagnostics,
        ":schema/value-shape",
        file,
        lineOf(entry.fence, value),
        `${text} takes a ${row.shape}`,
      );
    }
    if (row.enum && value.type === "keyword" && !row.enum.members.includes(value.value)) {
      addDiagnostic(
        diagnostics,
        ":schema/enum-value",
        file,
        lineOf(entry.fence, value),
        `${text} ${value.value} is none of ${row.enum.members.join(" ")}`,
      );
    }
  }
}

function hasShape(node, shape) {
  switch (shape) {
    case "set":
      return node.type === "set";
    case "keyword-or-none":
      return node.type === "keyword";
    case "symbol":
      return node.type === "symbol";
    case "map":
      return node.type === "map";
    case "vector":
      return node.type === "vector";
    case "string":
      return node.type === "string";
    case "flow":
      return (
        node.type === "list" &&
        node.values[0]?.type === "symbol" &&
        node.values[0].value === "->"
      );
    default:
      return true;
  }
}

async function resolveBase(target, model, documents, fences, diagnostics) {
  const livingS2 = livingS2Of(model);
  if (livingS2 === null) {
    return;
  }

  // Where the absence of the base is reported: the subject entry that named it.
  let subjectFile = documents[0]?.path ?? target;
  let subjectLine = 1;
  for (const documentModel of model.values()) {
    const subject = subjectEntryOf(documentModel);
    if (subject) {
      subjectFile = documentModel.path;
      subjectLine = subject.line;
      break;
    }
  }

  const baseRoot = baseRootOf(target);
  const resolved = path.isAbsolute(livingS2)
    ? livingS2
    : baseRoot === null
      ? null
      : path.resolve(baseRoot, livingS2);
  if (resolved !== null && documents.some((document) => document.path === resolved)) {
    return;
  }
  const source = resolved === null ? null : await readIfPresent(resolved);
  if (source === null) {
    addDiagnostic(
      diagnostics,
      ":delta/base-unreadable",
      subjectFile,
      subjectLine,
      `the living S2 ${livingS2} cannot be read — the delta and converge families over the base are not verified`,
    );
    return;
  }

  const baseDocuments = [{ path: resolved, kind: "spec", role: "base", source }];
  const baseFences = [];
  splitFences(baseDocuments, baseFences);
  readFences(baseFences, diagnostics);
  resolveModel(model, baseFences, baseDocuments, diagnostics);
  documents.push(...baseDocuments);
  fences.push(...baseFences);
}

function livingS2Of(model) {
  for (const documentModel of model.values()) {
    if (documentModel.kind !== "s2" && documentModel.kind !== "cascade") {
      continue;
    }
    const subject = subjectEntryOf(documentModel);
    if (!subject) {
      continue;
    }
    const value = fieldOf(subject.node, ":living-s2");
    if (value && value.type === "string") {
      return value.value;
    }
  }
  return null;
}

function subjectEntryOf(documentModel) {
  for (const section of documentModel.sections.values()) {
    const subject = section.entries.get("subject")?.values().next().value;
    if (subject) {
      return subject;
    }
  }
  return null;
}

function baseRootOf(target) {
  const resolved = path.resolve(target);
  let directory = statSync(resolved, { throwIfNoEntry: false })?.isDirectory()
    ? resolved
    : path.dirname(resolved);
  for (;;) {
    const flows = path.join(directory, "Flows");
    if (statSync(flows, { throwIfNoEntry: false })?.isDirectory()) {
      return directory;
    }
    const parent = path.dirname(directory);
    if (parent === directory) {
      return null;
    }
    directory = parent;
  }
}

function tallyS1(model, diagnostics) {
  for (const documentModel of model.values()) {
    for (const section of documentModel.sections.values()) {
      const algorithm = section.entries.get("s1-algorithm")?.values().next().value;
      if (!algorithm) {
        continue;
      }
      const dataEntries = section.entries.get("s1-data") ?? new Map();
      const stepEntries = section.entries.get("step") ?? new Map();
      const file = documentModel.path;

      // ── the action beside every step payload: what :hollow-step reads
      const flow = fieldOf(algorithm.node, ":flow");
      const actions = new Map();
      for (const step of stepsOf(flow)) {
        actions.set(textOf(step.values[0]), step.values[1] ?? null);
      }

      const named = new Set();
      for (const step of stepEntries.values()) {
        const state = fieldOf(step.node, ":state");
        if (!state || state.type !== "string" || state.value.trim() === "") {
          addDiagnostic(diagnostics, ":s1/state-named", file, step.line, `${step.name} leaves no named state`);
        }
        const writes = fieldOf(step.node, ":writes");
        const action = actions.get(step.name);
        const empty = !writes || writes.type !== "set" || writes.values.length === 0;
        if (empty && action?.type === "string" && fieldOf(step.node, ":world") === null) {
          addDiagnostic(diagnostics, ":s1/hollow-step", file, step.line, `${step.name} changes nothing and decides nothing`);
        }
        for (const key of [":reads", ":writes"]) {
          const set = fieldOf(step.node, key);
          for (const member of set?.type === "set" ? set.values : []) {
            const text = textOf(member);
            named.add(text);
            if (!dataEntries.has(text)) {
              addDiagnostic(diagnostics, ":s1/undeclared", file, step.line, `${key} names ${text}, which :data does not declare`);
            }
          }
        }
      }
      for (const [name, entry] of dataEntries) {
        if (!named.has(name)) {
          addDiagnostic(diagnostics, ":s1/orphan", file, entry.line, `no step reads or writes ${name}`);
        }
      }

      // ── a bare symbol inside :flow is decomposition leaking out of s2
      if (flow) {
        const heads = new Set();
        walkForm(flow, (node) => {
          if (node.type === "list" && node.values[0]?.type === "symbol") {
            const head = node.values[0].value;
            if (head === "->" || head === "cond") {
              heads.add(node.values[0]);
            }
          }
          if (node.type === "symbol" && !heads.has(node)) {
            addDiagnostic(diagnostics, ":s1/symbol-in-flow", file, lineOf(algorithm.fence, node), `the symbol ${node.value} stands inside :flow`);
          }
        });
      }
    }
  }
}

function tallyS2Data(model, diagnostics) {
  for (const documentModel of model.values()) {
    const section = s2SectionOf(documentModel);
    if (!section) {
      continue;
    }
    const file = documentModel.path;
    const methods = section.entries.get("method") ?? new Map();
    const dataEntries = section.entries.get("data") ?? new Map();
    const referenced = referencedKeys(section.entries);

    // ── the s2 data def: where a coverage miss stands
    let dataLine = section.line;
    for (const fence of section.defs) {
      for (const form of fence.forms ?? []) {
        if (form.type === "list" && form.values[1]?.value?.endsWith("-data")) {
          dataLine = lineOf(fence, form);
        }
      }
    }

    // ── undeclared and orphan keys, typed and unborn entries, one-step :run fields
    const numbers = new Set();
    for (const method of methods.values()) {
      const named = fieldOf(method.node, ":numbers");
      for (let index = 0; index + 1 < (named?.values.length ?? 0); index += 2) {
        numbers.add(textOf(named.values[index]));
      }
    }
    for (const key of referenced) {
      if (!dataEntries.has(key) && !numbers.has(key)) {
        addDiagnostic(diagnostics, ":s2/undeclared", file, dataLine, `${key} is named but the data def does not declare it`);
      }
    }
    for (const [name, entry] of dataEntries) {
      if (!referenced.has(name)) {
        addDiagnostic(diagnostics, ":s2/orphan", file, entry.line, `no method names ${name}`);
      }
      if (fieldOf(entry.node, ":type") === null && fieldOf(entry.node, ":shape") === null) {
        addDiagnostic(diagnostics, ":s2/typed", file, entry.line, `${name} carries neither :type nor :shape`);
      }
      if (fieldOf(entry.node, ":paired-with") !== null) {
        addDiagnostic(diagnostics, ":s2/unborn", file, entry.line, `${name} shares an index with another structure — an unborn type`);
      }
      const lives = fieldOf(entry.node, ":lives");
      if (lives && lives.type === "keyword" && lives.value === ":run") {
        const writers = writingSteps(section.entries, name);
        if (writers < 2) {
          addDiagnostic(diagnostics, ":s2/one-step-field", file, entry.line, `${name} lives :run but ${writers} spine step(s) write it`);
        }
      }
    }

    // ── how-semicolons, scratch-heavy methods, and :calls or :lives naming a real method
    for (const method of methods.values()) {
      const how = fieldOf(method.node, ":how");
      if (how && how.type === "string" && how.value.includes(";")) {
        addDiagnostic(diagnostics, ":s2/how-semicolon", file, method.line, `${method.name} hides steps in :how`);
      }
      const scratch = fieldOf(method.node, ":scratch");
      if (scratch && scratch.type === "set" && scratch.values.length >= 3) {
        addDiagnostic(diagnostics, ":s2/scratch-heavy", file, method.line, `${method.name} holds ${scratch.values.length} keys in :scratch`);
      }
      const calls = fieldOf(method.node, ":calls");
      for (const member of calls?.type === "set" ? calls.values : []) {
        if (member.type === "symbol" && !methods.has(member.value)) {
          addDiagnostic(diagnostics, ":s2/unknown-method", file, lineOf(method.fence, member), `:calls names ${member.value}, which is no method`);
        }
      }
    }
    for (const entry of dataEntries.values()) {
      const lives = fieldOf(entry.node, ":lives");
      if (lives && lives.type === "symbol" && !methods.has(lives.value)) {
        addDiagnostic(diagnostics, ":s2/unknown-method", file, lineOf(entry.fence, lives), `:lives names ${lives.value}, which is no method`);
      }
    }
  }
}

function s2SectionOf(documentModel) {
  for (const section of documentModel.sections.values()) {
    if (section.entries.has("method") || section.entries.has("data")) {
      return section;
    }
  }
  return null;
}

function referencedKeys(entries) {
  const referenced = new Set();
  for (const method of (entries.get("method") ?? new Map()).values()) {
    for (const key of [":in", ":writes", ":scratch"]) {
      const set = fieldOf(method.node, key);
      for (const member of set?.type === "set" ? set.values : []) {
        referenced.add(textOf(member));
      }
    }
    const out = fieldOf(method.node, ":out");
    if (out && out.type === "keyword" && out.value !== ":none") {
      referenced.add(out.value);
    }
    for (const step of stepsOf(fieldOf(method.node, ":flow"))) {
      const stepOut = fieldOf(step.values[step.values.length - 1], ":out");
      if (stepOut && stepOut.type === "keyword" && stepOut.value !== ":none") {
        referenced.add(stepOut.value);
      }
    }
  }
  for (const entry of (entries.get("data") ?? new Map()).values()) {
    const fields = fieldOf(entry.node, ":fields");
    for (let index = 0; index + 1 < (fields?.values.length ?? 0); index += 2) {
      referenced.add(textOf(fields.values[index + 1]));
    }
  }
  return referenced;
}

function writingSteps(entries, entryName) {
  const methods = entries.get("method") ?? new Map();
  let writerCount = 0;
  for (const method of methods.values()) {
    for (const step of stepsOf(fieldOf(method.node, ":flow"))) {
      const calls = fieldOf(step.values[step.values.length - 1], ":calls");
      if (!calls || calls.type !== "symbol") {
        continue;
      }
      for (const name of callsClosure(entries, calls.value)) {
        const writes = fieldOf(methods.get(name)?.node ?? { type: "nil" }, ":writes");
        const members = writes?.type === "set" ? writes.values : [];
        if (members.some((member) => textOf(member) === entryName)) {
          writerCount += 1;
          break;
        }
      }
    }
  }
  return writerCount;
}

function callsClosure(entries, entryName) {
  const methods = entries.get("method") ?? new Map();
  const closure = new Set();
  const worklist = [entryName];
  while (worklist.length > 0) {
    const name = worklist.pop();
    if (closure.has(name)) {
      continue;
    }
    closure.add(name);
    const calls = fieldOf(methods.get(name)?.node ?? { type: "nil" }, ":calls");
    for (const member of calls?.type === "set" ? calls.values : []) {
      if (member.type === "symbol") {
        worklist.push(member.value);
      }
    }
  }
  return closure;
}

function checkSpine(model, diagnostics) {
  for (const documentModel of model.values()) {
    const section = s2SectionOf(documentModel);
    if (!section) {
      continue;
    }
    const file = documentModel.path;
    const methods = section.entries.get("method") ?? new Map();
    const dataEntries = section.entries.get("data") ?? new Map();

    for (const method of methods.values()) {
      const steps = stepsOf(fieldOf(method.node, ":flow"));
      const payloads = steps.map((step) => step.values[step.values.length - 1]);
      if (!payloads.some((payload) => fieldOf(payload, ":calls") !== null)) {
        continue;
      }
      steps.forEach((step, index) => {
        const line = lineOf(method.fence, step);
        const calls = fieldOf(payloads[index], ":calls");
        const out = fieldOf(payloads[index], ":out");
        if (!calls || !out) {
          addDiagnostic(diagnostics, ":spine/step-without-call", file, line, `${textOf(step.values[0])} of ${method.name} is not a spine step`);
          return;
        }
        const called = calls.type === "symbol" ? methods.get(calls.value) : undefined;
        if (!called) {
          addDiagnostic(diagnostics, ":spine/unknown-method", file, line, `${textOf(calls)} is no method of this s2`);
          return;
        }
        if (out.type === "keyword" && out.value !== ":none" && !dataEntries.has(out.value)) {
          addDiagnostic(diagnostics, ":spine/undeclared-out", file, line, `${out.value} has no entry in the data def`);
        }
        const declared = fieldOf(called.node, ":out");
        if (declared && textOf(declared) !== textOf(out)) {
          addDiagnostic(diagnostics, ":spine/out-mismatch", file, line, `the step yields ${textOf(out)} while ${called.name} returns ${textOf(declared)}`);
        }
      });
    }
  }
}

function checkSlices(model, diagnostics) {
  for (const documentModel of model.values()) {
    for (const [name, section] of documentModel.sections) {
      if (name.slice(name.indexOf("/") + 1) !== "Slices") {
        continue;
      }
      const file = documentModel.path;
      const slices = [...(section.entries.get("slice") ?? new Map()).values()];
      const afters = new Map();
      for (const slice of slices) {
        const after = fieldOf(slice.node, ":after");
        afters.set(
          slice.name,
          (after?.type === "set" ? after.values : []).map((member) => textOf(member)),
        );
      }

      for (const slice of slices) {
        for (const member of afters.get(slice.name)) {
          if (!afters.has(member)) {
            addDiagnostic(diagnostics, ":slices/unknown-after", file, slice.line, `:after names ${member}, which is no slice`);
          }
        }
      }

      const settled = new Set();
      let cycleFound = false;
      for (const slice of slices) {
        if (cycleFound) {
          break;
        }
        const visiting = new Set();
        const walk = (name) => {
          if (visiting.has(name)) {
            return true;
          }
          if (settled.has(name) || !afters.has(name)) {
            return false;
          }
          visiting.add(name);
          const found = afters.get(name).some(walk);
          visiting.delete(name);
          settled.add(name);
          return found;
        };
        if (walk(slice.name)) {
          cycleFound = true;
          addDiagnostic(diagnostics, ":slices/cycle", file, slice.line, `${slice.name} stands in a cycle of :after`);
        }
      }

      const owners = new Map();
      for (const slice of slices) {
        const writes = fieldOf(slice.node, ":writes");
        for (const member of writes?.type === "set" ? writes.values : []) {
          const text = textOf(member);
          if (owners.has(text)) {
            addDiagnostic(diagnostics, ":slices/shared-file", file, slice.line, `${text} stands in the :writes of ${owners.get(text)} as well`);
          } else {
            owners.set(text, slice.name);
          }
        }
      }

      const s2 = s2SectionOf(documentModel);
      const methods = s2?.entries.get("method") ?? new Map();
      const dataEntries = s2?.entries.get("data") ?? new Map();
      for (const slice of slices) {
        const carries = fieldOf(slice.node, ":carries");
        for (const member of carries?.type === "set" ? carries.values : []) {
          const text = textOf(member);
          if (!methods.has(text) && !dataEntries.has(text)) {
            addDiagnostic(diagnostics, ":slices/unknown-carried", file, slice.line, `:carries names ${text}, which is no method and no data key`);
          }
        }
      }
    }
  }
}

function relateS1ToS2(model, diagnostics) {
  const target = targetDocumentOf(model);
  let s1Document = null;
  for (const documentModel of model.values()) {
    if (documentModel.kind === "s1" || documentModel.kind === "cascade") {
      s1Document = documentModel;
      break;
    }
  }
  let s1Section = null;
  for (const section of s1Document?.sections.values() ?? []) {
    if (section.entries.has("s1-algorithm")) {
      s1Section = section;
      break;
    }
  }
  const s2Section = target ? s2SectionOf(target) : null;

  if (!s1Section || !s2Section) {
    const alone = s1Section ? s1Document : target;
    if (alone) {
      addDiagnostic(diagnostics, ":schema/unverified-relation", alone.path, 1, s1Section ? "no s2 stands beside this s1 — the coverage family is not verified" : "no s1 stands beside this s2 — the coverage family is not verified");
    }
    return;
  }

  const file = target.path;
  let dataLine = s2Section.line;
  for (const fence of s2Section.defs) {
    for (const form of fence.forms ?? []) {
      if (form.type === "list" && form.values[1]?.value?.endsWith("-data")) {
        dataLine = lineOf(fence, form);
      }
    }
  }

  const s1Data = s1Section.entries.get("s1-data") ?? new Map();
  const s2Data = s2Section.entries.get("data") ?? new Map();
  const covered = new Map();
  for (const entry of s2Data.values()) {
    const from = fieldOf(entry.node, ":from-s1");
    if (from) {
      covered.set(textOf(from), entry);
    }
  }
  for (const name of s1Data.keys()) {
    if (!covered.has(name)) {
      addDiagnostic(diagnostics, ":s2/s1-coverage", file, dataLine, `no s2 entry names ${name} in :from-s1`);
    }
  }
  for (const [name, entry] of covered) {
    if (!s1Data.has(name)) {
      addDiagnostic(diagnostics, ":s2/s1-coverage", file, dataLine, `:from-s1 names ${name}, which the s1 :data lacks`);
      continue;
    }
    const here = fieldOf(entry.node, ":type");
    const there = fieldOf(s1Data.get(name).node, ":type");
    if (here && there && textOf(here) !== textOf(there)) {
      addDiagnostic(diagnostics, ":s2/type-drift", file, entry.line, `${entry.name} repeats ${textOf(here)} where s1 says ${textOf(there)}`);
    }
  }
}

function targetDocumentOf(model) {
  let spec = null;
  for (const documentModel of model.values()) {
    if (documentModel.kind === "s2" || documentModel.kind === "cascade") {
      return documentModel;
    }
    if (documentModel.kind === "spec" && spec === null) {
      spec = documentModel;
    }
  }
  return spec;
}

function applyDelta(model, diagnostics) {
  const effectiveS2 = { methods: new Map(), data: new Map() };
  const target = targetDocumentOf(model);
  const section = target ? s2SectionOf(target) : null;
  if (!section) {
    return effectiveS2;
  }
  const file = target.path;
  const methods = section.entries.get("method") ?? new Map();
  const dataEntries = section.entries.get("data") ?? new Map();

  let base = null;
  for (const documentModel of model.values()) {
    if (documentModel.kind === "spec" && documentModel !== target) {
      base = documentModel;
      break;
    }
  }

  // ── a mark written on the key instead of the value, and a mark in a spec
  for (const fence of section.defs) {
    for (const form of fence.forms ?? []) {
      const body = form.values[2];
      for (let index = 0; index + 1 < (body?.values.length ?? 0); index += 2) {
        const key = body.values[index];
        if (key.type === "metadata" && DELTA_MARKS.has(textOf(key.metadata))) {
          addDiagnostic(diagnostics, ":delta/mark-on-key", file, lineOf(fence, key), `${textOf(key.metadata)} stands on a key, not on the entry's value map`);
        }
      }
    }
  }
  if (target.kind === "spec") {
    for (const entry of [...methods.values(), ...dataEntries.values()]) {
      if (entry.mark !== null) {
        addDiagnostic(diagnostics, ":delta/mark-in-spec", file, entry.line, `${entry.mark} stands inside a living S2`);
      }
    }
  }

  // ── fold the base's entries with the task's marked ones into the effective s2
  const baseSection = base ? s2SectionOf(base) : null;
  for (const [kind, entries] of [
    ["methods", methods],
    ["data", dataEntries],
  ]) {
    const held = effectiveS2[kind];
    const fromBase =
      baseSection?.entries.get(kind === "methods" ? "method" : "data") ?? new Map();
    for (const [name, entry] of fromBase) {
      held.set(name, entry);
    }
    for (const [name, entry] of entries) {
      if (!baseSection) {
        if (entry.mark !== null) {
          addDiagnostic(diagnostics, ":delta/mark-without-base", file, entry.line, `${entry.mark} stands while the subject names no living S2`);
        }
        held.set(name, entry);
        continue;
      }
      if (entry.mark === ":added") {
        if (fromBase.has(name)) {
          addDiagnostic(diagnostics, ":delta/added-in-base", file, entry.line, `the base already holds ${name}`);
        }
        held.set(name, entry);
      } else if (entry.mark === ":changed") {
        if (!fromBase.has(name)) {
          addDiagnostic(diagnostics, ":delta/changed-absent", file, entry.line, `the base lacks ${name}`);
        }
        held.set(name, entry);
      } else if (entry.mark === ":removed") {
        if (!fromBase.has(name)) {
          addDiagnostic(diagnostics, ":delta/changed-absent", file, entry.line, `the base lacks ${name}`);
        }
        held.delete(name);
      } else if (entry.mark === ":deferred") {
        held.delete(name);
      } else {
        held.set(name, entry);
      }
    }
  }

  // ── a :changed entry's body must hold what its kind requires; a :deferred one, its :deferred-by
  const required = (entry) =>
    Object.entries(SCHEMA.entries[entry.kind]?.keys ?? {}).filter(([, row]) => row.required);
  for (const entry of [...methods.values(), ...dataEntries.values()]) {
    if (entry.mark === ":changed") {
      for (const [key] of required(entry)) {
        if (fieldOf(entry.node, `:${key}`) === null) {
          addDiagnostic(diagnostics, ":delta/changed-body", file, entry.line, `${entry.name} is :changed but its body lacks :${key}`);
        }
      }
    }
    if (entry.mark === ":deferred" && fieldOf(entry.node, ":deferred-by") === null) {
      addDiagnostic(diagnostics, ":delta/deferred-by", file, entry.line, `${entry.name} is :deferred without :deferred-by`);
    }
  }

  return effectiveS2;
}

function checkConvergeAndVerdict(model, effectiveS2, diagnostics) {
  const target = targetDocumentOf(model);
  if (!target) {
    return;
  }
  let converge = null;
  let verdictSection = null;
  for (const [name, section] of target.sections) {
    const bare = name.slice(name.indexOf("/") + 1);
    if (bare === "Converge") {
      converge = section;
    } else if (bare === "Verdict") {
      verdictSection = section;
    }
  }
  if (!converge) {
    return;
  }
  const file = target.path;
  const known = new Set([...effectiveS2.methods.keys(), ...effectiveS2.data.keys()]);
  let lastWholeClean = null;

  // ── tally every converge run's rows: accounted, classified, and the run's own counts
  for (const run of (converge.entries.get("converge-run") ?? new Map()).values()) {
    const rows = (fieldOf(run.node, ":entries")?.values ?? []).filter((row) => row.type === "map");
    const scope = fieldOf(run.node, ":scope");
    const counts = { partial: 0, absent: 0, contradicts: 0, unrequested: 0 };
    let classified = 0;
    const accountedFor = new Set();

    for (const row of rows) {
      const line = lineOf(run.fence, row);
      const subject = fieldOf(row, ":s2");
      const verdict = fieldOf(row, ":verdict");
      const name = subject ? textOf(subject) : null;
      if (name !== null) {
        accountedFor.add(name);
      }
      if (verdict) {
        classified += 1;
        const reading = textOf(verdict).slice(1);
        if (reading in counts) {
          counts[reading] += 1;
        }
      }
      const reading = verdict ? textOf(verdict) : null;
      if (name !== null && !known.has(name) && reading !== ":unrequested") {
        addDiagnostic(diagnostics, ":converge/unknown-entry", file, line, `${name} stands in no effective s2`);
      }
      if (reading !== null && reading !== ":present" && reading !== ":deferred" && fieldOf(row, ":level") === null) {
        addDiagnostic(diagnostics, ":converge/level", file, line, `a ${reading} row names no :level`);
      }
      const entry = effectiveS2.methods.get(name) ?? effectiveS2.data.get(name);
      const deferred = entry?.mark === ":deferred";
      if (reading === ":deferred" && !deferred) {
        addDiagnostic(diagnostics, ":converge/deferred-mark", file, line, `${name} is classified :deferred but carries no ^:deferred mark`);
      } else if (deferred && reading !== null && reading !== ":deferred") {
        addDiagnostic(diagnostics, ":converge/deferred-mark", file, line, `${name} carries ^:deferred but is classified ${reading}`);
      }
    }

    const whole = scope !== null && textOf(scope) === ":whole";
    const unaccounted = [...known].filter((name) => !accountedFor.has(name));
    if (whole) {
      for (const name of unaccounted) {
        addDiagnostic(diagnostics, ":converge/unaccounted", file, run.line, `${name} appears in no :entries row of this run`);
      }
    }

    const accounted = fieldOf(run.node, ":accounted");
    const declared = {
      entries: fieldOf(accounted ?? { type: "nil" }, ":entries"),
      classified: fieldOf(accounted ?? { type: "nil" }, ":classified"),
    };
    const off =
      ["partial", "absent", "contradicts", "unrequested"].some((name) => {
        const written = fieldOf(run.node, `:${name}`);
        return written && Number(written.value) !== counts[name];
      }) ||
      (declared.entries && Number(declared.entries.value) !== rows.length) ||
      (declared.classified && Number(declared.classified.value) !== classified);
    if (off) {
      addDiagnostic(diagnostics, ":converge/tally", file, run.line, "the run's counts differ from the counts over its :entries");
    }

    // Every entry accounted is the whole run's demand; a slice run answers
    // only for the entries it carries (step-2 scopes :converge/unaccounted the
    // same way).
    const computedClean =
      (!whole || unaccounted.length === 0) &&
      classified === rows.length &&
      counts.partial === 0 &&
      counts.absent === 0 &&
      counts.contradicts === 0 &&
      counts.unrequested === 0;
    const clean = fieldOf(run.node, ":clean");
    if (clean && clean.type === "literal" && (clean.value === "true") !== computedClean) {
      addDiagnostic(diagnostics, ":converge/clean", file, run.line, `:clean says ${clean.value} while the rows compute ${computedClean}`);
    }
    if (whole) {
      lastWholeClean = computedClean;
    }
  }

  // ── the verdict: every failure names a level, and conformance agrees with the last :whole run
  const verdict = verdictSection?.entries.get("verdict")?.values().next().value;
  if (!verdict) {
    return;
  }
  for (const row of fieldOf(verdict.node, ":failures")?.values ?? []) {
    if (row.type === "map" && fieldOf(row, ":level") === null) {
      addDiagnostic(diagnostics, ":verdict/failure-level", file, lineOf(verdict.fence, row), "a failure names no :level");
    }
  }
  const conformance = fieldOf(fieldOf(verdict.node, ":conformance") ?? { type: "nil" }, ":verdict");
  if (conformance && lastWholeClean !== null) {
    const said = textOf(conformance);
    if ((said === ":clean") !== lastWholeClean && (said === ":clean" || said === ":drifted")) {
      addDiagnostic(diagnostics, ":verdict/conformance", file, verdict.line, `:conformance says ${said} while the last :whole run computes ${lastWholeClean ? "clean" : "not clean"}`);
    }
  }
}

function checkGates(model, diagnostics) {
  for (const documentModel of model.values()) {
    for (const [name, section] of documentModel.sections) {
      const slash = name.indexOf("/");
      if (name.slice(slash + 1) !== "Gate") {
        continue;
      }
      const gate = section.entries.get("gate")?.values().next().value;
      if (!gate) {
        continue;
      }
      const decided = fieldOf(gate.node, ":auto-decided");
      if (!decided || decided.type !== "vector") {
        continue;
      }
      const stage = slash < 0 ? "" : name.slice(0, slash + 1);
      const contra = documentModel.sections.get(`${stage}Contra`);
      const ids = new Set((contra?.entries.get("contra") ?? new Map()).keys());
      for (const entry of decided.values) {
        const answers = fieldOf(entry, ":answers");
        if (answers && !ids.has(textOf(answers))) {
          addDiagnostic(diagnostics, ":gate/unknown-contra", documentModel.path, lineOf(gate.fence, entry), `:answers ${textOf(answers)} names no :id of the ${stage}Contra section`);
        }
      }
    }
  }
}

function orderDiagnostics(documents, diagnostics) {
  const order = new Map(documents.map((document, index) => [document.path, index]));
  const last = documents.length;
  diagnostics.sort((left, right) => {
    const byFile = (order.get(left.file) ?? last) - (order.get(right.file) ?? last);
    if (byFile !== 0) {
      return byFile;
    }
    if (left.line !== right.line) {
      return left.line - right.line;
    }
    if (left.rule !== right.rule) {
      return left.rule < right.rule ? -1 : 1;
    }
    if (left.reason !== right.reason) {
      return left.reason < right.reason ? -1 : 1;
    }
    return 0;
  });
}

function render(diagnostics, textMode) {
  if (textMode) {
    return diagnostics
      .map(
        (diagnostic) =>
          `${diagnostic.file}:${diagnostic.line}:${diagnostic.severity} ${diagnostic.rule} - ${diagnostic.reason}`,
      )
      .join("\n");
  }
  if (diagnostics.length === 0) {
    return "[]";
  }
  const rows = diagnostics.map(
    (diagnostic) =>
      `{:rule ${diagnostic.rule} :severity ${diagnostic.severity} :file ${JSON.stringify(diagnostic.file)} :line ${diagnostic.line} :reason ${JSON.stringify(diagnostic.reason)}}`,
  );
  return `[${rows.join("\n ")}]`;
}

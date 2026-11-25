// The analyzer — one target walked into diagnostics and the report the CLI
// prints. The target is a task folder or one document; the walk is the same
// for both: read every markdown document, split it into fences, read every
// fence with positions, and tally the rules that need only the form.
//
// Since 0.5.0 lint knows no document kinds. The staged cascade's schemas —
// the S1, S2, CONTEXT and living-S2 tallies — were retired with the stages:
// on real cascades most of their output measured distance from a template.

import fs from "node:fs/promises";
import path from "node:path";
import { RULES } from "./analyzer-rules.js";
import { ClojureReaderError, readAll } from "./clojure-reader.js";
import { markdownBlocks } from "./document-validator.js";
import { canonicalize, readIfPresent } from "./project-adapter.js";

export async function lint(target, options = {}) {
  const textMode = options.text === true;
  const documents = [];
  const fences = [];
  const diagnostics = [];

  const templateMode = templateModeOf(target);
  await resolveTarget(target, documents);
  splitFences(documents, fences);
  readFences(fences, diagnostics);
  checkForms(fences, templateMode, diagnostics);
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

// A folder is read as its markdown documents, FLOW.md first, then by name —
// the report follows the same order.
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
    const names = (await fs.readdir(folder, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => entry.name)
      .sort((left, right) => {
        if (left === "FLOW.md" || right === "FLOW.md") {
          return left === "FLOW.md" ? -1 : 1;
        }
        return left < right ? -1 : left > right ? 1 : 0;
      });
    for (const name of names) {
      files.push(path.join(folder, name));
    }
  } else {
    files.push(resolved);
  }

  for (const file of files) {
    const source = await readIfPresent(file);
    if (source !== null) {
      documents.push({ path: file, source });
    }
  }

  if (documents.length === 0) {
    throw new Error(`lint target holds no artifact: ${resolved}`);
  }
}

function splitFences(documents, fences) {
  for (const document of documents) {
    let heading = null;
    for (const block of markdownBlocks(document.source)) {
      if (block.kind === "heading") {
        heading = block.text.trim();
      } else if (block.kind === "fence") {
        fences.push({ document, heading, line: block.line, source: block.text });
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
  diagnostics.push({ rule: ruleId, severity: row.severity, file, line, reason });
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
          checkMapNode(node, fence, templateMode, diagnostics);
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

function checkMapNode(node, fence, templateMode, diagnostics) {
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

  checkRegisterEntry(node, fence, diagnostics);
  if (!templateMode) {
    checkProvenanceEntry(node, fence, diagnostics);
    checkAlgorithmTally(node, fence, diagnostics);
    checkStructureTally(node, fence, diagnostics);
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
    rated.push({ letter: fieldOf(option, ":id"), text: fieldOf(option, ":option"), rating: Number(rating.value) });
  }
  if (rated.length === 0) {
    return;
  }

  const ratings = rated.map((option) => option.rating).sort((left, right) => right - left);
  const top = ratings[0];
  const chosen = fieldOf(node, ":chosen");
  const atTop = rated.filter((option) => option.rating === top);
  // :chosen names its option by letter, or — in an older entry — by
  // repeating the option's text
  let named;
  if (chosen && chosen.type === "keyword") {
    named = rated.find((option) => option.letter && option.letter.type === "keyword" && option.letter.value === chosen.value);
  } else if (chosen && chosen.type === "string") {
    named = rated.find((option) => option.text && textOf(option.text) === chosen.value);
  }
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

// A register entry is recognized by its shape — an integer :id, the number
// the owner answers with, beside a :status. An older entry keyed by
// :decision is left as it stands.
function isRegisterEntry(node) {
  return integerOf(fieldOf(node, ":id")) !== null && fieldOf(node, ":status") !== null;
}

function integerOf(node) {
  return node && node.type === "number" && /^\d+$/u.test(node.value) ? Number(node.value) : null;
}

function checkRegisterEntry(node, fence, diagnostics) {
  if (!isRegisterEntry(node)) {
    return;
  }
  const letters = new Set();
  const options = fieldOf(node, ":options");
  if (options && options.type === "vector") {
    for (const option of options.values) {
      const letter = fieldOf(option, ":id");
      if (!letter || letter.type !== "keyword" || !fieldOf(option, ":confidence")) {
        addDiagnostic(
          diagnostics,
          ":register/option-shape",
          fence.document.path,
          lineOf(fence, option),
          "an option of this entry carries no letter under :id or no :confidence — the owner cannot answer with it",
        );
      }
      if (letter && letter.type === "keyword") {
        letters.add(letter.value);
      }
    }
  }

  const chosen = fieldOf(node, ":chosen");
  if (chosen && chosen.type === "keyword" && !letters.has(chosen.value)) {
    addDiagnostic(
      diagnostics,
      ":register/chosen-unknown",
      fence.document.path,
      lineOf(fence, chosen),
      `:chosen ${chosen.value} names no option of this entry`,
    );
  }

  const status = fieldOf(node, ":status");
  const quote = fieldOf(node, ":verified-by");
  if (
    status.type === "keyword" &&
    status.value === ":confirmed" &&
    (!quote || quote.type !== "string" || quote.value.trim() === "")
  ) {
    addDiagnostic(
      diagnostics,
      ":register/confirmed-unquoted",
      fence.document.path,
      lineOf(fence, node),
      "a confirmed entry carries no :verified-by quoting the owner",
    );
  }
  if (
    status.type === "keyword" &&
    status.value === ":open" &&
    chosen !== null &&
    !(chosen.type === "symbol" && chosen.value === "?")
  ) {
    addDiagnostic(
      diagnostics,
      ":register/chosen-open",
      fence.document.path,
      lineOf(fence, node),
      "an :open register entry already carries :chosen — close :status to :confirmed or :auto",
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
  for (const key of [":id", ":decision", ":part"]) {
    const seen = new Set();
    for (const child of node.values) {
      const value = fieldOf(child, key);
      if (!value || value.type !== "keyword") {
        continue;
      }
      if (key === ":part" && !fieldOf(child, ":carries")) {
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

  // ── the register: a number stands once per round, and a later round
  //    names its new fact and follows an earlier one
  const numbered = node.values
    .map((child) => ({ child, id: integerOf(fieldOf(child, ":id")), round: fieldOf(child, ":round") }))
    .filter((entry) => entry.id !== null);
  const rounds = new Set();
  for (const entry of numbered) {
    const round = entry.round ? integerOf(entry.round) ?? 1 : 1;
    const key = `${entry.id}@${round}`;
    if (rounds.has(key)) {
      addDiagnostic(
        diagnostics,
        ":form/duplicate-id",
        fence.document.path,
        lineOf(fence, entry.child),
        `:id ${entry.id} stands twice in one vector at round ${round}`,
      );
    }
    rounds.add(key);
  }
  for (const entry of numbered) {
    if (!entry.round) {
      continue;
    }
    const round = integerOf(entry.round) ?? 1;
    const fact = fieldOf(entry.child, ":new-fact");
    const earlier = numbered.some(
      (other) => other.id === entry.id && (other.round ? integerOf(other.round) ?? 1 : 1) < round,
    );
    if (!fact || fact.type !== "string" || fact.value.trim() === "") {
      addDiagnostic(
        diagnostics,
        ":register/revisit-shape",
        fence.document.path,
        lineOf(fence, entry.child),
        `round ${round} of :id ${entry.id} names no :new-fact — a revisit says what is new`,
      );
    }
    if (!earlier) {
      addDiagnostic(
        diagnostics,
        ":register/revisit-shape",
        fence.document.path,
        lineOf(fence, entry.child),
        `round ${round} of :id ${entry.id} follows no earlier round of the same number`,
      );
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


function isPlaceholderText(text) {
  const clean = text.startsWith(":") ? text.slice(1) : text;
  return clean.length > 1 && clean.startsWith("<") && clean.endsWith(">");
}

function checkProvenanceEntry(node, fence, diagnostics) {
  const isFinding = fieldOf(node, ":finding") !== null && fieldOf(node, ":fact") !== null;
  const isAttempt = fieldOf(node, ":approach") !== null && fieldOf(node, ":dropped-because") !== null;
  if (!isFinding && !isAttempt) {
    return;
  }
  const anchor = isFinding ? fieldOf(node, ":fact") : fieldOf(node, ":approach");
  if (anchor && ((anchor.type === "symbol" && anchor.value === "?") || isPlaceholderText(textOf(anchor)))) {
    return;
  }
  const verifiedBy = fieldOf(node, ":verified-by") ?? fieldOf(node, ":source");
  if (!verifiedBy || verifiedBy.type !== "string" || verifiedBy.value.trim() === "") {
    addDiagnostic(
      diagnostics,
      ":provenance/missing-ground",
      fence.document.path,
      lineOf(fence, node),
      isFinding
        ? "a finding carries no :verified-by or :source stating how it was established"
        : "an attempted approach carries no :verified-by stating how its failure was observed",
    );
  }
}

function checkAlgorithmTally(node, fence, diagnostics) {
  const dataNode = fieldOf(node, ":data");
  const flowNode = fieldOf(node, ":flow");
  if (
    !dataNode ||
    dataNode.type !== "map" ||
    !flowNode ||
    flowNode.type !== "list" ||
    (!fieldOf(node, ":makes") && !fieldOf(node, ":criterion"))
  ) {
    return;
  }

  const declared = new Map();
  for (let i = 0; i + 1 < dataNode.values.length; i += 2) {
    const k = dataNode.values[i];
    if (k.type !== "keyword") continue;
    if (isPlaceholderText(k.value)) return;
    declared.set(k.value, k);
  }
  if (declared.size === 0) {
    return;
  }

  const used = new Set();
  let sawStepDetail = false;
  walkForm(flowNode, (sub) => {
    if (sub.type !== "map") return;
    for (const key of [":reads", ":writes"]) {
      const col = fieldOf(sub, key);
      if (!col || (col.type !== "set" && col.type !== "vector")) continue;
      sawStepDetail = true;
      for (const item of col.values) {
        if (item.type !== "keyword" || item.value === ":none" || isPlaceholderText(item.value)) {
          continue;
        }
        used.add(item.value);
        if (!declared.has(item.value)) {
          addDiagnostic(
            diagnostics,
            ":tally/undeclared-data",
            fence.document.path,
            lineOf(fence, item),
            `${item.value} in ${key} has no entry in :data`,
          );
        }
      }
    }
  });

  if (sawStepDetail) {
    for (const [keyName, keyNode] of declared) {
      if (!used.has(keyName)) {
        addDiagnostic(
          diagnostics,
          ":tally/orphan-data",
          fence.document.path,
          lineOf(fence, keyNode),
          `${keyName} in :data is touched by no step's :reads or :writes`,
        );
      }
    }
  }
}

function checkStructureTally(node, fence, diagnostics) {
  const prefixes = [];
  for (let i = 0; i + 1 < node.values.length; i += 2) {
    const k = node.values[i];
    const v = node.values[i + 1];
    if (k.type === "keyword" && k.value.endsWith("/data") && v.type === "map") {
      const prefix = k.value.slice(0, -"/data".length);
      if (isPlaceholderText(prefix)) continue;
      if (fieldOf(node, `${prefix}/entry`) || fieldOf(node, `${prefix}/methods`)) {
        prefixes.push({ prefix, dataNode: v });
      }
    }
  }

  for (const { prefix, dataNode } of prefixes) {
    const declared = new Map();
    for (let i = 0; i + 1 < dataNode.values.length; i += 2) {
      const k = dataNode.values[i];
      if (k.type !== "keyword") continue;
      if (isPlaceholderText(k.value)) return;
      declared.set(k.value, k);
    }
    if (declared.size === 0) continue;

    const used = new Set();
    const recordRef = (kwNode, role) => {
      if (!kwNode || kwNode.type !== "keyword" || kwNode.value === ":none" || isPlaceholderText(kwNode.value)) {
        return;
      }
      used.add(kwNode.value);
      if (!declared.has(kwNode.value)) {
        addDiagnostic(
          diagnostics,
          ":tally/undeclared-data",
          fence.document.path,
          lineOf(fence, kwNode),
          `${kwNode.value} in ${role} has no entry in ${prefix}/data`,
        );
      }
    };

    const scanCallableMap = (callable) => {
      if (!callable || callable.type !== "map") return;
      for (const colKey of [":in", ":writes"]) {
        const col = fieldOf(callable, colKey);
        if (col && (col.type === "set" || col.type === "vector")) {
          for (const item of col.values) recordRef(item, colKey);
        }
      }
      recordRef(fieldOf(callable, ":out"), ":out");
      const flow = fieldOf(callable, ":flow");
      if (flow) {
        walkForm(flow, (sub) => {
          if (sub.type === "map") {
            recordRef(fieldOf(sub, ":out"), ":out");
          }
        });
      }
    };

    scanCallableMap(fieldOf(node, `${prefix}/entry`));
    const methods = fieldOf(node, `${prefix}/methods`);
    if (methods && methods.type === "map") {
      for (let i = 1; i < methods.values.length; i += 2) {
        scanCallableMap(methods.values[i]);
      }
    }
    for (let i = 1; i < dataNode.values.length; i += 2) {
      const entryMap = dataNode.values[i];
      const fieldsMap = fieldOf(entryMap, ":fields");
      if (fieldsMap && fieldsMap.type === "map") {
        for (let j = 1; j < fieldsMap.values.length; j += 2) {
          recordRef(fieldsMap.values[j], ":fields");
        }
      }
    }

    for (const [keyName, keyNode] of declared) {
      if (!used.has(keyName)) {
        addDiagnostic(
          diagnostics,
          ":tally/orphan-data",
          fence.document.path,
          lineOf(fence, keyNode),
          `${keyName} in ${prefix}/data is referenced nowhere in ${prefix}/entry or ${prefix}/methods`,
        );
      }
    }
  }
}

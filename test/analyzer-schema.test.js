import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { RULES, SCHEMA } from "../src/analyzer-schema.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Pulls the field names a (def cascade-fields) sub-map declares out of
// .sdd-flow/references/CLOJURE_NOTATION.md, by scanning the balanced-brace
// block that follows "<label> {" and collecting every ":key "-style field
// definition inside it. A heuristic over one file this test reads itself,
// not a general Clojure reader.
function fieldsOf(source, label) {
  const start = source.indexOf(`${label} {`);
  assert.ok(start >= 0, `${label} not found in CLOJURE_NOTATION.md`);
  const braceStart = source.indexOf("{", start);
  let depth = 0;
  let end = braceStart;
  for (let i = braceStart; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    else if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  const block = source.slice(braceStart, end + 1);
  const fields = new Set();
  // A field definition line reads ":key <value>" where <value> opens with a
  // quote, a brace, a bracket, or is the bare boolean true/false — unlike a
  // keyword mentioned inside a description string, which is never followed
  // by whitespace and then one of those openers.
  for (const match of block.matchAll(/:([a-zA-Z][\w-]*)\s+(?=["{[]|true\b|false\b)/g)) {
    fields.add(match[1]);
  }
  return fields;
}

test("RULES transcribes the 66-row catalogue of S1.md (def flow-analyzer-rules)", () => {
  assert.equal(RULES.length, 66);
  const byEye = RULES.filter((row) => row.computed === false).map((row) => row.rule);
  assert.deepEqual(byEye.sort(), [
    ":s1/guard-occasion",
    ":s1/name-vs-state",
    ":s1/untouched-input",
  ]);
  assert.equal(RULES.filter((row) => row.computed === true).length, 63);
});

test("every RULES row carries the five rule-row keys with the right shape", () => {
  const validOn = new Set(["fence", "any", "s1", "s2", "spec"]);
  const validSeverity = new Set([":error", ":warning", ":info"]);
  for (const row of RULES) {
    assert.equal(typeof row.rule, "string");
    assert.match(row.rule, /^:[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/, `${row.rule} is not a namespaced keyword text`);
    assert.ok(validOn.has(row.on), `${row.rule} has an unknown :on ${row.on}`);
    assert.ok(validSeverity.has(row.severity), `${row.rule} has an unknown :severity ${row.severity}`);
    assert.equal(typeof row.tally, "string");
    assert.ok(row.tally.length > 0);
    assert.equal(typeof row.from, "string");
    assert.ok(row.from.length > 0);
    assert.equal(typeof row.computed, "boolean");
  }
});

test("every RULES row id is unique", () => {
  const ids = RULES.map((row) => row.rule);
  assert.equal(new Set(ids).size, ids.length);
});

test("SCHEMA declares the four delta marks as keyword text", () => {
  assert.deepEqual(SCHEMA.marks, [":added", ":changed", ":removed", ":deferred"]);
});

test("SCHEMA.kinds names exactly the six document kinds", () => {
  assert.deepEqual(Object.keys(SCHEMA.kinds).sort(), ["cascade", "context", "flow", "s1", "s2", "spec"]);
  assert.equal(SCHEMA.kinds.flow.file, "FLOW.md");
  assert.equal(SCHEMA.kinds.context.file, "CONTEXT.md");
  assert.equal(SCHEMA.kinds.s1.file, "S1.md");
  assert.equal(SCHEMA.kinds.s2.file, "S2.md");
  assert.equal(SCHEMA.kinds.cascade.file, "CASCADE.md");
  assert.equal(SCHEMA.kinds.spec.file, null);
});

test("FLOW's section table is empty — the :form family alone reaches it", () => {
  assert.deepEqual(SCHEMA.kinds.flow.sections, {});
});

test("context requires every section of its template", () => {
  const sections = SCHEMA.kinds.context.sections;
  assert.deepEqual(
    Object.keys(sections).sort(),
    ["Complete", "Facts", "Gotchas", "Occasions", "Reads", "Search", "Task", "Verification"].sort(),
  );
  for (const [name, row] of Object.entries(sections)) {
    assert.equal(row.required, true, `${name} should be required`);
  }
});

test("s1 requires Subject, s1, Contra and Gate", () => {
  const sections = SCHEMA.kinds.s1.sections;
  assert.deepEqual(Object.keys(sections).sort(), ["Contra", "Gate", "Subject", "s1"].sort());
  for (const row of Object.values(sections)) assert.equal(row.required, true);
});

test("s2 requires Subject, s2, Contra, Slices and Gate; Read-back/Converge/Verdict/Calibration are never missing", () => {
  const sections = SCHEMA.kinds.s2.sections;
  for (const name of ["Subject", "s2", "Contra", "Slices", "Gate"]) {
    assert.equal(sections[name].required, true, `${name} should be required`);
  }
  for (const name of ["Read-back", "Converge", "Verdict", "Calibration"]) {
    assert.equal(sections[name].required, false, `${name} should not be required`);
  }
});

test("s2's # s2 section admits the methods def, the data def and the tally map", () => {
  const fences = SCHEMA.kinds.s2.sections.s2.fences;
  assert.deepEqual(
    fences.map((fence) => fence.shape).sort(),
    ["def-map", "def-map", "map"],
  );
  const methodsFence = fences.find((fence) => fence.suffix === "-methods");
  const dataFence = fences.find((fence) => fence.suffix === "-data");
  assert.equal(methodsFence.entry, "method");
  assert.equal(dataFence.entry, "data");
  const tallyFence = fences.find((fence) => fence.suffix === null && fence.shape === "map");
  assert.equal(tallyFence.entry, "tally");
});

test("s2's # Slices section resolves its vector to the slice kind and its bare map to the one-runner kind — not the same kind (S2.md :schema slice, the :unrequested run of 2026-09-17)", () => {
  const fences = SCHEMA.kinds.s2.sections.Slices.fences;
  const vectorFence = fences.find((fence) => fence.shape === "vector");
  const mapFence = fences.find((fence) => fence.shape === "map");
  assert.equal(vectorFence.entry, "slice");
  assert.equal(mapFence.entry, "one-runner");
  assert.notEqual(vectorFence.entry, mapFence.entry);
});

test("the one-runner entry kind carries a single, non-required key named one-runner, shaped as a map — {:one-runner {:confidence N}} cannot carry the slice kind's five required keys", () => {
  const keys = SCHEMA.entries["one-runner"].keys;
  assert.deepEqual(Object.keys(keys), ["one-runner"]);
  assert.equal(keys["one-runner"].required, false);
  assert.equal(keys["one-runner"].shape, "map");
});

test("cascade is the union of s1's and s2's sections, keyed by stage", () => {
  const sections = SCHEMA.kinds.cascade.sections;
  for (const name of Object.keys(SCHEMA.kinds.s1.sections)) {
    assert.ok(`s1/${name}` in sections, `s1/${name} missing from cascade`);
    assert.deepEqual(sections[`s1/${name}`], SCHEMA.kinds.s1.sections[name]);
  }
  for (const name of Object.keys(SCHEMA.kinds.s2.sections)) {
    assert.ok(`s2/${name}` in sections, `s2/${name} missing from cascade`);
    assert.deepEqual(sections[`s2/${name}`], SCHEMA.kinds.s2.sections[name]);
  }
  assert.equal(
    Object.keys(sections).length,
    Object.keys(SCHEMA.kinds.s1.sections).length + Object.keys(SCHEMA.kinds.s2.sections).length,
  );
});

test("spec carries the s2 section only, shared with s2's own table", () => {
  assert.deepEqual(Object.keys(SCHEMA.kinds.spec.sections), ["s2"]);
  assert.equal(SCHEMA.kinds.spec.sections.s2.required, true);
  assert.deepEqual(SCHEMA.kinds.spec.sections.s2.fences, SCHEMA.kinds.s2.sections.s2.fences);
});

test("every entry kind's keys map is a plain object of key -> {required, shape?, enum?}", () => {
  for (const [kind, row] of Object.entries(SCHEMA.entries)) {
    assert.ok(row.keys && typeof row.keys === "object", `${kind} has no keys map`);
    for (const [key, spec] of Object.entries(row.keys)) {
      assert.ok(spec && typeof spec === "object", `${kind}.${key} is not an object`);
      assert.equal(typeof spec.required, "boolean", `${kind}.${key} required flag is not boolean`);
    }
  }
});

test(":schema/missing-key's nine entry kinds require exactly the keys the rule names", () => {
  const requiredOf = (kind) =>
    Object.entries(SCHEMA.entries[kind].keys)
      .filter(([, spec]) => spec.required)
      .map(([key]) => key)
      .sort();

  assert.deepEqual(requiredOf("method"), ["does", "in", "out"].sort());
  assert.deepEqual(requiredOf("data"), ["as", "lives"].sort());
  assert.deepEqual(requiredOf("s1-data"), ["from", "holds", "type"].sort());
  assert.deepEqual(requiredOf("step"), ["reads", "writes"].sort());
  assert.deepEqual(requiredOf("contra"), ["case", "fails", "fix", "id", "kills"].sort());
  assert.deepEqual(requiredOf("slice"), ["after", "carries", "confidence", "slice", "writes"].sort());
  assert.deepEqual(
    requiredOf("auto-decided"),
    ["auto-decided", "because", "chosen", "confidence", "id", "options"].sort(),
  );
  assert.deepEqual(requiredOf("converge-entry"), ["code", "s2", "verdict"].sort());
  assert.deepEqual(requiredOf("verdict"), ["behavior", "conformance", "failures"].sort());
});

test("the tally kind knows :steps-visible beside :spine-reads — (def spine) :meter names it, and this S2.md's own tally map carries it", () => {
  assert.ok("steps-visible" in SCHEMA.entries.tally.keys, "tally is missing steps-visible");
  assert.equal(SCHEMA.entries.tally.keys["steps-visible"].required, false);
});

test("the verdict kind knows :at — the template's own # Verdict carries it, even though cascade-fields :verdict does not name it", () => {
  assert.ok("at" in SCHEMA.entries.verdict.keys, "verdict is missing at");
  assert.equal(SCHEMA.entries.verdict.keys.at.required, false);
});

test("the converge-run kind knows :slice, :owner-resolution and :owner — a :scope :slice record names its slice, and an owner-resolution record settles one left :resolved-by :open", () => {
  const keys = SCHEMA.entries["converge-run"].keys;
  assert.ok("slice" in keys, "converge-run is missing slice");
  assert.ok("owner-resolution" in keys, "converge-run is missing owner-resolution");
  assert.ok("owner" in keys, "converge-run is missing owner");
  assert.equal(keys.slice.required, false);
  assert.equal(keys["owner-resolution"].required, false);
  assert.equal(keys["owner-resolution"].shape, "vector");
  assert.equal(keys.owner.required, false);
  assert.equal(keys.owner.shape, "string");
});

// Every entry kind that declares `key` in its keys map, paired with what it
// holds under `field` (shape or enum) — since both are now read per entry
// kind, not from one global table keyed by key name alone.
function perKind(key, field) {
  const found = [];
  for (const [kind, row] of Object.entries(SCHEMA.entries)) {
    if (key in row.keys) found.push([kind, row.keys[key][field]]);
  }
  assert.ok(found.length > 0, `${key} is not declared by any entry kind`);
  return found;
}

test(":schema/value-shape's key -> shape table matches the rule's text, in every entry kind that carries the key", () => {
  for (const key of ["reads", "writes", "in", "scratch", "calls", "exits", "after", "carries"]) {
    for (const [kind, shape] of perKind(key, "shape")) assert.equal(shape, "set", `${kind}.${key}`);
  }
  for (const [kind, shape] of perKind("out", "shape")) assert.equal(shape, "keyword-or-none", `${kind}.out`);
  for (const [kind, shape] of perKind("type", "shape")) assert.equal(shape, "symbol", `${kind}.type`);
  for (const [kind, shape] of perKind("as", "shape")) assert.equal(shape, "symbol", `${kind}.as`);
  for (const [kind, shape] of perKind("fields", "shape")) assert.equal(shape, "map", `${kind}.fields`);
  for (const [kind, shape] of perKind("numbers", "shape")) assert.equal(shape, "map", `${kind}.numbers`);
  for (const key of ["options", "fix", "entries", "failures"]) {
    for (const [kind, shape] of perKind(key, "shape")) assert.equal(shape, "vector", `${kind}.${key}`);
  }
  // subject also declares a key named "flow" — the FLOW.md path string, not
  // an s1/s2 :flow pipeline — so only the two entry kinds where :flow means
  // the pipeline carry the "flow" shape; subject.flow carries none.
  for (const kind of ["s1-algorithm", "method"]) {
    assert.equal(SCHEMA.entries[kind].keys.flow.shape, "flow", `${kind}.flow`);
  }
  assert.equal(SCHEMA.entries.subject.keys.flow.shape, undefined, "subject.flow");
  for (const key of ["does", "how", "state", "holds"]) {
    for (const [kind, shape] of perKind(key, "shape")) assert.equal(shape, "string", `${kind}.${key}`);
  }
});

test(":schema/enum-value's key -> enum table matches the rule's text, in every entry kind that carries the key", () => {
  for (const [kind, en] of perKind("lives", "enum")) {
    assert.deepEqual(en, { members: [":run", ":external"], alsoSymbol: true }, kind);
  }
  for (const [kind, en] of perKind("verdict", "enum")) {
    assert.deepEqual(en.members, [":present", ":partial", ":absent", ":contradicts", ":unrequested", ":deferred"], kind);
  }
  for (const [kind, en] of perKind("level", "enum")) {
    assert.deepEqual(en.members, [":context", ":s1", ":s2", ":code"], kind);
  }
  for (const [kind, en] of perKind("scope", "enum")) {
    assert.deepEqual(en.members, [":slice", ":whole"], kind);
  }
  for (const [kind, en] of perKind("mode", "enum")) {
    assert.deepEqual(en.members, [":step", ":auto"], kind);
  }
  for (const [kind, en] of perKind("auto-to", "enum")) {
    assert.deepEqual(en.members, [":s2", ":code"], kind);
  }
  for (const [kind, en] of perKind("read", "enum")) {
    assert.deepEqual(en.members, [":whole", ":section"], kind);
  }
  for (const [kind, en] of perKind("is", "enum")) {
    assert.deepEqual(en.members, [":number-source", ":type-source", ":integration-point", ":example"], kind);
  }
  for (const [kind, en] of perKind("conformance", "enum")) {
    assert.deepEqual(en.members, [":clean", ":drifted"], kind);
  }
  for (const [kind, en] of perKind("behavior", "enum")) {
    assert.deepEqual(en.members, [":met", ":failed", ":pending"], kind);
  }
});

test("the :verdict key can carry a different enum per entry kind — the structural reason for the per-kind table", () => {
  // converge-entry.verdict is the converge-run verdict enum; no other entry
  // kind in this schema currently names a key "verdict" with a different
  // enum, but the table is keyed by entry kind precisely so one could,
  // without colliding with this one (S2.md # Converge, :schema slice
  // owner-resolution).
  assert.deepEqual(SCHEMA.entries["converge-entry"].keys.verdict.enum.members, [
    ":present", ":partial", ":absent", ":contradicts", ":unrequested", ":deferred",
  ]);
  assert.equal(SCHEMA.keyEnums, undefined);
  assert.equal(SCHEMA.keyShapes, undefined);
});

test("every key SCHEMA declares for method, data, slice, auto-decided, gotcha, converge-entry and verdict reads in CLOJURE_NOTATION.md (def cascade-fields)", async () => {
  const notation = await fs.readFile(path.join(ROOT, ".sdd-flow/references/CLOJURE_NOTATION.md"), "utf8");
  const pairs = [
    ["method", ":s2-method"],
    ["data", ":s2-data"],
    ["slice", ":slice"],
    ["auto-decided", ":auto-decided"],
    ["gotcha", ":gotcha"],
    ["converge-entry", ":converge-entry"],
    ["verdict", ":verdict"],
  ];
  // ^:from-code — keys real template sections carry that the canonical
  // glossary does not yet name (S2.md # Converge :schema slice, the
  // :unrequested run of 2026-09-17): the template's own # Verdict opens
  // with :at, the same way every other artifact section does, but
  // CLOJURE_NOTATION.md's (def cascade-fields) :verdict block lists only
  // :conformance, :behavior, :failures and :deferred. The gap is in the
  // notation file, not in SCHEMA, so it is named here rather than closed by
  // adding a field this slice may not touch.
  const notYetInCanon = { verdict: new Set(["at"]) };
  for (const [entryKind, label] of pairs) {
    const known = fieldsOf(notation, label);
    const exceptions = notYetInCanon[entryKind] ?? new Set();
    for (const key of Object.keys(SCHEMA.entries[entryKind].keys)) {
      if (exceptions.has(key)) {
        continue;
      }
      assert.ok(known.has(key), `SCHEMA.entries.${entryKind} key ${key} has no reading under ${label} in CLOJURE_NOTATION.md`);
    }
  }
});

test("SCHEMA.entries.subject knows at least the keys (def cascade-fields) :subject declares", async () => {
  const notation = await fs.readFile(path.join(ROOT, ".sdd-flow/references/CLOJURE_NOTATION.md"), "utf8");
  const known = fieldsOf(notation, ":subject");
  for (const key of known) {
    assert.ok(key in SCHEMA.entries.subject.keys, `SCHEMA.entries.subject is missing ${key} from cascade-fields :subject`);
  }
});

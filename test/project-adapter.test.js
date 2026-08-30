import assert from "node:assert/strict";
import test from "node:test";
import {
  adapterFileSets,
  canonicalize,
  clojureFences,
  definitions,
  stripBlocks,
} from "../src/project-adapter.js";
import { readAll } from "../src/clojure-reader.js";

const DOCUMENT = [
  "# Canon",
  "",
  "```clojure",
  "(def go-contract",
  "  {:authorizes \"only the confirmed map\"})",
  "```",
  "",
  "prose the reader never sees",
  "",
  "```clojure",
  "(def local-rule  ;; a comment",
  "  {:home \"here\"})",
  "```",
].join("\n");

test("fences and definitions are read out of a markdown document", () => {
  assert.equal(clojureFences(DOCUMENT).length, 2);
  const found = definitions(DOCUMENT);
  assert.deepEqual([...found.keys()], ["go-contract", "local-rule"]);
});

test("comments and whitespace do not count as drift, content does", () => {
  const plain = definitions("```clojure\n(def r {:a 1})\n```");
  const noisy = definitions(
    "```clojure\n(def r   ;; why\n  {:a   1})\n```",
  );
  assert.equal(plain.get("r"), noisy.get("r"));

  const changed = definitions("```clojure\n(def r {:a 2})\n```");
  assert.notEqual(plain.get("r"), changed.get("r"));
});

test("canonicalize keeps every form the notation defines", () => {
  const [form] = readAll("(def x {:set #{:a} :vec [1] :meta ^:new S :q '-> :s \"t\"})");
  const text = canonicalize(form);
  for (const fragment of ["#{:a}", "[1]", "^:new S", "'->", '"t"']) {
    assert.ok(text.includes(fragment), `${fragment} missing from ${text}`);
  }
});

test("adapter file sets are collected wherever they are declared", () => {
  const adapter = [
    "```clojure",
    '{:files #{"CLAUDE.md" "AGENTS.md"} :status :fork}',
    "```",
    "```clojure",
    '{:nested {:footprint #{"README.md"}}}',
    "```",
    "```clojure",
    "{:files ?}",
    "```",
  ].join("\n");
  const sets = adapterFileSets(adapter);
  assert.deepEqual(sets.canonCopy.sort(), ["AGENTS.md", "CLAUDE.md"]);
  assert.deepEqual(sets.footprint, ["README.md"]);
});

test("stripBlocks removes only the marked region", () => {
  const content = [
    "keep one",
    "<!-- BEGIN SDD-FLOW: pointer -->",
    "generated line",
    "<!-- END SDD-FLOW: pointer -->",
    "keep two",
  ].join("\n");
  const result = stripBlocks(content);
  assert.deepEqual(result.removed, ["pointer"]);
  assert.equal(result.content, "keep one\nkeep two");
});

test("an unclosed marked block fails loudly instead of eating the file", () => {
  assert.throws(
    () => stripBlocks("a\n<!-- BEGIN SDD-FLOW: x -->\nb"),
    /unclosed sdd-flow block x/,
  );
});

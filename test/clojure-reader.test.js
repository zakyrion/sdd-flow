import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { readAll } from "../src/clojure-reader.js";
import {
  validateExampleCoverage,
  validateNormativeMarkdown,
  validateNotationCoverage,
} from "../src/document-validator.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("reader accepts every canonical normative Clojure form", async () => {
  // Canonical normative sources live under templates/; the root README is
  // user-facing prose, and installed copies are validated by the doctor tests.
  const markdownFiles = await findMarkdown(path.join(ROOT, "templates"));
  assert.ok(markdownFiles.length >= 9);
  for (const file of markdownFiles) {
    const content = await fs.readFile(file, "utf8");
    const issues = validateNormativeMarkdown(
      content,
      path.relative(ROOT, file),
    );
    assert.deepEqual(issues, [], issues.join("\n"));
  }
});

test("reader supports the canonized :quote form", () => {
  const [form] = readAll("'->");
  assert.equal(form.type, "quote");
  assert.deepEqual(form.value, { type: "symbol", value: "->" });
});

test("reader rejects incomplete and malformed forms", () => {
  assert.throws(() => readAll("{:task :broken"), /Expected closing delimiter/);
  assert.throws(() => readAll("{:task}"), /even number of forms/);
  assert.throws(() => readAll('(when true "unterminated)'), /Unterminated string/);
  assert.throws(() => readAll("#unknown"), /Unsupported reader macro/);
});

test("readAll leaves nodes without start or end when positions is not requested", () => {
  const [form] = readAll("{:a 1}");
  assert.equal(form.start, undefined);
  assert.equal(form.end, undefined);
});

test("readAll attaches start and end offsets to every node in positions mode", () => {
  const source = "{:a 1}";
  const [form] = readAll(source, { positions: true });
  assert.equal(form.type, "map");
  assert.equal(form.start, 0);
  assert.equal(form.end, source.length);

  const [keyNode, valueNode] = form.values;
  assert.equal(keyNode.type, "keyword");
  assert.equal(keyNode.start, 1);
  assert.equal(keyNode.end, 3);
  assert.equal(valueNode.type, "number");
  assert.equal(valueNode.start, 4);
  assert.equal(valueNode.end, 5);
});

test("positions mode stamps the caret for metadata and the quote character for quote", () => {
  const metaSource = "^:new value";
  const [metaForm] = readAll(metaSource, { positions: true });
  assert.equal(metaForm.type, "metadata");
  assert.equal(metaForm.start, 0);
  assert.equal(metaForm.end, metaSource.length);

  const quoteSource = "'->";
  const [quoteForm] = readAll(quoteSource, { positions: true });
  assert.equal(quoteForm.type, "quote");
  assert.equal(quoteForm.start, 0);
  assert.equal(quoteForm.end, quoteSource.length);
});

test("glossary defines all forms and examples cover normalization and conditions", async () => {
  const glossary = await fs.readFile(
    path.join(
      ROOT,
      "templates/core/references/CLOJURE_NOTATION.md",
    ),
    "utf8",
  );
  const examples = await fs.readFile(
    path.join(ROOT, "templates/core/references/EXAMPLES.md"),
    "utf8",
  );
  assert.deepEqual(validateNotationCoverage(glossary), []);
  assert.deepEqual(validateExampleCoverage(examples), []);

  const firstExample = examples.indexOf(":input");
  assert.ok(firstExample >= 0);
  assert.ok(examples.indexOf(":normalized", firstExample) > firstExample);
  assert.match(examples, /:unknown \?/u);
  assert.match(examples, /:by-naming-policy/u);
});

async function findMarkdown(root) {
  const result = [];
  const entries = await fs.readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    if (["node_modules", ".git"].includes(entry.name)) {
      continue;
    }
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) {
      result.push(...(await findMarkdown(absolute)));
    } else if (entry.name.endsWith(".md")) {
      result.push(absolute);
    }
  }
  return result;
}

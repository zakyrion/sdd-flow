import assert from "node:assert/strict";
import test from "node:test";
import {
  markdownBlocks,
  validateNormativeMarkdown,
} from "../src/document-validator.js";

test("markdownBlocks walks headings, prose and a closed fence in line order", () => {
  const source = [
    "# Title",
    "",
    "some prose line",
    "```clojure",
    "{:a 1}",
    "```",
  ].join("\n");
  const blocks = markdownBlocks(source);
  assert.deepEqual(blocks, [
    { kind: "heading", line: 1, text: "Title", closed: true },
    { kind: "prose", line: 3, text: "", closed: true },
    { kind: "fence", line: 4, text: "{:a 1}", closed: true },
  ]);
});

test("markdownBlocks skips blank lines outside a fence", () => {
  const source = ["", "   ", "prose"].join("\n");
  const blocks = markdownBlocks(source);
  assert.deepEqual(blocks, [{ kind: "prose", line: 3, text: "", closed: true }]);
});

test("markdownBlocks reads a closed frontmatter block, then resumes the walk", () => {
  const source = ["---", "title: x", "---", "# Heading"].join("\n");
  const blocks = markdownBlocks(source);
  assert.deepEqual(blocks, [
    { kind: "frontmatter", line: 1, text: "", closed: true },
    { kind: "heading", line: 4, text: "Heading", closed: true },
  ]);
});

test("markdownBlocks yields a single unclosed frontmatter block and stops", () => {
  const source = ["---", "title: x", "no closing marker"].join("\n");
  const blocks = markdownBlocks(source);
  assert.deepEqual(blocks, [
    { kind: "frontmatter", line: 1, text: "", closed: false },
  ]);
});

test("markdownBlocks yields an unclosed fence block at end of document", () => {
  const source = ["```clojure", "{:a 1}"].join("\n");
  const blocks = markdownBlocks(source);
  assert.deepEqual(blocks, [
    { kind: "fence", line: 1, text: "{:a 1}", closed: false },
  ]);
});

test("markdownBlocks matches the fence marker exactly, with no trimming", () => {
  const source = ["```clojure ", "{:a 1}", "```"].join("\n");
  const blocks = markdownBlocks(source);
  // "```clojure " (trailing space) never opens a fence, so every line —
  // including the closing "```" — is read outside any fence, as prose.
  assert.deepEqual(blocks, [
    { kind: "prose", line: 1, text: "", closed: true },
    { kind: "prose", line: 2, text: "", closed: true },
    { kind: "prose", line: 3, text: "", closed: true },
  ]);
});

test("markdownBlocks accepts CRLF line endings", () => {
  const source = "# Heading\r\nprose\r\n";
  const blocks = markdownBlocks(source);
  assert.deepEqual(blocks, [
    { kind: "heading", line: 1, text: "Heading", closed: true },
    { kind: "prose", line: 2, text: "", closed: true },
  ]);
});

test("validateNormativeMarkdown reports prose outside a fence", () => {
  const issues = validateNormativeMarkdown("plain text\n", "doc.md");
  assert.deepEqual(issues, [
    "doc.md:1: normative prose must be inside a Clojure form",
  ]);
});

test("validateNormativeMarkdown reports an empty Clojure fence", () => {
  const source = ["```clojure", "   ", "```"].join("\n");
  const issues = validateNormativeMarkdown(source, "doc.md");
  assert.deepEqual(issues, ["doc.md:1: empty Clojure fence"]);
});

test("validateNormativeMarkdown reports the reader's error at the fence line", () => {
  const source = ["```clojure", "{:a", "```"].join("\n");
  const issues = validateNormativeMarkdown(source, "doc.md");
  assert.equal(issues.length, 1);
  assert.match(issues[0], /^doc\.md:1: /u);
});

test("validateNormativeMarkdown reports an unterminated Clojure fence", () => {
  const source = ["```clojure", "{:a 1}"].join("\n");
  const issues = validateNormativeMarkdown(source, "doc.md");
  assert.deepEqual(issues, ["doc.md:1: unterminated Clojure fence"]);
});

test("validateNormativeMarkdown reports unterminated frontmatter alone, with no line number", () => {
  const source = ["---", "title: x", "prose that would otherwise fault"].join(
    "\n",
  );
  const issues = validateNormativeMarkdown(source, "doc.md");
  assert.deepEqual(issues, ["doc.md: unterminated YAML frontmatter"]);
});

test("validateNormativeMarkdown accepts a well-formed document with no issues", () => {
  const source = [
    "---",
    "title: x",
    "---",
    "# Heading",
    "",
    "```clojure",
    "{:a 1}",
    "```",
  ].join("\n");
  assert.deepEqual(validateNormativeMarkdown(source, "doc.md"), []);
});

test("validateNormativeMarkdown defaults fileName to <document>", () => {
  const issues = validateNormativeMarkdown("prose\n");
  assert.deepEqual(issues, [
    "<document>:1: normative prose must be inside a Clojure form",
  ]);
});

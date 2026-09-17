import { readAll } from "./clojure-reader.js";

export const REQUIRED_NOTATION_NAMES = [
  ":map",
  ":vector",
  ":set",
  ":keyword",
  ":symbol",
  ":string",
  ":comment",
  ":metadata",
  ":open-value",
  ":proposed-value",
  ":definition",
  ":labeled-node",
  ":quote",
  ":pipeline",
  ":branch",
  ":conditional-action",
  ":all-conditions",
  ":any-condition",
  ":ordered-actions",
  ":mutation",
  ":predicate",
  ":action-node",
];

export const REQUIRED_CONDITIONAL_MARKERS = [
  "(when",
  "(and",
  "(or",
  "(:then",
  "(cond",
  ":else",
];

export function markdownBlocks(source) {
  const lines = source.split(/\r?\n/u);
  const blocks = [];
  let index = 0;

  if (lines[0] === "---") {
    let closeIndex = 1;
    while (closeIndex < lines.length && lines[closeIndex] !== "---") {
      closeIndex += 1;
    }
    const closed = closeIndex < lines.length;
    blocks.push({ kind: "frontmatter", line: 1, text: "", closed });
    index = closed ? closeIndex + 1 : lines.length;
  }

  let inFence = false;
  let fenceStart = 0;
  let buffer = [];

  for (; index < lines.length; index += 1) {
    const line = lines[index];
    const lineNumber = index + 1;
    if (!inFence) {
      if (line === "```clojure") {
        inFence = true;
        fenceStart = lineNumber;
        buffer = [];
      } else if (/^#{1,6}\s+\S/u.test(line)) {
        blocks.push({
          kind: "heading",
          line: lineNumber,
          text: line.replace(/^#{1,6}\s+/u, ""),
          closed: true,
        });
      } else if (line.trim() !== "") {
        blocks.push({ kind: "prose", line: lineNumber, text: "", closed: true });
      }
    } else if (line === "```") {
      blocks.push({
        kind: "fence",
        line: fenceStart,
        text: buffer.join("\n"),
        closed: true,
      });
      inFence = false;
      buffer = [];
    } else {
      buffer.push(line);
    }
  }

  if (inFence) {
    blocks.push({
      kind: "fence",
      line: fenceStart,
      text: buffer.join("\n"),
      closed: false,
    });
  }

  return blocks;
}

export function validateNormativeMarkdown(content, fileName = "<document>") {
  const blocks = markdownBlocks(content);
  const issues = [];

  for (const block of blocks) {
    if (block.kind === "frontmatter") {
      if (!block.closed) {
        return [`${fileName}: unterminated YAML frontmatter`];
      }
    } else if (block.kind === "prose") {
      issues.push(
        `${fileName}:${block.line}: normative prose must be inside a Clojure form`,
      );
    } else if (block.kind === "fence") {
      if (!block.closed) {
        issues.push(`${fileName}:${block.line}: unterminated Clojure fence`);
      } else if (block.text.trim() === "") {
        issues.push(`${fileName}:${block.line}: empty Clojure fence`);
      } else {
        try {
          readAll(block.text);
        } catch (error) {
          issues.push(`${fileName}:${block.line}: ${error.message}`);
        }
      }
    }
  }

  return issues;
}

export function validateNotationCoverage(glossary) {
  const issues = [];
  for (const marker of REQUIRED_NOTATION_NAMES) {
    if (!glossary.includes(`:name ${marker}`)) {
      issues.push(`CLOJURE_NOTATION.md: missing canonical form ${marker}`);
    }
  }
  return issues;
}

export function validateExampleCoverage(examples) {
  const issues = [];
  for (const marker of REQUIRED_CONDITIONAL_MARKERS) {
    if (!examples.includes(marker)) {
      issues.push(`EXAMPLES.md: missing conditional marker ${marker}`);
    }
  }
  for (const marker of [":input", ":normalized", ":unknown ?", ":by-naming-policy"]) {
    if (!examples.includes(marker)) {
      issues.push(`EXAMPLES.md: missing normalization marker ${marker}`);
    }
  }
  return issues;
}

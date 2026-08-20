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

export function validateNormativeMarkdown(content, fileName = "<document>") {
  const issues = [];
  const lines = content.split(/\r?\n/u);
  let index = 0;

  if (lines[0] === "---") {
    index = 1;
    while (index < lines.length && lines[index] !== "---") {
      index += 1;
    }
    if (index >= lines.length) {
      return [`${fileName}: unterminated YAML frontmatter`];
    }
    index += 1;
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
      } else if (
        line.trim() !== "" &&
        !/^#{1,6}\s+\S/u.test(line)
      ) {
        issues.push(
          `${fileName}:${lineNumber}: normative prose must be inside a Clojure form`,
        );
      }
    } else if (line === "```") {
      if (buffer.join("\n").trim() === "") {
        issues.push(`${fileName}:${fenceStart}: empty Clojure fence`);
      } else {
        try {
          readAll(buffer.join("\n"));
        } catch (error) {
          issues.push(`${fileName}:${fenceStart}: ${error.message}`);
        }
      }
      inFence = false;
      buffer = [];
    } else {
      buffer.push(line);
    }
  }

  if (inFence) {
    issues.push(`${fileName}:${fenceStart}: unterminated Clojure fence`);
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

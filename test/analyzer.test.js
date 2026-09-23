import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { RULES } from "../src/analyzer-rules.js";
import { readAll } from "../src/clojure-reader.js";
import { lint } from "../src/analyzer.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURES = path.join(ROOT, "test", "fixtures");

// test/fixtures/<family>-<name>/ holds the synthetic document that breaks
// :<family>/<name>, and nothing else.
const computedRules = RULES.filter((row) => row.computed);

function fixtureOf(rule) {
  return path.join(FIXTURES, rule.slice(1).replace("/", "-"));
}

for (const row of computedRules) {
  test(`${row.rule} has a fixture that breaks it, and breaks nothing else`, async () => {
    const result = await lint(fixtureOf(row.rule));
    const reported = result.diagnostics.map((diagnostic) => diagnostic.rule);
    assert.ok(
      reported.includes(row.rule),
      `${row.rule} is not reported over its fixture; got ${JSON.stringify([...new Set(reported)])}`,
    );
    const allowed = new Set([row.rule]);
    const stray = [...new Set(reported)].filter((rule) => !allowed.has(rule));
    assert.deepEqual(stray, [], `${row.rule}'s fixture also breaks ${JSON.stringify(stray)}`);
    for (const diagnostic of result.diagnostics) {
      if (diagnostic.rule === row.rule) {
        assert.equal(diagnostic.severity, row.severity);
        assert.ok(diagnostic.line >= 1);
        assert.ok(diagnostic.reason.length > 0);
      }
    }
  });
}

test("every fixture folder belongs to a computed rule, and every computed rule has one", async () => {
  const held = (await fs.readdir(FIXTURES, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const wanted = ["clean", ...computedRules.map((row) => row.rule.slice(1).replace("/", "-"))].sort();
  assert.deepEqual(held, wanted);
});

test("the clean fixture reports nothing at all", async () => {
  const result = await lint(path.join(FIXTURES, "clean"));
  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.action, "linted");
  assert.equal(result.report, "[]");
});

test("a target that does not exist throws before any document is read", async () => {
  await assert.rejects(
    () => lint(path.join(FIXTURES, "no-such-fixture")),
    /^Error: lint target does not exist: /u,
  );
});

test("a directory holding no markdown document throws", async () => {
  const empty = path.join(FIXTURES, "clean", "Empty");
  await fs.mkdir(empty, { recursive: true });
  try {
    await assert.rejects(() => lint(empty), /^Error: lint target holds no artifact: /u);
  } finally {
    await fs.rm(empty, { recursive: true, force: true });
  }
});

test("a single document lints on its own", async () => {
  const result = await lint(path.join(FIXTURES, "clean", "ALGO_RING.md"));
  assert.deepEqual(result.diagnostics, []);
});

test("placeholders and open values are valid under a templates directory", async () => {
  const result = await lint(path.join(ROOT, ".sdd-flow", "templates"));
  const reported = new Set(result.diagnostics.map((diagnostic) => diagnostic.rule));
  assert.ok(!reported.has(":form/placeholder"));
  assert.ok(!reported.has(":form/open-value"));
});

test("the report is ordered by document — FLOW.md first, then by name — then line", async () => {
  const open = (heading) => `# ${heading}\n\n\`\`\`clojure\n{:first ?}\n\`\`\`\n\n\`\`\`clojure\n{:second ?}\n\`\`\`\n`;
  const result = await withFolder(
    {
      "STRUCTURE_A.md": open("Structure"),
      "FLOW.md": open("Progress"),
      "ALGO_A.md": open("s1"),
    },
    (root) => lint(root),
  );
  const files = [...new Set(result.diagnostics.map((diagnostic) => diagnostic.file))];
  assert.deepEqual(
    files.map((file) => path.basename(file)),
    ["FLOW.md", "ALGO_A.md", "STRUCTURE_A.md"],
  );
  let previous = null;
  for (const diagnostic of result.diagnostics) {
    if (previous && previous.file === diagnostic.file) {
      assert.ok(previous.line <= diagnostic.line);
    }
    previous = diagnostic;
  }
});

test("the default report is Clojure data the reader takes back", async () => {
  const result = await lint(fixtureOf(":form/duplicate-key"));
  const [form] = readAll(result.report);
  assert.equal(form.type, "vector");
  assert.equal(form.values.length, 1);
  const row = form.values[0];
  assert.equal(row.type, "map");
  assert.deepEqual(
    row.values.filter((_, index) => index % 2 === 0).map((key) => key.value),
    [":rule", ":severity", ":file", ":line", ":reason"],
  );
  assert.equal(row.values[1].value, ":form/duplicate-key");
  assert.equal(row.values[3].value, ":error");
  assert.equal(row.values[7].type, "number");
});

test("the text report is one line per diagnostic", async () => {
  const result = await lint(fixtureOf(":form/duplicate-key"), { text: true });
  const lines = result.report.split("\n");
  assert.equal(lines.length, 1);
  assert.match(
    lines[0],
    /FLOW\.md:2::error :form\/duplicate-key - the key :a stands twice in one map$/u,
  );
});

test("an empty text report is the empty string", async () => {
  const result = await lint(path.join(FIXTURES, "clean"), { text: true });
  assert.equal(result.report, "");
});

test("a reader error stands at its line inside the fence, not at the marker", async () => {
  const result = await lint(fixtureOf(":reader/parse"));
  const [diagnostic] = result.diagnostics;
  assert.equal(diagnostic.rule, ":reader/parse");
  assert.equal(diagnostic.line, 2);
});

// ── amendment :a-1 — four rules met real artifacts and were brought back to what they can know ──

async function withFolder(files, run) {
  const os = await import("node:os");
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "sdd-flow-lint-"));
  try {
    for (const [name, content] of Object.entries(files)) {
      await fs.writeFile(path.join(root, name), content);
    }
    return await run(root);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

const fenced = (form) => `# Decisions\n\n\`\`\`clojure\n${form}\n\`\`\`\n`;

test(":gate/chosen-not-top checks a :chosen only when it repeats an option verbatim", async () => {
  const restated = fenced(`[{:id :ad-1 :auto-decided true :confidence 70
  :chosen "take the first way, because it is the cheaper of the two"
  :options [{:option "the first way" :confidence 70} {:option "the second way" :confidence 30}]
  :because "why"}]`);
  const wrong = fenced(`[{:id :ad-1 :auto-decided true :confidence 70
  :chosen "the second way"
  :options [{:option "the first way" :confidence 70} {:option "the second way" :confidence 30}]
  :because "why"}]`);
  const quiet = await withFolder({ "FLOW.md": restated }, (root) => lint(root));
  assert.deepEqual(quiet.diagnostics.filter((d) => d.rule === ":gate/chosen-not-top"), []);
  const loud = await withFolder({ "FLOW.md": wrong }, (root) => lint(root));
  assert.equal(loud.diagnostics.filter((d) => d.rule === ":gate/chosen-not-top").length, 1);
});

test(":form/duplicate-id reads :part as an id only among the parts of a proposal, and an id only as a keyword", async () => {
  const runLog = fenced(`[{:part :schema :run 1 :outcome :written} {:part :schema :run 2 :outcome :fixed}
 {:decision "none" :what "a"} {:decision "none" :what "b"}]`);
  const proposal = fenced(`[{:part :one :writes #{"a.js"} :carries #{run} :after #{} :confidence 60}
 {:part :one :writes #{"b.js"} :carries #{walk} :after #{} :confidence 60}]`);
  const quiet = await withFolder({ "FLOW.md": runLog }, (root) => lint(root));
  assert.deepEqual(quiet.diagnostics.filter((d) => d.rule === ":form/duplicate-id"), []);
  const loud = await withFolder({ "FLOW.md": proposal }, (root) => lint(root));
  assert.equal(loud.diagnostics.filter((d) => d.rule === ":form/duplicate-id").length, 1);
});

// ── 0.5.0 — lint knows no kinds; any document reads by form alone ──

test("a FLOW.md's headings report nothing — the kind is open, the :form family still reads it", async () => {
  const result = await withFolder(
    { "FLOW.md": "# Request\n\n```clojure\n{:raw ?}\n```\n\n# Anything the owner likes\n\n```clojure\n{:a 1}\n```\n" },
    (root) => lint(root),
  );
  assert.deepEqual(result.diagnostics.map((d) => d.rule), [":form/open-value"]);
});

test("a legacy staged-cascade folder still reads by form alone", async () => {
  const result = await withFolder(
    {
      "S1.md": "# s1\n\n```clojure\n(def old {:makes \"x\" :flow (-> (:step-1 \"a\" {:reads #{} :writes #{:x} :state \"x\"}))})\n```\n",
      "CONTEXT.md": "# Task\n\n```clojure\n{:task :old}\n```\n",
    },
    (root) => lint(root),
  );
  assert.deepEqual(result.diagnostics, []);
});

test("the catalogue holds only rules that need nothing but the form", () => {
  for (const row of RULES) {
    assert.ok(/^:(reader|form|gate|register)\//u.test(row.rule), `${row.rule} is not a form rule`);
  }
});

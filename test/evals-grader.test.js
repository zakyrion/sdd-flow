import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { gradeScenario } from "../evals/grade.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function withTempDoc(content, fn) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "sdd-eval-"));
  const file = path.join(dir, "DOC.md");
  try {
    await fs.writeFile(file, content, "utf8");
    return await fn(file);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

test("eval grader S1 passes inline :answer within budget and rejects escalated mutation", async () => {
  const good = await withTempDoc(
    '# Answer\n\n```clojure\n{:task :ask-retry :kind :answer :result "prose"}\n```\n',
    (f) => gradeScenario("S1", f, { flowCreated: false, startupBytes: 17000 }),
  );
  assert.equal(good.ok, true, good.failures.join("; "));

  const bad = await withTempDoc(
    '# Escalated\n\n```clojure\n{:task :do-retry :kind :mutation}\n```\n',
    (f) => gradeScenario("S1", f, { flowCreated: true, startupBytes: 30000 }),
  );
  assert.equal(bad.ok, false);
  assert.equal(bad.failures.length, 3);
});

test("eval grader S2 passes gated :mutation with :why, single :goal, ? and rated options, and rejects missing :why", async () => {
  const good = await withTempDoc(
    '# Gate\n\n```clojure\n{:task :t :kind :mutation :why "surface dead-lettered jobs to operators" :goal "emit retry-exhausted notice" :off-limits ?}\n```\n\n```clojure\n{:id 1 :status :open :options [{:id :a :option "sub" :confidence 70} {:id :b :option "inline" :confidence 30}]}\n```\n',
    (f) => gradeScenario("S2", f),
  );
  assert.equal(good.ok, true, good.failures.join("; "));

  const missingWhy = await withTempDoc(
    '# Gate\n\n```clojure\n{:task :t :kind :mutation :goal "emit retry-exhausted notice" :off-limits ?}\n```\n\n```clojure\n{:id 1 :status :open :options [{:id :a :option "sub" :confidence 70} {:id :b :option "inline" :confidence 30}]}\n```\n',
    (f) => gradeScenario("S2", f),
  );
  assert.equal(missingWhy.ok, false);
  assert.ok(missingWhy.failures.some((m) => m.includes("missing :why")));

  const bad = await withTempDoc(
    '# Gate\n\n```clojure\n{:task :t :kind :mutation :off-limits "guessed"}\n```\n',
    (f) => gradeScenario("S2", f),
  );
  assert.equal(bad.ok, false);
});

test("eval grader S3 passes tools-first finding with provenance and rejects ungrounded claim", async () => {
  const good = await withTempDoc(
    '# Findings\n\n```clojure\n[{:finding :f1 :at "2026-11-25" :fact "2 consumers" :verified-by "fmgraph.py neighbors RetryNotice" :consequence "ok"}]\n```\n',
    (f) => gradeScenario("S3", f),
  );
  assert.equal(good.ok, true, good.failures.join("; "));

  const bad = await withTempDoc(
    '# Findings\n\n```clojure\n[{:finding :f1 :at "2026-11-25" :fact "2 consumers" :consequence "ok"}]\n```\n',
    (f) => gradeScenario("S3", f),
  );
  assert.equal(bad.ok, false);
});

test("eval grader S4 and S5 pass sketch examples.md and catch orphan data or label leaks", async () => {
  const sketchEx = path.join(ROOT, "templates/skills/sdd-algorithm-sketch/examples.md");
  const s4 = await gradeScenario("S4", sketchEx);
  assert.equal(s4.ok, true, s4.failures.join("; "));
  const s5 = await gradeScenario("S5", sketchEx);
  assert.equal(s5.ok, true, s5.failures.join("; "));

  const leaky = await withTempDoc(
    '# s1\n\n```clojure\n(def Bad {:makes "x (contra :c-1)" :data {:a {:type T :holds "h" :from "f"} :orphan {:type T :holds "h" :from "f"}} :flow (-> (:step-1 (cond "c" "y" :else "z") {:reads #{:a} :writes #{:a}})) :exits #{"none — never"}})\n```\n',
    (f) => gradeScenario("S4", f),
  );
  assert.equal(leaky.ok, false);
  assert.ok(leaky.failures.some((m) => m.includes(":tally/orphan-data")));
  assert.ok(leaky.failures.some((m) => m.includes("bare decision/contra id")));
});

test("eval grader S6 passes code-structure examples.md and catches missing # Subject :why or :lives", async () => {
  const structEx = path.join(ROOT, "templates/skills/sdd-code-structure/examples.md");
  const s6 = await gradeScenario("S6", structEx, { requiredDataKeys: [":rings", ":store", ":slot"] });
  assert.equal(s6.ok, true, s6.failures.join("; "));

  const noSubjectWhy = await withTempDoc(
    '# Subject\n\n```clojure\n{:structure "Mod" :from "ALGO.md" :touches #{"a.ts"}}\n```\n# Structure\n\n```clojure\n{:Mod/entry {:does "d" :in #{:x} :out :x :flow (-> (:step-1 {:calls M :out :x}))} :Mod/methods {M {:does "d" :in #{:x} :out :x :writes #{}}} :Mod/data {:x {:type T :as x :lives :external :holds "h"}}}\n```\n',
    (f) => gradeScenario("S6", f),
  );
  assert.equal(noSubjectWhy.ok, false);
  assert.ok(noSubjectWhy.failures.some((m) => m.includes(":why")));
});

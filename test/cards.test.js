import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { buildCards, definitionTexts } from "../src/cards.js";
import { doctorProject, initProject } from "../src/core.js";
import { validateNormativeMarkdown } from "../src/document-validator.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFile(path.join(ROOT, relative), "utf8");
const SKILL = "templates/skills/sdd-cascade/SKILL.md";
const CONTRACT = "templates/core/FLOW_CONTRACT.md";
const STAGES = ["context", "s1", "s2", "code", "read-back", "converge", "merge", "curator"];

test("every stage and the curator get a card, and a card is normative markdown", async () => {
  const cards = buildCards(await read(SKILL), await read(CONTRACT));
  assert.deepEqual([...cards.keys()].sort(), [...STAGES].sort());
  for (const [stage, content] of cards) {
    assert.deepEqual(validateNormativeMarkdown(content, stage), []);
    assert.ok(content.includes(`{:card :${stage}`));
    assert.ok(content.includes(".sdd-flow/references/CLOJURE_NOTATION.md"));
  }
});

test("a card holds its defs byte for byte — the skill first, the contract for a def the skill lacks", async () => {
  const skill = await read(SKILL);
  const contract = await read(CONTRACT);
  const inSkill = definitionTexts(skill);
  const inContract = definitionTexts(contract);
  for (const [stage, content] of buildCards(skill, contract)) {
    for (const [name, text] of definitionTexts(content)) {
      const source = inSkill.get(name) ?? inContract.get(name);
      assert.equal(text, source, `${name} in the ${stage} card differs from its source`);
    }
  }
  // living-s2 and deferral stand in the contract alone; verdict stands in both and the skill wins
  const converge = definitionTexts(buildCards(skill, contract).get("converge"));
  assert.equal(converge.get("deferral"), inContract.get("deferral"));
  assert.equal(converge.get("verdict"), inSkill.get("verdict"));
});

test("a runner's preamble is under half of what it read before the cards", async () => {
  const skill = await read(SKILL);
  const contract = await read(CONTRACT);
  const glossary = (await read("templates/core/references/CLOJURE_NOTATION.md")).length;
  let templates = 0;
  for (const name of ["CONTEXT", "S1", "S2", "CALIBRATION"]) {
    templates += (await read(`templates/core/templates/${name}.md`)).length;
  }
  const before = skill.length + contract.length + glossary + templates;
  const largestTemplate = (await read("templates/core/templates/S2.md")).length;
  for (const [stage, content] of buildCards(skill, contract)) {
    const now = content.length + glossary + largestTemplate;
    assert.ok(now < before / 2, `${stage}: ${now} of ${before}`);
  }
});

test("a def name the skill does not hold fails loud", async () => {
  const skill = (await read(SKILL)).replace(":context [context-stage]", ":context [context-stage no-such-def]");
  assert.throws(() => buildCards(skill, ""), /no-such-def/);
});

test("init installs the cards as managed files and doctor guards them", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "sdd-flow-cards-"));
  try {
    await initProject(root, ["claude"]);
    for (const stage of STAGES) {
      await fs.access(path.join(root, ".sdd-flow/cards", `${stage}.md`));
    }
    assert.equal((await doctorProject(root)).ok, true);
    await fs.appendFile(path.join(root, ".sdd-flow/cards/s1.md"), "\n# Edited by hand\n");
    const report = await doctorProject(root);
    assert.equal(report.ok, false);
    assert.ok(report.issues.some((issue) => issue.includes(".sdd-flow/cards/s1.md")));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

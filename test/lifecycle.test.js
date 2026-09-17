import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  desiredFilePaths,
  diffProject,
  doctorProject,
  initProject,
  uninstallProject,
  unlinkProject,
  updateProject,
} from "../src/core.js";

for (const tools of [["codex"], ["claude"], ["codex", "claude"]]) {
  test(`init creates exact managed shape for ${tools.join("+")}`, async () => {
    await withFixture(async (root) => {
      const result = await initProject(root, tools);
      const desired = await desiredFilePaths(tools);
      assert.equal(result.managedFiles, desired.length);
      assert.deepEqual(
        await filePaths(root),
        [
          ".sdd-flow/config.json",
          ".sdd-flow/manifest.json",
          ...desired,
        ].sort(),
      );
      await assertDirectory(root, "Flows");
      await assertDirectory(root, "Flows/Archive");

      const firstManifest = await fs.readFile(
        path.join(root, ".sdd-flow/manifest.json"),
        "utf8",
      );
      await initProject(root, [...tools].reverse());
      const secondManifest = await fs.readFile(
        path.join(root, ".sdd-flow/manifest.json"),
        "utf8",
      );
      assert.equal(secondManifest, firstManifest);
    });
  });
}

test("init fails loud on an unmanaged conflict and force overwrites it", async () => {
  await withFixture(async (root) => {
    const target = path.join(
      root,
      ".agents/skills/sdd-clojure-flow/SKILL.md",
    );
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, "user file\n");
    await assert.rejects(
      initProject(root, ["codex"]),
      /refusing to overwrite existing files/,
    );
    assert.equal(await fs.readFile(target, "utf8"), "user file\n");
    await initProject(root, ["codex"], { force: true });
    assert.notEqual(await fs.readFile(target, "utf8"), "user file\n");
  });
});

test("init refuses managed paths that traverse a symbolic link", async () => {
  await withFixture(async (root) => {
    const linkedDirectory = path.join(root, "linked-agents");
    await fs.mkdir(linkedDirectory);
    await fs.symlink(linkedDirectory, path.join(root, ".agents"));
    await assert.rejects(
      initProject(root, ["codex"]),
      /managed path traverses a symbolic link/,
    );
    assert.deepEqual(await fs.readdir(linkedDirectory), []);
  });
});

test("update is idempotent and drift requires force", async () => {
  await withFixture(async (root) => {
    await initProject(root, ["codex", "claude"]);
    const clean = await updateProject(root);
    assert.equal(clean.removed.length, 0);

    const target = path.join(
      root,
      ".agents/skills/sdd-clojure-flow/SKILL.md",
    );
    await fs.appendFile(target, "\nmodified by user\n");
    await assert.rejects(updateProject(root), /modified managed files/);
    assert.match(await fs.readFile(target, "utf8"), /modified by user/);

    await updateProject(root, { force: true });
    assert.doesNotMatch(await fs.readFile(target, "utf8"), /modified by user/);
    const report = await doctorProject(root);
    assert.equal(report.ok, true, report.issues.join("\n"));
  });
});

test("doctor passes clean install and reports drift", async () => {
  await withFixture(async (root) => {
    await initProject(root, ["claude"]);
    const clean = await doctorProject(root);
    assert.equal(clean.ok, true, clean.issues.join("\n"));

    await fs.appendFile(
      path.join(root, ".sdd-flow/FLOW_CONTRACT.md"),
      "\nprose drift\n",
    );
    const drift = await doctorProject(root);
    assert.equal(drift.ok, false);
    assert.ok(
      drift.issues.some((issue) => issue.includes("modified after installation")),
    );
    assert.ok(
      drift.issues.some((issue) => issue.includes("normative prose")),
    );
  });
});

test("doctor reports a managed path that traverses a symbolic link", async () => {
  await withFixture(async (root) => {
    await initProject(root, ["codex"]);
    const relocated = path.join(root, "agents-relocated");
    await fs.rename(path.join(root, ".agents"), relocated);
    await fs.symlink(relocated, path.join(root, ".agents"));
    const report = await doctorProject(root);
    assert.equal(report.ok, false);
    assert.ok(
      report.issues.some((issue) => issue.includes("symbolic link")),
      report.issues.join("\n"),
    );
  });
});

test("doctor reports invalid manifest schema without continuing into it", async () => {
  await withFixture(async (root) => {
    await initProject(root, ["codex"]);
    await fs.writeFile(
      path.join(root, ".sdd-flow/manifest.json"),
      '{"schemaVersion":1,"tools":["codex"],"managedFiles":[]}\n',
    );
    const report = await doctorProject(root);
    assert.equal(report.ok, false);
    assert.ok(
      report.issues.some((issue) => issue.includes("managedFiles must be an object")),
    );
  });
});

test("uninstall preserves config, FLOWs, and user files", async () => {
  await withFixture(async (root) => {
    await initProject(root, ["codex", "claude"]);
    await fs.writeFile(path.join(root, "Flows/FLOW_KEEP.md"), "user flow\n");
    await fs.writeFile(path.join(root, ".sdd-flow/user-note.txt"), "keep\n");
    await fs.writeFile(path.join(root, "USER.md"), "keep\n");

    const result = await uninstallProject(root);
    assert.ok(result.removed.length > 0);
    assert.equal(
      await fs.readFile(path.join(root, "Flows/FLOW_KEEP.md"), "utf8"),
      "user flow\n",
    );
    assert.equal(
      await fs.readFile(path.join(root, ".sdd-flow/user-note.txt"), "utf8"),
      "keep\n",
    );
    assert.equal(await fs.readFile(path.join(root, "USER.md"), "utf8"), "keep\n");
    await fs.access(path.join(root, ".sdd-flow/config.json"));
    await assertMissing(path.join(root, ".sdd-flow/manifest.json"));
    for (const managedPath of await desiredFilePaths(["codex", "claude"])) {
      await assertMissing(path.join(root, managedPath));
    }
  });
});

test("uninstall fails atomically when a managed file was modified", async () => {
  await withFixture(async (root) => {
    await initProject(root, ["codex"]);
    const target = path.join(root, ".sdd-flow/FLOW_CONTRACT.md");
    await fs.appendFile(target, "\nuser change\n");
    await assert.rejects(
      uninstallProject(root),
      /nothing was removed/,
    );
    await fs.access(path.join(root, ".sdd-flow/manifest.json"));
    for (const managedPath of await desiredFilePaths(["codex"])) {
      await fs.access(path.join(root, managedPath));
    }
  });
});

test("installed contract carries the post-mortem hardening content", async () => {
  await withFixture(async (root) => {
    await initProject(root, ["claude"]);
    const contract = await fs.readFile(
      path.join(root, ".sdd-flow/FLOW_CONTRACT.md"),
      "utf8",
    );
    for (const marker of [
      ":depth",
      ":characterize",
      ":hypotheses",
      ":observability",
      "(def agent-output",
      "(def disproven",
    ]) {
      assert.ok(contract.includes(marker), `FLOW_CONTRACT.md missing ${marker}`);
    }
    const template = await fs.readFile(
      path.join(root, ".sdd-flow/templates/FLOW.md"),
      "utf8",
    );
    assert.ok(template.includes("# Disproven"), "FLOW.md missing # Disproven");
    const notation = await fs.readFile(
      path.join(root, ".sdd-flow/references/CLOJURE_NOTATION.md"),
      "utf8",
    );
    assert.ok(
      notation.includes("(def output-direction"),
      "CLOJURE_NOTATION.md missing the output-direction mirror",
    );
  });
});

test("installed contract separates deliverable kinds", async () => {
  await withFixture(async (root) => {
    await initProject(root, ["claude"]);
    const contract = await fs.readFile(
      path.join(root, ".sdd-flow/FLOW_CONTRACT.md"),
      "utf8",
    );
    for (const marker of [
      "(def deliverable-kind",
      "(def answer-contract",
      "(def emergent-decision",
      ":kind-bound",
    ]) {
      assert.ok(contract.includes(marker), `FLOW_CONTRACT.md missing ${marker}`);
    }
    const skill = await fs.readFile(
      path.join(root, ".claude/skills/sdd-clojure-flow/SKILL.md"),
      "utf8",
    );
    assert.ok(skill.includes("(answer-task?)"), "SKILL.md missing the answer lane");
    assert.ok(
      skill.indexOf("(answer-task?)") < skill.indexOf("(engineering-task?)"),
      "SKILL.md must route answer-task? before engineering-task?",
    );
    const examples = await fs.readFile(
      path.join(root, ".sdd-flow/references/EXAMPLES.md"),
      "utf8",
    );
    assert.ok(examples.includes(":kind :answer"), "EXAMPLES.md missing the answer-kind example");
  });
});

test("installed contract carries prior-art research, rated options and provenance", async () => {
  await withFixture(async (root) => {
    await initProject(root, ["claude"]);
    const contract = await fs.readFile(
      path.join(root, ".sdd-flow/FLOW_CONTRACT.md"),
      "utf8",
    );
    for (const marker of [
      "(def prior-art",
      "(def outbound-gate",
      "(def option-confidence",
      "(def provenance",
      "(def attempted",
      "(def recurrence-guard",
      "(def decision-revisit",
      ":follow-up",
      ":stop-rule",
    ]) {
      assert.ok(contract.includes(marker), `FLOW_CONTRACT.md missing ${marker}`);
    }
    assert.ok(
      contract.includes(':batch "all known open decisions in one pass"'),
      "the one-pass question batch must survive alongside :follow-up",
    );
    const template = await fs.readFile(
      path.join(root, ".sdd-flow/templates/FLOW.md"),
      "utf8",
    );
    assert.ok(template.includes("# Findings"), "FLOW.md missing # Findings");
    assert.ok(template.includes("# Attempted"), "FLOW.md missing # Attempted");
    assert.ok(template.includes(":verified-by"), "FLOW.md missing :verified-by");
    const notation = await fs.readFile(
      path.join(root, ".sdd-flow/references/CLOJURE_NOTATION.md"),
      "utf8",
    );
    assert.ok(notation.includes(":name :number"), "CLOJURE_NOTATION.md missing the number form");
    const skill = await fs.readFile(
      path.join(root, ".claude/skills/sdd-clojure-flow/SKILL.md"),
      "utf8",
    );
    assert.ok(skill.includes(":prior-art"), "SKILL.md missing the prior-art leg");
    assert.ok(skill.includes(":outbound-gate"), "SKILL.md missing the outbound gate");
    const examples = await fs.readFile(
      path.join(root, ".sdd-flow/references/EXAMPLES.md"),
      "utf8",
    );
    assert.ok(examples.includes(":confidence 70"), "EXAMPLES.md missing a rated option");
  });
});

test("installed deep research skill carries its procedure", async () => {
  await withFixture(async (root) => {
    await initProject(root, ["codex", "claude"]);
    const skill = await fs.readFile(
      path.join(root, ".claude/skills/sdd-deep-research/SKILL.md"),
      "utf8",
    );
    for (const marker of [
      "name: sdd-deep-research",
      "# Activate",
      "# Conditions",
      "# Believe",
      "# Search",
      "# Weigh",
      "# Disconfirm",
      "# Stop",
      "# Deliver",
      ":agent-knowledge :lowest-weight",
      "(def outbound-gate)",
      "cost to build against cost to adopt",
    ]) {
      assert.ok(skill.includes(marker), `deep research SKILL.md missing ${marker}`);
    }
    assert.equal(
      skill,
      await fs.readFile(
        path.join(root, ".agents/skills/sdd-deep-research/SKILL.md"),
        "utf8",
      ),
      "both adapters must install the same skill text",
    );

    const command = await fs.readFile(
      path.join(root, ".claude/commands/sdd-research.md"),
      "utf8",
    );
    assert.ok(command.includes(":command :sdd-research"));
    assert.ok(command.includes(".claude/skills/sdd-deep-research/SKILL.md"));
  });
});

test("installed research template carries every section", async () => {
  await withFixture(async (root) => {
    await initProject(root, ["claude"]);
    const template = await fs.readFile(
      path.join(root, ".sdd-flow/templates/RESEARCH.md"),
      "utf8",
    );
    for (const section of [
      "# Question",
      "# Our conditions",
      "# Prior belief",
      "# Options",
      "# Disconfirmation",
      "# Verdict",
      "# Sources",
      "# Search log",
    ]) {
      assert.ok(template.includes(section), `RESEARCH.md missing ${section}`);
    }
    for (const field of [
      ":applies-when",
      ":known-uses",
      ":weakened-by",
      ":cost-to-adopt",
      ":reversibility",
      ":no-verdict",
    ]) {
      assert.ok(template.includes(field), `RESEARCH.md missing ${field}`);
    }
  });
});

test("installed contract gates research in two passes", async () => {
  await withFixture(async (root) => {
    await initProject(root, ["claude"]);
    const contract = await fs.readFile(
      path.join(root, ".sdd-flow/FLOW_CONTRACT.md"),
      "utf8",
    );
    for (const marker of [
      "(def research-passes",
      "(def deep-research",
      "(def evidence-weight",
      "(def disconfirmation",
      ":findings-gate",
      ":window",
    ]) {
      assert.ok(contract.includes(marker), `FLOW_CONTRACT.md missing ${marker}`);
    }
    assert.ok(
      contract.includes(':batch "all known open decisions in one pass"'),
      "the one-pass question batch must survive the findings gate",
    );
    assert.ok(
      contract.includes(":research-document"),
      "a resumed session must reconstruct the research document too",
    );

    const flowTemplate = await fs.readFile(
      path.join(root, ".sdd-flow/templates/FLOW.md"),
      "utf8",
    );
    assert.ok(flowTemplate.includes(":research-document"));
  });
});

test("uninstall leaves no deep research directories behind", async () => {
  await withFixture(async (root) => {
    await initProject(root, ["codex", "claude"]);
    await fs.access(path.join(root, ".claude/skills/sdd-deep-research"));
    await fs.access(path.join(root, ".agents/skills/sdd-deep-research/agents"));

    await uninstallProject(root);

    for (const stray of [
      ".claude/skills/sdd-deep-research",
      ".agents/skills/sdd-deep-research/agents",
      ".agents/skills/sdd-deep-research",
      ".claude",
      ".agents",
    ]) {
      await assertMissing(path.join(root, stray));
    }
  });
});


test("installed cascade skill carries its stages and rules", async () => {
  await withFixture(async (root) => {
    await initProject(root, ["codex", "claude"]);
    const skill = await fs.readFile(
      path.join(root, ".claude/skills/sdd-cascade/SKILL.md"),
      "utf8",
    );
    for (const marker of [
      "name: sdd-cascade",
      "# Stages",
      "# Isolation",
      "# Invoke",
      "# Runner",
      "# Auto",
      "# Code stage",
      "# Merge",
      "# Context stage",
      "# Story",
      "# Cascade",
      "# s1",
      "# s2",
      "# Translation",
      "# Read-back",
      "# Converge",
      "# Meters",
      "# Calibration",
      "(def stage-isolation",
      "(def stage-runner",
      "(def runner-launch",
      "(def runner-inside",
      "(def cascade-mode",
      "(def curator",
      "(def auto-decided",
      "(def auto-narrative",
      "(def slices",
      "(def code-stage",
      "(def delta",
      "(def merge",
      "# Cards",
      "(def cards",
      "(def from-code",
      "(def context-stage",
      ":single-writer",
      "sdd-flow lint",
      "# Verdict",
      "(def verdict",
      "(def deferral)",
      ":absent",
      ":deferred",
      ":accounted",
      ":clean",
      ":escalate",
      ":missing",
      ":scope  \"#{:slice :whole}",
      ":after",
      ":artifact-kind",
      "(def data-coverage",
      "(def story-test",
      ":status :hypothesis",
      ":invented-at-translation 0",
      "a stage runner — a fresh agent launched for that one stage",
    ]) {
      assert.ok(skill.includes(marker), `cascade SKILL.md missing ${marker}`);
    }
    for (const retired of ["subagents are not the mechanism", "CASCADE.md # s1", "CASCADE.md # s2"]) {
      assert.ok(!skill.includes(retired), `cascade SKILL.md still carries ${retired}`);
    }
    assert.equal(
      skill,
      await fs.readFile(
        path.join(root, ".agents/skills/sdd-cascade/SKILL.md"),
        "utf8",
      ),
      "both adapters must install the same skill text",
    );

    const command = await fs.readFile(
      path.join(root, ".claude/commands/sdd-cascade.md"),
      "utf8",
    );
    assert.ok(command.includes(":command :sdd-cascade"));
    assert.ok(command.includes(".claude/skills/sdd-cascade/SKILL.md"));

    const metadata = await fs.readFile(
      path.join(root, ".agents/skills/sdd-cascade/agents/openai.yaml"),
      "utf8",
    );
    const shortDescription = /short_description: "([^"]*)"/u.exec(metadata)?.[1] ?? "";
    assert.ok(
      shortDescription.length >= 25 && shortDescription.length <= 64,
      `Codex short_description must be 25-64 characters, got ${shortDescription.length}`,
    );
  });
});

test("installed cascade templates carry every section", async () => {
  await withFixture(async (root) => {
    await initProject(root, ["claude"]);
    await assertMissing(path.join(root, ".sdd-flow/templates/CASCADE.md"));
    const s1 = await fs.readFile(
      path.join(root, ".sdd-flow/templates/S1.md"),
      "utf8",
    );
    for (const section of ["# Subject", "# s1", "# Contra", "# Gate"]) {
      assert.ok(s1.includes(section), `S1.md missing ${section}`);
    }
    for (const field of [":mode", ":auto-to", ":models", ":artifact-kind", ":living-s2", ":s1-tally", ":auto-decided", ":gate-after-s1", ":owner-verdict"]) {
      assert.ok(s1.includes(field), `S1.md missing ${field}`);
    }
    const s2 = await fs.readFile(
      path.join(root, ".sdd-flow/templates/S2.md"),
      "utf8",
    );
    for (const section of [
      "# Subject",
      "# s2",
      "# Contra",
      "# Slices",
      "# Gate",
      "# Read-back",
      "# Converge",
      "# Verdict",
      "# Calibration",
    ]) {
      assert.ok(s2.includes(section), `S2.md missing ${section}`);
    }
    for (const field of [
      ":from-s1",
      ":type <RealType>",
      ":lives",
      ":spine-reads",
      ":typed",
      ":slice",
      ":one-runner",
      ":code-as",
      ":owner-verdict",
      ":unrequested",
      ":run-shape",
      ":after",
      ":context-gaps",
      "^:added",
      "^:deferred",
      ":absent",
      ":level",
      ":accounted",
      ":conformance",
      ":behavior",
    ]) {
      assert.ok(s2.includes(field), `S2.md missing ${field}`);
    }
    const ledger = await fs.readFile(
      path.join(root, ".sdd-flow/templates/CALIBRATION.md"),
      "utf8",
    );
    assert.ok(ledger.includes("# Ledger"), "CALIBRATION.md missing # Ledger");
    for (const field of [":run-shape", ":context-gaps", ":held?", ":top-rated", ":verdicts", ":deferred", ":failed?"]) {
      assert.ok(ledger.includes(field), `CALIBRATION.md missing ${field}`);
    }
    const context = await fs.readFile(
      path.join(root, ".sdd-flow/templates/CONTEXT.md"),
      "utf8",
    );
    for (const section of [
      "# Task",
      "# Reads",
      "# Search",
      "# Facts",
      "# Occasions",
      "# Gotchas",
      "# Verification",
      "# Complete",
    ]) {
      assert.ok(context.includes(section), `CONTEXT.md missing ${section}`);
    }
    assert.ok(context.includes("# Build"), "CONTEXT.md missing # Build");
    for (const field of [":artifact-kind", ":living-s2", ":trap", ":avoid", ":names-artifact-kind", ":names-build-facts", ":modules", ":tests"]) {
      assert.ok(context.includes(field), `CONTEXT.md missing ${field}`);
    }
    assert.ok(context.includes(":verified-by"), "CONTEXT.md facts must carry provenance");
    assert.ok(
      context.includes(":names-every-file-the-next-stage-may-read"),
      "CONTEXT.md must carry the self-containment check",
    );
  });
});

test("installed contract carries the cascade path", async () => {
  await withFixture(async (root) => {
    await initProject(root, ["claude"]);
    const contract = await fs.readFile(
      path.join(root, ".sdd-flow/FLOW_CONTRACT.md"),
      "utf8",
    );
    for (const marker of [
      "(def path",
      "(def cascade",
      "(def stage-isolation",
      "(def stage-runner",
      "(def cascade-mode",
      "(def auto-decided",
      "(def auto-narrative",
      "(def living-s2",
      "(def calibration-ledger",
      ":card \"a runner reads a card",
      ":lint \"sdd-flow lint",
      "(def verdict",
      "(def deferral",
      ":verdict :when-cascaded",
      ":escalate",
      ":merge :when-cascaded-on-a-living-subject",
      "(-> FLOW.md CONTEXT.md S1.md S2.md code)",
      "Flows/<TASK>/FLOW.md",
      ":legacy",
      ":read-back :when-cascaded",
    ]) {
      assert.ok(contract.includes(marker), `FLOW_CONTRACT.md missing ${marker}`);
    }
    assert.ok(
      !contract.includes("subagents are not the mechanism"),
      "FLOW_CONTRACT.md still names the owner's hand as the only mechanism",
    );
    const flowTemplate = await fs.readFile(
      path.join(root, ".sdd-flow/templates/FLOW.md"),
      "utf8",
    );
    assert.ok(flowTemplate.includes(":path #{:direct :cascade}"));
    for (const field of [":amendment :a-1", ":defers", ":level"]) {
      assert.ok(flowTemplate.includes(field), `FLOW.md template missing ${field}`);
    }
    const notation = await fs.readFile(
      path.join(root, ".sdd-flow/references/CLOJURE_NOTATION.md"),
      "utf8",
    );
    assert.ok(notation.includes("(def cascade-fields"), "glossary missing the cascade fields");
    for (const reading of [":auto-decided", ":slice", ":type \"the real type", ":delta-marks", ":gotcha", ":ledger-row", ":after", ":converge-entry", ":verdict", ":deferred-mark", ":amendment", ":failed?", ":from-code", ":build", ":lint"]) {
      assert.ok(notation.includes(reading), `glossary missing the ${reading} reading`);
    }
    assert.ok(notation.includes(":name :data-reference"), "glossary missing the data-reference reading");
    const lifecycle = await fs.readFile(
      path.join(root, ".claude/skills/sdd-clojure-flow/SKILL.md"),
      "utf8",
    );
    assert.ok(lifecycle.includes("(hand-over-to-sdd-cascade!)"), "lifecycle skill must hand over to the cascade");
    assert.ok(lifecycle.includes("(def stage-runner)"), "lifecycle skill must launch the runner at the handoff");
    assert.ok(lifecycle.includes(":verdict :when-cascaded"), "lifecycle skill must mirror the verdict in done");
  });
});

test("update removes the retired CASCADE.md template an older install left behind", async () => {
  await withFixture(async (root) => {
    await initProject(root, ["claude"]);
    const retired = ".sdd-flow/templates/CASCADE.md";
    const content = "# Subject\n\n```clojure\n{:stage :s1}\n```\n";
    await fs.writeFile(path.join(root, retired), content);
    const manifestPath = path.join(root, ".sdd-flow/manifest.json");
    const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
    manifest.managedFiles[retired] = createHash("sha256").update(content).digest("hex");
    await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    const report = await updateProject(root);

    assert.ok(report.removed.includes(retired), "update must report the retired template");
    await assertMissing(path.join(root, retired));
    const refreshed = JSON.parse(await fs.readFile(manifestPath, "utf8"));
    assert.ok(!(retired in refreshed.managedFiles));
    await fs.access(path.join(root, ".sdd-flow/templates/S1.md"));
    await fs.access(path.join(root, ".sdd-flow/templates/S2.md"));
    const health = await doctorProject(root);
    assert.deepEqual(health.issues, []);
  });
});

test("uninstall leaves no cascade directories behind", async () => {
  await withFixture(async (root) => {
    await initProject(root, ["codex", "claude"]);
    await fs.access(path.join(root, ".claude/skills/sdd-cascade"));
    await fs.access(path.join(root, ".agents/skills/sdd-cascade/agents"));

    await uninstallProject(root);

    for (const stray of [
      ".claude/skills/sdd-cascade",
      ".agents/skills/sdd-cascade/agents",
      ".agents/skills/sdd-cascade",
      ".claude",
      ".agents",
    ]) {
      await assertMissing(path.join(root, stray));
    }
  });
});

test("the project adapter is the project's own file and survives an update", async () => {
  await withFixture(async (root) => {
    await initProject(root, ["claude"]);
    const adapter = path.join(root, ".sdd-flow/project.md");
    await fs.writeFile(adapter, "```clojure\n{:project :mine}\n```\n");

    const report = await doctorProject(root);
    assert.equal(report.ok, true, report.issues.join("\n"));

    await updateProject(root);
    assert.equal(
      await fs.readFile(adapter, "utf8"),
      "```clojure\n{:project :mine}\n```\n",
      "update must not touch a file it does not manage",
    );

    const manifest = JSON.parse(
      await fs.readFile(path.join(root, ".sdd-flow/manifest.json"), "utf8"),
    );
    assert.ok(
      !Object.hasOwn(manifest.managedFiles, ".sdd-flow/project.md"),
      "the adapter must stay out of the manifest",
    );
  });
});

test("without an adapter the skills read exactly what they always read", async () => {
  await withFixture(async (root) => {
    await initProject(root, ["claude"]);
    const skill = await fs.readFile(
      path.join(root, ".claude/skills/sdd-clojure-flow/SKILL.md"),
      "utf8",
    );
    assert.ok(
      skill.includes("(project-adapter-present? \".sdd-flow/project.md\")"),
      "SKILL.md must gate the adapter read on the adapter existing",
    );
    assert.ok(
      skill.includes(":no-adapter"),
      "SKILL.md must state what happens when there is no adapter",
    );
  });
});

test("diff reports drift, local-only rules, and what was never copied", async () => {
  await withFixture(async (root) => {
    await initProject(root, ["claude"]);
    const canon = await fs.readFile(
      path.join(root, ".sdd-flow/FLOW_CONTRACT.md"),
      "utf8",
    );
    const original = canon
      .slice(canon.indexOf("(def go-contract"))
      .slice(0, canon.slice(canon.indexOf("(def go-contract")).indexOf("\n```"));

    await fs.writeFile(
      path.join(root, "PROCESS.md"),
      [
        "```clojure",
        original.replace(":research-go", ":research-go-renamed"),
        "```",
        "```clojure",
        "(def house-rule {:home \"here\"})",
        "```",
      ].join("\n"),
    );

    const result = await diffProject(root, { files: ["PROCESS.md"] });
    const [entry] = result.files;
    const byName = new Map(entry.definitions.map((d) => [d.name, d.status]));
    assert.equal(byName.get("go-contract"), "differs");
    assert.equal(byName.get("house-rule"), "local-only");
    assert.ok(result.canonOnly.includes("hard-gate"));
  });
});

test("diff without an adapter or --file says what it needs", async () => {
  await withFixture(async (root) => {
    await initProject(root, ["claude"]);
    await assert.rejects(diffProject(root), /pass --file/);
  });
});

test("unlink removes marked blocks and leaves the document otherwise intact", async () => {
  await withFixture(async (root) => {
    await initProject(root, ["claude"]);
    await fs.writeFile(
      path.join(root, "CLAUDE.md"),
      [
        "# House rules",
        "<!-- BEGIN SDD-FLOW: pointer -->",
        "sdd-flow lives in .sdd-flow; start with /sdd-flow:start",
        "<!-- END SDD-FLOW: pointer -->",
        "the rest is ours",
        "",
      ].join("\n"),
    );
    await fs.writeFile(
      path.join(root, ".sdd-flow/project.md"),
      "```clojure\n{:footprint #{\"CLAUDE.md\"}}\n```\n",
    );

    const result = await unlinkProject(root);
    assert.deepEqual(result.changed, ["CLAUDE.md"]);
    assert.deepEqual(result.blocks, ["pointer"]);
    assert.equal(
      await fs.readFile(path.join(root, "CLAUDE.md"), "utf8"),
      "# House rules\nthe rest is ours\n",
    );
  });
});

test("installed project-init skill carries the survey procedure", async () => {
  await withFixture(async (root) => {
    await initProject(root, ["codex", "claude"]);
    const skill = await fs.readFile(
      path.join(root, ".claude/skills/sdd-project-init/SKILL.md"),
      "utf8",
    );
    for (const marker of [
      ":origin",
      ":parallel",
      ":base",
      "# Survey",
      "# Report",
      "# Rollback",
      "BEGIN SDD-FLOW",
    ]) {
      assert.ok(skill.includes(marker), `project-init SKILL.md missing ${marker}`);
    }
    await fs.access(path.join(root, ".claude/commands/sdd-project-init.md"));
    await fs.access(path.join(root, ".claude/commands/sdd-flow/promote.md"));
    await fs.access(path.join(root, ".agents/skills/sdd-project-init/SKILL.md"));
  });
});

test("the contract carries the project seam and the path upward", async () => {
  await withFixture(async (root) => {
    await initProject(root, ["claude"]);
    const contract = await fs.readFile(
      path.join(root, ".sdd-flow/FLOW_CONTRACT.md"),
      "utf8",
    );
    for (const marker of [
      "(def project-adapter",
      "(def coexistence",
      "(def promotion",
      "(def canon-copy",
      ":temporal-not-simultaneous",
    ]) {
      assert.ok(contract.includes(marker), `FLOW_CONTRACT.md missing ${marker}`);
    }
    const skeleton = await fs.readFile(
      path.join(root, ".sdd-flow/templates/PROJECT.md"),
      "utf8",
    );
    for (const section of [
      "# Entry",
      "# Tools",
      "# Meters",
      "# Bans",
      "# Ceremonies",
      "# Shape",
      "# Canon copy",
    ]) {
      assert.ok(skeleton.includes(section), `PROJECT.md missing ${section}`);
    }
  });
});

async function withFixture(callback) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "sdd-flow-test-"));
  try {
    await callback(root);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

async function filePaths(root, relative = "") {
  const absolute = path.join(root, relative);
  const result = [];
  for (const entry of await fs.readdir(absolute, { withFileTypes: true })) {
    const child = path.join(relative, entry.name);
    if (entry.isDirectory()) {
      result.push(...(await filePaths(root, child)));
    } else {
      result.push(child.split(path.sep).join("/"));
    }
  }
  return result.sort();
}

async function assertDirectory(root, relative) {
  assert.equal((await fs.stat(path.join(root, relative))).isDirectory(), true);
}

async function assertMissing(absolutePath) {
  await assert.rejects(fs.access(absolutePath), { code: "ENOENT" });
}

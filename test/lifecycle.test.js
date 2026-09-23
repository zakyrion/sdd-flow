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
      "# Mode",
      "(def sources-pass",
      "/sdd-sources",
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

    const sources = await fs.readFile(path.join(root, ".claude/commands/sdd-sources.md"), "utf8");
    assert.ok(sources.includes(":command :sdd-sources"));
    assert.ok(sources.includes(":mode :sources"));
    assert.ok(sources.includes(".claude/skills/sdd-deep-research/SKILL.md"));
  });
});

test("the adapter registers tools as orders and traps, and names its writers", async () => {
  await withFixture(async (root) => {
    await initProject(root, ["claude"]);
    const contract = await fs.readFile(path.join(root, ".sdd-flow/references/PROJECT_ADAPTER.md"), "utf8");
    for (const marker of ["(def tool-orders", "(def adapter-writers", ":slot :traps", ":use-when", ":because", ":instead-of", ":older", ":checked", ":sdd-code-survey", ":sdd-tool-skills", ":at-the-point-of-choice"]) {
      assert.ok(contract.includes(marker), `PROJECT_ADAPTER.md missing ${marker}`);
    }
    const skeleton = await fs.readFile(path.join(root, ".sdd-flow/templates/PROJECT.md"), "utf8");
    for (const marker of ["# Tools", "# Traps", ":use-when", ":because", ":instead-of"]) {
      assert.ok(skeleton.includes(marker), `PROJECT.md skeleton missing ${marker}`);
    }
    assert.ok(!skeleton.includes(":prefer-when"), "the skeleton must write orders, not preferences");
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


test("installed cascade skill is a short composer of standalone skills", async () => {
  await withFixture(async (root) => {
    await initProject(root, ["codex", "claude"]);
    const skill = await fs.readFile(
      path.join(root, ".claude/skills/sdd-cascade/SKILL.md"),
      "utf8",
    );
    for (const marker of [
      "name: sdd-cascade",
      "# Nature",
      "# Start",
      "# Chain",
      "# Register",
      "# Progress",
      "# Return",
      "# Invoke",
      "sdd-code-survey",
      "sources mode",
      "sdd-algorithm-sketch",
      "sdd-code-structure",
      "sdd-code-translation",
      "sdd-code-review",
      "(def decision-register)",
      ":legacy",
    ]) {
      assert.ok(skill.includes(marker), `cascade SKILL.md missing ${marker}`);
    }
    for (const retired of ["(def stage-runner", "(def cards", "(def converge", "(def merge", "(def living-s2", "(def curator", "# Read-back"]) {
      assert.ok(!skill.includes(retired), `cascade SKILL.md still carries ${retired}`);
    }
    assert.ok(skill.length <= 10 * 1024, `the composer must stay under 10 KB, it is ${skill.length} bytes`);
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

test("the staged cascade's templates and cards are no longer installed", async () => {
  await withFixture(async (root) => {
    await initProject(root, ["codex", "claude"]);
    for (const retired of [
      ".sdd-flow/templates/CONTEXT.md",
      ".sdd-flow/templates/S1.md",
      ".sdd-flow/templates/S2.md",
      ".sdd-flow/templates/CALIBRATION.md",
      ".sdd-flow/cards",
    ]) {
      await assertMissing(path.join(root, retired));
    }
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
      ":not-cascade",
      "(def cascade",
      "(def cascade-mode",
      "(def auto-decided",
      "(def decision-register",
      "(def tools-first",
      "(def sources-mode",
      "(def code-survey",
      "(def code-structure",
      "(def code-translation",
      "(def code-review",
      "(def tool-skills",
      "(def owner-brief",
      "«1A, 2B, 3 — as you propose»",
      "sdd-flow lint runs on the FLOW",
      ":new-fact",
      ":review :when-cascaded",
      ":handle",
      ":simplest",
      "Flows/<TASK>/FLOW.md",
      ":legacy",
    ]) {
      assert.ok(contract.includes(marker), `FLOW_CONTRACT.md missing ${marker}`);
    }
    for (const retired of ["(def stage-isolation", "(def stage-runner", "(def living-s2", "(def calibration-ledger", "(def verdict", "(def deferral", "(def auto-narrative"]) {
      assert.ok(!contract.includes(retired), `FLOW_CONTRACT.md still carries ${retired}`);
    }
    const flowTemplate = await fs.readFile(
      path.join(root, ".sdd-flow/templates/FLOW.md"),
      "utf8",
    );
    assert.ok(flowTemplate.includes(":path #{:direct :cascade}"));
    for (const field of [":amendment :a-1", ":defers", ":level", ":survey :algorithm :structure :code", ":asked", ":chosen :a", ":round 2", ":new-fact"]) {
      assert.ok(flowTemplate.includes(field), `FLOW.md template missing ${field}`);
    }
    const notation = await fs.readFile(
      path.join(root, ".sdd-flow/references/CLOJURE_NOTATION.md"),
      "utf8",
    );
    assert.ok(notation.includes("(def cascade-fields"), "glossary missing the cascade fields");
    for (const reading of [":auto-decided", ":part", ":type \"the real type", ":trap", ":after", ":amendment", ":build", ":lives", ":translation-report", ":review-failure", ":branch", ":step-detail"]) {
      assert.ok(notation.includes(reading), `glossary missing the ${reading} reading`);
    }
    assert.ok(notation.includes(":name :data-reference"), "glossary missing the data-reference reading");
    const lifecycle = await fs.readFile(
      path.join(root, ".claude/skills/sdd-clojure-flow/SKILL.md"),
      "utf8",
    );
    assert.ok(lifecycle.includes("(hand-over-to-sdd-cascade!)"), "lifecycle skill must hand over to the cascade");
    assert.ok(lifecycle.includes(":review :when-cascaded"), "lifecycle skill must mirror the review in done");
    assert.ok(lifecycle.includes(":tools-first"), "lifecycle research must put the registered tools first");
  });
});

test("update removes what the staged cascade installed", async () => {
  await withFixture(async (root) => {
    await initProject(root, ["claude"]);
    const manifestPath = path.join(root, ".sdd-flow/manifest.json");
    const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
    const retired = [".sdd-flow/templates/S1.md", ".sdd-flow/cards/s1.md"];
    for (const file of retired) {
      const content = "# s1\n\n```clojure\n{:stage :s1}\n```\n";
      await fs.mkdir(path.dirname(path.join(root, file)), { recursive: true });
      await fs.writeFile(path.join(root, file), content);
      manifest.managedFiles[file] = createHash("sha256").update(content).digest("hex");
    }
    await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    const report = await updateProject(root);

    for (const file of retired) {
      assert.ok(report.removed.includes(file), `update must report ${file}`);
      await assertMissing(path.join(root, file));
    }
    await assertMissing(path.join(root, ".sdd-flow/cards"));
    const refreshed = JSON.parse(await fs.readFile(manifestPath, "utf8"));
    for (const file of retired) {
      assert.ok(!(file in refreshed.managedFiles));
    }
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

const ALGORITHM_SKILLS = [
  {
    skill: "sdd-algorithm-sketch",
    command: "sdd-sketch",
    markers: [
      "name: sdd-algorithm-sketch",
      "# Draft",
      "# Form",
      "# Step",
      "# Tally",
      "# Contra",
      "# Discuss",
      "# Next",
      "# Other form",
      "(def <Name>",
      ":continue-as-a-cascade",
      "code written from this skill",
    ],
  },
  {
    skill: "sdd-algorithm-lift",
    command: "sdd-lift",
    markers: [
      "name: sdd-algorithm-lift",
      "# Mode",
      "# Read",
      "# Form",
      "# Level",
      "# Scale",
      "# Fidelity",
      "# Flags",
      "# Code map",
      "# Deliver",
      "# Other form",
      "(def <Name>",
      ":axis [:bound :clean]",
      "the code respelled in Clojure",
      ":branch",
    ],
  },
  {
    skill: "sdd-code-survey",
    command: "sdd-survey",
    markers: ["name: sdd-code-survey", "# Tools", "# Questions", "# Search", "# Stop", "# Findings", "# Report", "(def search-order", ":no-registry", "(tool-skill-answers? question)"],
  },
  {
    skill: "sdd-tool-skills",
    command: "sdd-tools",
    markers: ["name: sdd-tool-skills", "# Scan", "# Questions", "# Generate", "# Registry", "# Report", ".sdd-flow/tool-skills.md", ":user-invocable", "never one per tool", ":stale"],
  },
  {
    skill: "sdd-code-structure",
    command: "sdd-structure",
    markers: ["name: sdd-code-structure", "# Document", "# Structure", "# Parts", "# Contra", "# Tally", "# Gate", "(def laws", ":lives"],
  },
  {
    skill: "sdd-code-translation",
    command: "sdd-translate",
    markers: ["name: sdd-code-translation", "# Launch", "# Agent", "# Translation", "(def launch", "(def agent", ":single-writer", ":status :hypothesis", ":why-fresh"],
  },
  {
    skill: "sdd-code-review",
    command: "sdd-review",
    markers: ["name: sdd-code-review", "# Run", "# Verdict", "# Report", ":levels", ":boundary"],
  },
];

// Every skill that stops for the owner's word carries its own short copy of
// the owner's brief; the lifecycle and the cascade cite the contract's.
test("every skill that stops for the owner tells it as the owner's brief", async () => {
  await withFixture(async (root) => {
    await initProject(root, ["claude"]);
    const read = (skill) => fs.readFile(path.join(root, `.claude/skills/${skill}/SKILL.md`), "utf8");
    for (const skill of ["sdd-code-survey", "sdd-algorithm-sketch", "sdd-algorithm-lift", "sdd-code-structure", "sdd-tool-skills", "sdd-deep-research"]) {
      const text = await read(skill);
      assert.ok(text.includes(":owner {:brief"), `${skill} carries no copy of the owner's brief`);
      assert.ok(text.includes("«1A, 2B, 3 — as you propose»"), `${skill} does not state the answer form`);
    }
    assert.ok((await read("sdd-clojure-flow")).includes("(def owner-brief)"));
    assert.ok((await read("sdd-cascade")).includes("(def owner-brief)"));
  });
});

for (const { skill, command, markers } of ALGORITHM_SKILLS) {
  test(`installed ${skill} skill carries its procedure and reads the glossary alone`, async () => {
    await withFixture(async (root) => {
      await initProject(root, ["codex", "claude"]);
      const text = await fs.readFile(
        path.join(root, `.claude/skills/${skill}/SKILL.md`),
        "utf8",
      );
      for (const marker of markers) {
        assert.ok(text.includes(marker), `${skill} SKILL.md missing ${marker}`);
      }
      assert.ok(
        text.includes(':requires [".sdd-flow/references/CLOJURE_NOTATION.md"]'),
        `${skill} is a light skill — its # Load requires the glossary and nothing else`,
      );
      assert.ok(text.length <= 15 * 1024, `${skill} must stay under 15 KB, it is ${text.length} bytes`);
      assert.equal(
        text,
        await fs.readFile(path.join(root, `.agents/skills/${skill}/SKILL.md`), "utf8"),
        "both adapters must install the same skill text",
      );

      const commandText = await fs.readFile(
        path.join(root, `.claude/commands/${command}.md`),
        "utf8",
      );
      assert.ok(commandText.includes(`:command :${command}`));
      assert.ok(commandText.includes(`.claude/skills/${skill}/SKILL.md`));

      const metadata = await fs.readFile(
        path.join(root, `.agents/skills/${skill}/agents/openai.yaml`),
        "utf8",
      );
      const shortDescription = /short_description: "([^"]*)"/u.exec(metadata)?.[1] ?? "";
      assert.ok(
        shortDescription.length >= 25 && shortDescription.length <= 64,
        `Codex short_description must be 25-64 characters, got ${shortDescription.length}`,
      );

      const contract = await fs.readFile(path.join(root, ".sdd-flow/FLOW_CONTRACT.md"), "utf8");
      assert.ok(
        contract.includes(`(def ${skill.replace("sdd-", "")}`),
        `FLOW_CONTRACT.md must mirror the policy of ${skill}`,
      );
      const lifecycle = await fs.readFile(
        path.join(root, ".claude/skills/sdd-clojure-flow/SKILL.md"),
        "utf8",
      );
      assert.ok(lifecycle.includes(`/${command}`), `the lifecycle's # Hand over must name /${command}`);
    });
  });

  test(`uninstall leaves no ${skill} directories behind`, async () => {
    await withFixture(async (root) => {
      await initProject(root, ["codex", "claude"]);
      await fs.access(path.join(root, `.claude/skills/${skill}`));
      await fs.access(path.join(root, `.agents/skills/${skill}/agents`));

      await uninstallProject(root);

      for (const stray of [
        `.claude/skills/${skill}`,
        `.agents/skills/${skill}/agents`,
        `.agents/skills/${skill}`,
        ".claude",
        ".agents",
      ]) {
        await assertMissing(path.join(root, stray));
      }
    });
  });
}

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

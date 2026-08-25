import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  desiredFilePaths,
  doctorProject,
  initProject,
  uninstallProject,
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

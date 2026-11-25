#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { lint } from "../src/analyzer.js";
import { readAll } from "../src/clojure-reader.js";
import { markdownBlocks } from "../src/document-validator.js";
import { canonicalize } from "../src/project-adapter.js";

function parseFences(markdown) {
  const forms = [];
  for (const block of markdownBlocks(markdown)) {
    if (block.kind === "fence" && block.closed && block.text.trim() !== "") {
      forms.push(...readAll(block.text));
    }
  }
  return forms;
}

function walk(node, fn) {
  fn(node);
  if (["list", "vector", "set", "map"].includes(node.type)) {
    for (const v of node.values) walk(v, fn);
  } else if (node.type === "metadata") {
    walk(node.metadata, fn);
    walk(node.value, fn);
  } else if (node.type === "quote") {
    walk(node.value, fn);
  }
}

function field(mapNode, key) {
  if (!mapNode || mapNode.type !== "map") return null;
  for (let i = 0; i + 1 < mapNode.values.length; i += 2) {
    if (canonicalize(mapNode.values[i]) === key) return mapNode.values[i + 1];
  }
  return null;
}

export async function gradeScenario(scenario, targetPath, options = {}) {
  const failures = [];
  const content = await fs.readFile(targetPath, "utf8");
  const forms = parseFences(content);

  if (scenario === "S1") {
    let hasAnswerKind = false;
    walk({ type: "vector", values: forms }, (n) => {
      const k = field(n, ":kind");
      if (k && canonicalize(k) === ":answer") hasAnswerKind = true;
    });
    if (!hasAnswerKind) failures.push("missing :kind :answer classification");
    if (options.flowCreated) failures.push("FLOW.md must not be created for :kind :answer");
    if (options.startupBytes && options.startupBytes > 20 * 1024) {
      failures.push(`startup bytes ${options.startupBytes} exceeded 20 KB budget`);
    }
    return { ok: failures.length === 0, scenario, failures };
  }

  if (scenario === "S2") {
    const lintRes = await lint(targetPath);
    const errors = lintRes.diagnostics.filter((d) => d.severity === ":error");
    if (errors.length > 0) failures.push(`lint errors: ${errors.map((e) => e.rule).join(", ")}`);

    let hasMutation = false;
    let hasWhy = false;
    let hasSingleGoal = false;
    let hasOpenMark = false;
    let ratedOptionsOk = false;
    walk({ type: "vector", values: forms }, (n) => {
      const k = field(n, ":kind");
      if (k && canonicalize(k) === ":mutation") {
        hasMutation = true;
        const whyNode = field(n, ":why");
        if (
          (whyNode?.type === "string" && whyNode.value.trim().length > 0) ||
          (whyNode?.type === "symbol" && whyNode.value === "?")
        ) {
          hasWhy = true;
        }
        const goalNode = field(n, ":goal");
        if (goalNode?.type === "string" && goalNode.value.trim().length > 0) {
          hasSingleGoal = true;
        }
      }
      if (n.type === "symbol" && n.value === "?") hasOpenMark = true;
      const opts = field(n, ":options");
      if (opts && opts.type === "vector" && opts.values.length >= 2) {
        const allRated = opts.values.every((opt) => {
          const id = field(opt, ":id");
          const conf = field(opt, ":confidence");
          return id?.type === "keyword" && conf?.type === "number" && Number(conf.value) >= 0 && Number(conf.value) <= 100;
        });
        if (allRated) ratedOptionsOk = true;
      }
    });
    if (!hasMutation) failures.push("missing :kind :mutation");
    if (!hasWhy) failures.push("missing :why (proposed intent string or ?) on :mutation");
    if (!hasSingleGoal) failures.push("missing single :goal string on :mutation");
    if (!hasOpenMark) failures.push("missing ? for unresolved scope");
    if (!ratedOptionsOk) failures.push("missing lettered, 0..100 rated :options");
    return { ok: failures.length === 0, scenario, failures };
  }

  if (scenario === "S3") {
    const lintRes = await lint(targetPath);
    const errors = lintRes.diagnostics.filter((d) => d.severity === ":error");
    if (errors.length > 0) failures.push(`lint errors: ${errors.map((e) => e.rule).join(", ")}`);
    let usedRegisteredTool = false;
    walk({ type: "vector", values: forms }, (n) => {
      const vb = field(n, ":verified-by");
      if (vb && vb.type === "string") {
        if (/(?:fmgraph|roslyn|asmdef_reach|tool-|why:)/iu.test(vb.value)) {
          usedRegisteredTool = true;
        }
      }
    });
    if (!usedRegisteredTool) failures.push("findings do not ground in a registered tool or explicit fallback reason");
    return { ok: failures.length === 0, scenario, failures };
  }

  if (scenario === "S4" || scenario === "S5") {
    const lintRes = await lint(targetPath);
    const errors = lintRes.diagnostics.filter((d) => d.severity === ":error");
    if (errors.length > 0) failures.push(`lint errors: ${errors.map((e) => e.rule).join(", ")}`);

    let hasCond = false;
    let hasExits = false;
    let leakedLabel = false;
    walk({ type: "vector", values: forms }, (n) => {
      if (n.type === "map" && field(n, ":makes") && field(n, ":flow")) {
        walk(n, (sub) => {
          if (sub.type === "string" && /(?:decisions?|contra)\s+:[a-z0-9-]+/iu.test(sub.value)) {
            leakedLabel = true;
          }
        });
      }
      if (n.type === "list" && n.values[0]?.type === "symbol" && n.values[0].value === "cond") {
        hasCond = true;
      }
      const ex = field(n, ":exits");
      if (ex && ex.type === "set" && ex.values.length > 0) hasExits = true;
    });
    if (leakedLabel) failures.push("bare decision/contra id leaked inside prose string");
    if (!hasCond) failures.push("missing cond branch in algorithm spine");
    if (!hasExits) failures.push("missing non-empty :exits set");
    return { ok: failures.length === 0, scenario, failures };
  }

  if (scenario === "S6") {
    const lintRes = await lint(targetPath);
    const errors = lintRes.diagnostics.filter((d) => d.severity === ":error");
    if (errors.length > 0) failures.push(`lint errors: ${errors.map((e) => e.rule).join(", ")}`);

    let hasSubjectWhy = false;
    let hasCallSteps = false;
    let allLives = true;
    let sawData = false;
    walk({ type: "vector", values: forms }, (n) => {
      if (n.type !== "map") return;
      if (field(n, ":structure") && field(n, ":touches")) {
        const w = field(n, ":why");
        if (w?.type === "string" && w.value.trim().length > 0) hasSubjectWhy = true;
      }
      if (field(n, ":calls") && field(n, ":out")) hasCallSteps = true;
      for (let i = 0; i + 1 < n.values.length; i += 2) {
        const k = n.values[i];
        const v = n.values[i + 1];
        if (k.type === "keyword" && k.value.endsWith("/data") && v.type === "map") {
          sawData = true;
          for (let j = 1; j < v.values.length; j += 2) {
            if (!field(v.values[j], ":lives")) allLives = false;
          }
        }
      }
    });
    if (!hasSubjectWhy) failures.push("missing non-empty :why in # Subject map");
    if (!sawData) failures.push("missing :<Name>/data map");
    if (!hasCallSteps) failures.push("entry :flow steps must use {:calls Method :out :key}");
    if (!allLives) failures.push("every structure data entry must declare :lives");
    if (options.requiredDataKeys) {
      for (const reqKey of options.requiredDataKeys) {
        if (!content.includes(reqKey)) failures.push(`missing algorithm data key ${reqKey}`);
      }
    }
    return { ok: failures.length === 0, scenario, failures };
  }

  if (scenario === "S7") {
    const lintRes = await lint(targetPath);
    const errors = lintRes.diagnostics.filter((d) => d.severity === ":error");
    if (errors.length > 0) failures.push(`lint errors: ${errors.map((e) => e.rule).join(", ")}`);

    let sawRejection = false;
    const categoryCounts = new Map();
    walk({ type: "vector", values: forms }, (n) => {
      if (n.type !== "map") return;
      const opord = field(n, ":opord");
      const details = field(n, ":details");
      if (!opord) return;
      sawRejection = true;
      const why = field(opord, ":why");
      const goal = field(opord, ":goal");
      if (!why || why.type !== "string" || why.value.trim() === "") {
        failures.push("rejection :opord missing non-empty :why");
      }
      if (!goal || goal.type !== "string" || goal.value.trim() === "") {
        failures.push("rejection :opord missing non-empty :goal");
      }
      if (!details || details.type !== "vector" || details.values.length === 0) {
        failures.push("rejection missing non-empty :details vector");
      } else {
        for (const d of details.values) {
          const ho = field(d, ":human-opinion");
          const bc = field(d, ":bad-code");
          if (!ho || ho.type !== "string" || ho.value.trim() === "") {
            failures.push("rejection detail missing non-empty :human-opinion");
          }
          if (!bc || bc.type !== "string" || bc.value.trim() === "") {
            failures.push("rejection detail missing non-empty :bad-code");
          }
        }
      }
      const cat = field(n, ":category");
      if (cat?.type === "keyword") {
        categoryCounts.set(cat.value, (categoryCounts.get(cat.value) ?? 0) + 1);
      }
    });
    if (!sawRejection) failures.push("no operator rejection entry {:opord :details} found");
    if (options.categorized) {
      for (const [cat, count] of categoryCounts.entries()) {
        if (count > 4) failures.push(`category ${cat} has ${count} entries (> 4 canonical cap)`);
      }
    }
    return { ok: failures.length === 0, scenario, failures };
  }

  throw new Error(`Unknown scenario: ${scenario}`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [scenario, target] = process.argv.slice(2);
  if (!scenario || !target) {
    console.error("Usage: node evals/grade.js <S1|S2|S3|S4|S5|S6|S7> <file.md>");
    process.exit(1);
  }
  const res = await gradeScenario(scenario, path.resolve(target));
  console.log(JSON.stringify(res, null, 2));
  process.exit(res.ok ? 0 : 1);
}

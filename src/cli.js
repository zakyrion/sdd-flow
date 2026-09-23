import {
  diffProject,
  doctorProject,
  initProject,
  uninstallProject,
  unlinkProject,
  updateProject,
} from "./core.js";
import { lint } from "./analyzer.js";

const HELP = `Usage:
  sdd-flow init [project] --tools codex,claude [--force]
  sdd-flow update [project] [--force]
  sdd-flow doctor [project]
  sdd-flow diff [project] [--file path]...
  sdd-flow unlink [project] [--file path]...
  sdd-flow uninstall [project]
  sdd-flow lint <path> [--text]

Commands:
  init       Install the shared contract and selected native adapters.
  update     Regenerate managed files from the installed package.
  doctor     Report missing, modified, stale, or invalid managed artifacts.
  diff       Compare a project's copy of the canon against the installed version.
  unlink     Strip sdd-flow marked blocks from documents the project owns.
  uninstall  Remove only unmodified managed artifacts; preserve config and FLOWs.
  lint       Report form diagnostics for a task folder or one document.

Notes:
  init never touches AGENTS.md or CLAUDE.md. Writing into a document the project
  owns is the sdd-project-init skill's job, under the owner's confirmation, and
  only ever inside a marked block that unlink can remove.
`;

export async function main(argv) {
  const parsed = parseArguments(argv);
  if (parsed.help) {
    console.log(HELP);
    return;
  }

  let result;
  if (parsed.command === "init") {
    if (!parsed.tools) {
      throw new Error("init requires --tools codex,claude");
    }
    result = await initProject(parsed.project, parsed.tools, {
      force: parsed.force,
    });
  } else if (parsed.command === "update") {
    result = await updateProject(parsed.project, { force: parsed.force });
  } else if (parsed.command === "doctor") {
    if (parsed.force || parsed.tools) {
      throw new Error("doctor does not accept --force or --tools");
    }
    result = await doctorProject(parsed.project);
    if (!result.ok) {
      for (const issue of result.issues) {
        console.error(`- ${issue}`);
      }
      throw new Error(`doctor found ${result.issues.length} issue(s)`);
    }
  } else if (parsed.command === "diff") {
    if (parsed.force || parsed.tools) {
      throw new Error("diff does not accept --force or --tools");
    }
    result = await diffProject(parsed.project, { files: parsed.files });
  } else if (parsed.command === "unlink") {
    if (parsed.force || parsed.tools) {
      throw new Error("unlink does not accept --force or --tools");
    }
    result = await unlinkProject(parsed.project, { files: parsed.files });
  } else if (parsed.command === "uninstall") {
    if (parsed.force || parsed.tools) {
      throw new Error("uninstall does not accept --force or --tools");
    }
    result = await uninstallProject(parsed.project);
  } else if (parsed.command === "lint") {
    if (parsed.force || parsed.tools) {
      throw new Error("lint does not accept --force or --tools");
    }
    const lintResult = await lint(parsed.project, { text: parsed.text });
    console.log(formatResult(lintResult));
    const errorCount = lintResult.diagnostics.filter(
      (diagnostic) => diagnostic.severity === ":error",
    ).length;
    if (errorCount > 0) {
      throw new Error(`lint found ${errorCount} error(s)`);
    }
    return;
  } else {
    throw new Error(`unknown command: ${parsed.command}\n\n${HELP}`);
  }

  console.log(formatResult(result));
}

export function parseArguments(argv) {
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    return { help: true };
  }
  const command = argv[0];
  let project = ".";
  let tools = null;
  let force = false;
  let text = false;
  let projectSet = false;
  const files = [];

  for (let index = 1; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--force") {
      force = true;
    } else if (argument === "--text") {
      text = true;
    } else if (argument === "--tools") {
      index += 1;
      if (index >= argv.length) {
        throw new Error("--tools requires a value");
      }
      tools = argv[index];
    } else if (argument.startsWith("--tools=")) {
      tools = argument.slice("--tools=".length);
    } else if (argument === "--file") {
      index += 1;
      if (index >= argv.length) {
        throw new Error("--file requires a value");
      }
      files.push(argv[index]);
    } else if (argument.startsWith("--file=")) {
      files.push(argument.slice("--file=".length));
    } else if (argument.startsWith("-")) {
      throw new Error(`unknown option: ${argument}`);
    } else if (!projectSet) {
      project = argument;
      projectSet = true;
    } else {
      throw new Error(`unexpected argument: ${argument}`);
    }
  }
  if (files.length > 0 && command !== "diff" && command !== "unlink") {
    throw new Error(`${command} does not accept --file`);
  }
  if (text && command !== "lint") {
    throw new Error(`${command} does not accept --text`);
  }
  return { command, project, tools, force, files, text, help: false };
}

function formatResult(result) {
  if (result.action === "initialized" || result.action === "updated") {
    return `${result.action}: ${result.root} [${result.tools.join(",")}] (${result.managedFiles} managed files)`;
  }
  if (result.action === "diffed") {
    return formatDiff(result);
  }
  if (result.action === "unlinked") {
    if (result.changed.length === 0) {
      return `unlink: ${result.root} (no sdd-flow blocks found)`;
    }
    return `unlink: ${result.root} (${result.blocks.length} block(s) removed from ${result.changed.join(", ")})`;
  }
  if (result.action === "uninstalled") {
    return `uninstalled: ${result.root} (${result.removed.length} managed files removed; config and FLOWs preserved)`;
  }
  if (result.action === "linted") {
    return result.report;
  }
  return `doctor: ${result.root} clean (${result.managedFiles} managed files)`;
}

function formatDiff(result) {
  const lines = [`diff: ${result.root} (${result.canonSize} canon definitions)`];
  for (const entry of result.files) {
    if (entry.status === "missing") {
      lines.push(`  ${entry.file}: not found`);
      continue;
    }
    const differs = entry.definitions.filter((d) => d.status === "differs");
    const same = entry.definitions.filter((d) => d.status === "same");
    const local = entry.definitions.filter((d) => d.status === "local-only");
    lines.push(
      `  ${entry.file}: ${same.length} in sync, ${differs.length} drifted, ${local.length} local-only`,
    );
    for (const definition of differs) {
      lines.push(`    drifted: ${definition.name}`);
    }
    for (const definition of local) {
      lines.push(`    local-only: ${definition.name}`);
    }
  }
  if (result.canonOnly.length > 0) {
    lines.push(`  not copied here: ${result.canonOnly.join(", ")}`);
  }
  return lines.join("\n");
}

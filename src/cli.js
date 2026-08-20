import {
  doctorProject,
  initProject,
  uninstallProject,
  updateProject,
} from "./core.js";

const HELP = `Usage:
  sdd-flow init [project] --tools codex,claude [--force]
  sdd-flow update [project] [--force]
  sdd-flow doctor [project]
  sdd-flow uninstall [project]

Commands:
  init       Install the shared contract and selected native adapters.
  update     Regenerate managed files from the installed package.
  doctor     Report missing, modified, stale, or invalid managed artifacts.
  uninstall  Remove only unmodified managed artifacts; preserve config and FLOWs.
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
  } else if (parsed.command === "uninstall") {
    if (parsed.force || parsed.tools) {
      throw new Error("uninstall does not accept --force or --tools");
    }
    result = await uninstallProject(parsed.project);
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
  let projectSet = false;

  for (let index = 1; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--force") {
      force = true;
    } else if (argument === "--tools") {
      index += 1;
      if (index >= argv.length) {
        throw new Error("--tools requires a value");
      }
      tools = argv[index];
    } else if (argument.startsWith("--tools=")) {
      tools = argument.slice("--tools=".length);
    } else if (argument.startsWith("-")) {
      throw new Error(`unknown option: ${argument}`);
    } else if (!projectSet) {
      project = argument;
      projectSet = true;
    } else {
      throw new Error(`unexpected argument: ${argument}`);
    }
  }
  return { command, project, tools, force, help: false };
}

function formatResult(result) {
  if (result.action === "initialized" || result.action === "updated") {
    return `${result.action}: ${result.root} [${result.tools.join(",")}] (${result.managedFiles} managed files)`;
  }
  if (result.action === "uninstalled") {
    return `uninstalled: ${result.root} (${result.removed.length} managed files removed; config and FLOWs preserved)`;
  }
  return `doctor: ${result.root} clean (${result.managedFiles} managed files)`;
}

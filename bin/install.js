#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skillsRoot = path.join(packageRoot, "skills");

const runtimes = [
  {
    id: "codex",
    flag: "--codex",
    displayName: "Codex",
    dirName: ".codex",
    envVar: "CODEX_HOME"
  },
  {
    id: "claude",
    flag: "--claude",
    displayName: "Claude Code",
    dirName: ".claude",
    envVar: "CLAUDE_CONFIG_DIR"
  },
  {
    id: "cursor",
    flag: "--cursor",
    displayName: "Cursor",
    dirName: ".cursor",
    envVar: "CURSOR_CONFIG_DIR"
  },
  {
    id: "copilot",
    flag: "--copilot",
    displayName: "GitHub Copilot",
    dirName: ".github",
    envVar: "COPILOT_CONFIG_DIR"
  },
  {
    id: "agents",
    flag: "--agents",
    displayName: "Generic agents",
    dirName: ".agents",
    envVar: "AGENTS_HOME"
  },
  {
    id: "gemini",
    flag: "--gemini",
    displayName: "Gemini CLI",
    dirName: ".gemini",
    envVar: "GEMINI_CONFIG_DIR"
  },
  {
    id: "qwen",
    flag: "--qwen",
    displayName: "Qwen Code",
    dirName: ".qwen",
    envVar: "QWEN_CONFIG_DIR"
  }
];

const runtimeById = new Map(runtimes.map((runtime) => [runtime.id, runtime]));
const runtimeByFlag = new Map(runtimes.map((runtime) => [runtime.flag, runtime]));

function printHelp() {
  console.log(`Install Simple Skills.

Usage:
  simple-skills [options]

Options:
  --codex             Install for Codex.
  --claude            Install for Claude Code.
  --cursor            Install for Cursor.
  --copilot           Install for GitHub Copilot.
  --agents            Install for generic Agent Skills runtimes.
  --gemini            Install for Gemini CLI.
  --qwen              Install for Qwen Code.
  --all               Install for all supported runtimes.
  --skill <name>      Install one skill. May be repeated.
  --list              List packaged skills.
  -g, --global        Install globally.
  -l, --local         Install into the current project.
  --config-dir <dir>  Use a custom runtime config directory.
  --dest <dir>        Install to an explicit skill directory.
  --codex-home <dir>  Compatibility alias for --codex --global --config-dir.
  --force             Replace existing installed skills.
  --dry-run           Print the install plan without writing files.
  --help, -h          Show this help message.

Examples:
  npx @simplexd/simple-skills@latest
  npx @simplexd/simple-skills@latest --codex --global
  npx @simplexd/simple-skills@latest --claude --local
  npx @simplexd/simple-skills@latest --all --global
  npx @simplexd/simple-skills@latest --codex --global --skill thread-to-skill
`);
}

function readValue(args, index, flag) {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${flag}`);
  }
  return value;
}

function parseArgs(args) {
  const options = {
    force: false,
    dryRun: false,
    help: false,
    list: false,
    all: false,
    global: false,
    local: false,
    dest: null,
    codexHome: null,
    configDir: null,
    runtimeIds: [],
    skillNames: []
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (runtimeByFlag.has(arg)) {
      options.runtimeIds.push(runtimeByFlag.get(arg).id);
    } else if (arg === "--all") {
      options.all = true;
    } else if (arg === "--list") {
      options.list = true;
    } else if (arg === "--skill") {
      options.skillNames.push(readValue(args, index, arg));
      index += 1;
    } else if (arg === "--global" || arg === "-g") {
      options.global = true;
    } else if (arg === "--local" || arg === "-l") {
      options.local = true;
    } else if (arg === "--force") {
      options.force = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--dest") {
      options.dest = readValue(args, index, arg);
      index += 1;
    } else if (arg === "--codex-home") {
      options.codexHome = readValue(args, index, arg);
      index += 1;
    } else if (arg === "--config-dir" || arg === "-c") {
      options.configDir = readValue(args, index, arg);
      index += 1;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (options.dest && options.codexHome) {
    throw new Error("Use either --dest or --codex-home, not both.");
  }
  if (options.dest && options.configDir) {
    throw new Error("Use either --dest or --config-dir, not both.");
  }
  if (options.global && options.local) {
    throw new Error("Use either --global or --local, not both.");
  }
  if (options.codexHome && options.configDir) {
    throw new Error("Use either --codex-home or --config-dir, not both.");
  }

  options.runtimeIds = [...new Set(options.runtimeIds)];
  options.skillNames = [...new Set(options.skillNames)];
  if (options.all) {
    options.runtimeIds = runtimes.map((runtime) => runtime.id);
  }

  return options;
}

function expandTilde(filePath) {
  if (filePath === "~") {
    return os.homedir();
  }
  if (filePath?.startsWith("~/")) {
    return path.join(os.homedir(), filePath.slice(2));
  }
  return filePath;
}

function resolveRuntimeRoot(runtime, installLocation, configDir) {
  if (installLocation === "local") {
    return path.join(process.cwd(), runtime.dirName);
  }

  if (configDir) {
    return path.resolve(expandTilde(configDir));
  }

  const configured = runtime.envVar ? process.env[runtime.envVar] : null;
  return path.resolve(expandTilde(configured || path.join(os.homedir(), runtime.dirName)));
}

function readSkillFrontmatter(skillFile) {
  const raw = fs.readFileSync(skillFile, "utf8");
  if (!raw.startsWith("---")) {
    return {};
  }

  const end = raw.indexOf("\n---", 3);
  if (end === -1) {
    return {};
  }

  const frontmatter = raw.slice(3, end).trim().split(/\r?\n/);
  const result = {};
  for (const line of frontmatter) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (match) {
      result[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
  return result;
}

function discoverSkills() {
  if (!fs.existsSync(skillsRoot)) {
    throw new Error(`Packaged skills directory is missing: ${skillsRoot}`);
  }

  return fs
    .readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const sourceDir = path.join(skillsRoot, entry.name);
      const skillFile = path.join(sourceDir, "SKILL.md");
      if (!fs.existsSync(skillFile)) {
        return null;
      }

      const frontmatter = readSkillFrontmatter(skillFile);
      return {
        name: frontmatter.name || entry.name,
        dirName: entry.name,
        description: frontmatter.description || "",
        sourceDir
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function selectSkills(options, discoveredSkills) {
  if (options.skillNames.length === 0) {
    return discoveredSkills;
  }

  const selected = [];
  for (const skillName of options.skillNames) {
    const skill = discoveredSkills.find((candidate) => candidate.name === skillName || candidate.dirName === skillName);
    if (!skill) {
      throw new Error(`Unknown skill: ${skillName}`);
    }
    selected.push(skill);
  }
  return selected;
}

function printSkillList(discoveredSkills) {
  console.log("Packaged skills:");
  for (const skill of discoveredSkills) {
    const summary = skill.description ? ` - ${skill.description}` : "";
    console.log(`- ${skill.name}${summary}`);
  }
}

function resolveDestinations(options, selectedSkills) {
  if (options.dest) {
    if (selectedSkills.length !== 1) {
      throw new Error("Use --skill with --dest when more than one skill is packaged.");
    }
    return [
      {
        skill: selectedSkills[0],
        runtime: { id: "custom", displayName: "Custom destination" },
        destination: path.resolve(expandTilde(options.dest))
      }
    ];
  }

  const runtimeIds = options.runtimeIds.length > 0 ? options.runtimeIds : ["codex"];
  const installLocation = options.local ? "local" : "global";
  const configDir = options.codexHome || options.configDir;

  if (options.codexHome && runtimeIds.some((runtimeId) => runtimeId !== "codex")) {
    throw new Error("--codex-home can only be used with Codex installs.");
  }
  if (options.configDir && runtimeIds.length > 1) {
    throw new Error("--config-dir can only be used with one runtime at a time.");
  }

  return runtimeIds.flatMap((runtimeId) => {
    const runtime = runtimeById.get(runtimeId);
    if (!runtime) {
      throw new Error(`Unknown runtime: ${runtimeId}`);
    }
    const root = resolveRuntimeRoot(runtime, installLocation, configDir);
    return selectedSkills.map((skill) => ({
      runtime,
      skill,
      destination: path.join(root, "skills", skill.dirName)
    }));
  });
}

function createPrompt() {
  if (!process.stdin.isTTY) {
    const answers = fs.readFileSync(0, "utf8").split(/\r?\n/);
    let index = 0;

    return {
      async question(label) {
        process.stdout.write(label);
        return answers[index++] ?? "";
      },
      close() {}
    };
  }

  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

async function promptForRuntimes(prompt) {
  console.log("Choose runtime:");
  runtimes.forEach((runtime, index) => {
    console.log(`  ${index + 1}. ${runtime.displayName}`);
  });
  console.log(`  ${runtimes.length + 1}. All`);

  const answer = (await prompt.question("Runtime [1]: ")).trim() || "1";
  const selected = answer
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);

  if (selected.includes(String(runtimes.length + 1)) || selected.includes("all")) {
    return runtimes.map((runtime) => runtime.id);
  }

  const ids = selected.map((item) => {
    const number = Number(item);
    if (Number.isInteger(number) && number >= 1 && number <= runtimes.length) {
      return runtimes[number - 1].id;
    }

    const runtime = runtimes.find((candidate) => candidate.id === item || candidate.flag === `--${item}`);
    if (!runtime) {
      throw new Error(`Unknown runtime selection: ${item}`);
    }
    return runtime.id;
  });

  return [...new Set(ids)];
}

async function promptForLocation(prompt) {
  console.log("Install location:");
  console.log("  1. Global");
  console.log("  2. Local project");
  console.log("  3. Custom destination");

  const answer = (await prompt.question("Location [1]: ")).trim() || "1";
  if (answer === "1" || answer.toLowerCase() === "global") {
    return { global: true };
  }
  if (answer === "2" || answer.toLowerCase() === "local") {
    return { local: true };
  }
  if (answer === "3" || answer.toLowerCase() === "custom") {
    const destination = (await prompt.question("Destination directory: ")).trim();
    if (!destination) {
      throw new Error("Missing custom destination.");
    }
    return { dest: destination };
  }

  throw new Error(`Unknown install location: ${answer}`);
}

async function completeInteractiveOptions(options) {
  if (options.help || options.list || options.dest || options.codexHome) {
    return options;
  }

  const shouldPromptRuntime = options.runtimeIds.length === 0;
  const shouldPromptLocation = !options.global && !options.local && !options.configDir;
  if (!shouldPromptRuntime && !shouldPromptLocation) {
    return options;
  }

  const prompt = createPrompt();
  try {
    if (shouldPromptRuntime) {
      options.runtimeIds = await promptForRuntimes(prompt);
    }
    if (shouldPromptLocation) {
      Object.assign(options, await promptForLocation(prompt));
    }
  } finally {
    prompt.close();
  }

  return options;
}

function printPlan(plans, options) {
  console.log(`Source: ${skillsRoot}`);
  console.log(options.dryRun ? "Dry run:" : "Install plan:");
  for (const plan of plans) {
    const exists = fs.existsSync(plan.destination);
    console.log(`- ${plan.runtime.displayName} / ${plan.skill.name}: ${plan.destination}${exists ? " (exists)" : ""}`);
  }
}

function installPlans(plans, options) {
  if (options.dryRun) {
    return;
  }

  for (const plan of plans) {
    if (fs.existsSync(plan.destination) && !options.force) {
      throw new Error(`Skill already exists at ${plan.destination}. Re-run with --force to replace it.`);
    }
  }

  for (const plan of plans) {
    if (fs.existsSync(plan.destination)) {
      fs.rmSync(plan.destination, { recursive: true, force: true });
    }

    fs.mkdirSync(path.dirname(plan.destination), { recursive: true });
    fs.cpSync(plan.skill.sourceDir, plan.destination, { recursive: true });
    console.log(`Installed ${plan.skill.name} for ${plan.runtime.displayName}.`);
  }
}

async function install() {
  const options = await completeInteractiveOptions(parseArgs(process.argv.slice(2)));

  if (options.help) {
    printHelp();
    return;
  }

  const discoveredSkills = discoverSkills();
  if (discoveredSkills.length === 0) {
    throw new Error(`No packaged skills found in ${skillsRoot}`);
  }

  if (options.list) {
    printSkillList(discoveredSkills);
    return;
  }

  const selectedSkills = selectSkills(options, discoveredSkills);
  const plans = resolveDestinations(options, selectedSkills);
  printPlan(plans, options);
  installPlans(plans, options);
  if (!options.dryRun) {
    console.log("Restart your AI runtime to pick up new skills.");
  }
}

try {
  await install();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

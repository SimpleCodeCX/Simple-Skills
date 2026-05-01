#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const skillName = "thread-to-skill";
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.join(packageRoot, "skills", skillName);

function printHelp() {
  console.log(`Install the ${skillName} Codex skill.

Usage:
  thread-to-skill [options]

Options:
  --force             Replace an existing installed skill.
  --dry-run           Print the install plan without writing files.
  --dest <dir>        Install to an explicit skill directory.
  --codex-home <dir>  Use a custom Codex home directory.
  --help              Show this help message.

Default destination:
  $CODEX_HOME/skills/${skillName}
  ~/.codex/skills/${skillName} when CODEX_HOME is not set
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
    dest: null,
    codexHome: null
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--force") {
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
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (options.dest && options.codexHome) {
    throw new Error("Use either --dest or --codex-home, not both.");
  }

  return options;
}

function resolveDestination(options) {
  if (options.dest) {
    return path.resolve(options.dest);
  }

  const codexHome = options.codexHome
    ? path.resolve(options.codexHome)
    : process.env.CODEX_HOME || path.join(os.homedir(), ".codex");

  return path.join(codexHome, "skills", skillName);
}

function install() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const sourceSkill = path.join(sourceDir, "SKILL.md");
  if (!fs.existsSync(sourceSkill)) {
    throw new Error(`Packaged skill is missing: ${sourceSkill}`);
  }

  const destination = resolveDestination(options);
  const exists = fs.existsSync(destination);

  console.log(`Source: ${sourceDir}`);
  console.log(`Destination: ${destination}`);

  if (options.dryRun) {
    if (exists && !options.force) {
      console.log("Plan: existing skill found; install would stop unless --force is used.");
    } else {
      console.log(exists ? "Plan: replace existing skill." : "Plan: install new skill.");
    }
    return;
  }

  if (exists && !options.force) {
    throw new Error(`Skill already exists at ${destination}. Re-run with --force to replace it.`);
  }

  if (exists) {
    fs.rmSync(destination, { recursive: true, force: true });
  }

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(sourceDir, destination, { recursive: true });

  console.log(`Installed ${skillName}.`);
  console.log("Restart Codex to pick up new skills.");
}

try {
  install();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

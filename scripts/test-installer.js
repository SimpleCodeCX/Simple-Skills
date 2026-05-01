import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const installer = path.join(repoRoot, "bin", "install.js");
const skillsRoot = path.join(repoRoot, "skills");
const fixtureSkillName = "suite-fixture-skill";

function makeTempDir(name) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `${name}-`));
}

function runInstaller(args, options = {}) {
  const home = options.home ?? makeTempDir("thread-to-skill-home");
  const cwd = options.cwd ?? repoRoot;
  const result = spawnSync(process.execPath, [installer, ...args], {
    cwd,
    input: options.input ?? "",
    encoding: "utf8",
    env: {
      HOME: home,
      USERPROFILE: home,
      PATH: process.env.PATH ?? "",
      TMPDIR: os.tmpdir(),
      TERM: "dumb"
    }
  });

  return { ...result, home, cwd };
}

function withFixtureSkill(callback) {
  const fixtureDir = path.join(skillsRoot, fixtureSkillName);
  fs.rmSync(fixtureDir, { recursive: true, force: true });
  fs.mkdirSync(fixtureDir, { recursive: true });
  fs.writeFileSync(
    path.join(fixtureDir, "SKILL.md"),
    [
      "---",
      `name: ${fixtureSkillName}`,
      "description: Test-only fixture skill.",
      "---",
      "",
      "# Suite Fixture Skill",
      ""
    ].join("\n")
  );

  try {
    callback();
  } finally {
    fs.rmSync(fixtureDir, { recursive: true, force: true });
  }
}

function assertInstalled(rootDir, runtimeDir, skillName = "thread-to-skill") {
  const skillFile = path.join("skills", skillName, "SKILL.md");
  assert.ok(
    fs.existsSync(path.join(rootDir, runtimeDir, skillFile)),
    `expected skill at ${path.join(rootDir, runtimeDir, skillFile)}`
  );
}

function assertNotInstalled(rootDir, runtimeDir, skillName) {
  assert.equal(
    fs.existsSync(path.join(rootDir, runtimeDir, "skills", skillName, "SKILL.md")),
    false,
    `did not expect ${skillName} to be installed under ${runtimeDir}`
  );
}

test("installs globally for Codex with non-interactive flags", () => {
  const result = runInstaller(["--codex", "--global", "--force"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Codex/);
  assertInstalled(result.home, ".codex");
});

test("installs locally for Claude Code with non-interactive flags", () => {
  const project = makeTempDir("thread-to-skill-project");
  const result = runInstaller(["--claude", "--local", "--force"], { cwd: project });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Claude Code/);
  assertInstalled(project, ".claude");
});

test("installs globally for all supported runtimes", () => {
  const result = runInstaller(["--all", "--global", "--force"]);

  assert.equal(result.status, 0, result.stderr);
  for (const runtimeDir of [".codex", ".claude", ".cursor", ".github", ".agents", ".gemini", ".qwen"]) {
    assertInstalled(result.home, runtimeDir);
  }
});

test("dry-run prints all destinations without writing files", () => {
  const result = runInstaller(["--all", "--global", "--dry-run"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Dry run/);
  assert.match(result.stdout, /\.codex\/skills\/thread-to-skill/);
  assert.match(result.stdout, /\.claude\/skills\/thread-to-skill/);
  assert.equal(fs.existsSync(path.join(result.home, ".codex")), false);
  assert.equal(fs.existsSync(path.join(result.home, ".claude")), false);
});

test("dry-run succeeds even when a destination already exists", () => {
  const home = makeTempDir("thread-to-skill-existing-home");
  fs.mkdirSync(path.join(home, ".codex", "skills", "thread-to-skill", "SKILL.md"), { recursive: true });

  const result = runInstaller(["--codex", "--global", "--dry-run"], { home });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /\(exists\)/);
});

test("lists every discovered skill", () => {
  withFixtureSkill(() => {
    const result = runInstaller(["--list"]);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /thread-to-skill/);
    assert.match(result.stdout, new RegExp(fixtureSkillName));
  });
});

test("installs every discovered skill by default", () => {
  withFixtureSkill(() => {
    const result = runInstaller(["--codex", "--global", "--force"]);

    assert.equal(result.status, 0, result.stderr);
    assertInstalled(result.home, ".codex", "thread-to-skill");
    assertInstalled(result.home, ".codex", fixtureSkillName);
  });
});

test("installs only selected skills when --skill is used", () => {
  withFixtureSkill(() => {
    const result = runInstaller(["--codex", "--global", "--force", "--skill", fixtureSkillName]);

    assert.equal(result.status, 0, result.stderr);
    assertInstalled(result.home, ".codex", fixtureSkillName);
    assertNotInstalled(result.home, ".codex", "thread-to-skill");
  });
});

test("supports repeated --skill filters", () => {
  withFixtureSkill(() => {
    const result = runInstaller([
      "--codex",
      "--global",
      "--force",
      "--skill",
      "thread-to-skill",
      "--skill",
      fixtureSkillName
    ]);

    assert.equal(result.status, 0, result.stderr);
    assertInstalled(result.home, ".codex", "thread-to-skill");
    assertInstalled(result.home, ".codex", fixtureSkillName);
  });
});

test("prompts for runtime and install location when flags are omitted", () => {
  const project = makeTempDir("thread-to-skill-interactive-project");
  const result = runInstaller([], {
    cwd: project,
    input: "1\n2\n"
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Choose runtime/);
  assert.match(result.stdout, /Install location/);
  assertInstalled(project, ".codex");
});

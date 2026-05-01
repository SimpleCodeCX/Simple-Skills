# Simple Skills

Install the Simple Skills Agent Skill suite with `npx`.

## Install

```bash
npx @simplexd/simple-skills@latest
```

The installer prompts you to choose:

1. Runtime: Codex, Claude Code, Cursor, GitHub Copilot, generic agents, Gemini CLI, Qwen Code, or all.
2. Location: global runtime config or local project config.

By default, every packaged skill under `skills/` is installed. Restart your AI runtime after installing so the new skills are loaded.

## Non-Interactive Install

```bash
npx @simplexd/simple-skills@latest --codex --global
npx @simplexd/simple-skills@latest --claude --global
npx @simplexd/simple-skills@latest --cursor --local
npx @simplexd/simple-skills@latest --all --global
```

Install a single skill:

```bash
npx @simplexd/simple-skills@latest --codex --global --skill thread-to-skill
```

List packaged skills:

```bash
npx @simplexd/simple-skills@latest --list
```

Supported runtime flags:

```bash
--codex
--claude
--cursor
--copilot
--agents
--gemini
--qwen
--all
```

Location and control flags:

```bash
--global
--local
--skill <name>
--list
--config-dir <dir>
--dest <dir>
--force
--dry-run
```

## Local Development

```bash
npm test
npm run pack:dry-run
```

## Publish

Before publishing, confirm that the npm scope `@simplexd` is available to your npm account.

```bash
npm login
npm run pack:dry-run
npm publish --registry https://registry.npmjs.org/
```

The package uses `publishConfig.access=public`, so scoped publishes are public by default.

## Legacy Package

`@simplexd/thread-to-skill` is the original single-skill package. New skills should be added under `skills/` and published through `@simplexd/simple-skills`.

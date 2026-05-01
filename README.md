# Thread to Skill

Install the `thread-to-skill` Codex skill with `npx`.

## Install

```bash
npx @simplecodecx/thread-to-skill@latest
```

Then restart Codex so the new skill is loaded.

## Options

```bash
npx @simplecodecx/thread-to-skill@latest --force
npx @simplecodecx/thread-to-skill@latest --dry-run
npx @simplecodecx/thread-to-skill@latest --codex-home ~/.codex
npx @simplecodecx/thread-to-skill@latest --dest ~/.codex/skills/thread-to-skill
```

## Local Development

```bash
npm test
npm run pack:dry-run
```

## Publish

Before publishing, confirm that the npm scope `@simplecodecx` is available to your npm account.
If it is not, update the `name` field in `package.json`.

```bash
npm login
npm run pack:dry-run
npm publish --registry https://registry.npmjs.org/
```

The package uses `publishConfig.access=public`, so scoped publishes are public by default.

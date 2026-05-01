# Quick Spec: Change npm scope to simplexd

## Background

Publishing under `@simplecodecx/thread-to-skill` failed because the npm scope does not exist for the current account. The active npm account is `simplexd`, so the package should publish under that user scope.

## Change Scope

- Files: `package.json`, `README.md`
- Behavior change: npm package/install references move from `@simplecodecx/thread-to-skill` to `@simplexd/thread-to-skill`

## Acceptance Criteria

- [ ] `package.json` publishes as `@simplexd/thread-to-skill`
- [ ] README install examples use `@simplexd/thread-to-skill`
- [ ] `npm test` and `npm pack --dry-run` pass before publish

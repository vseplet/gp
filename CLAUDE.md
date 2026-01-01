# Claude Code Guidelines

## Before Every Commit

Always run before committing:

```bash
deno task fmt && deno task lint
```

## Git Commits

Use [Conventional Commits](https://www.conventionalcommits.org/) format for
automatic versioning:

| Prefix                        | Version bump          | Example                           |
| ----------------------------- | --------------------- | --------------------------------- |
| `feat:`                       | minor (0.1.0 → 0.2.0) | `feat: add backup command`        |
| `fix:`                        | patch (0.1.0 → 0.1.1) | `fix: handle empty profile name`  |
| `perf:`                       | patch                 | `perf: optimize config loading`   |
| `refactor:`                   | patch                 | `refactor: extract git utilities` |
| `feat!:` or `BREAKING CHANGE` | major (0.1.0 → 1.0.0) | `feat!: change config format`     |

Other prefixes (`docs:`, `chore:`, `test:`, `ci:`) do NOT trigger a release.

## Push Policy

Always ask for user approval before pushing to remote.

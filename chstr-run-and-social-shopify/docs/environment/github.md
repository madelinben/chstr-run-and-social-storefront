# GitHub (this target)

Concrete mechanics for the git-host choice this project made at intake. If the project uses GitLab, Bitbucket, or another host instead, this file does not apply — write its equivalent (`docs/environment/gitlab.md`, etc.) with that host's real CLI/CI shape rather than guessing GitHub's onto it.

## PR mechanics (generic law: `pull-requests.mdc`)

1. Ensure the branch is on the remote (`git push -u` if needed).
2. If no open PR for `HEAD`: `gh pr create` with the body from the template, passed via HEREDOC.
3. If a PR already exists: `gh pr edit <n> --body` with a refreshed template fill from `origin/main...HEAD` (every commit + file list on the branch — not just the tip commit).
4. Return the PR URL.

```bash
gh pr create --title "the pr title" --body "$(cat <<'EOF'
## Summary
...
EOF
)"
```

## CI wiring

Workflow files live at the git root, `../.github/workflows/ci-shopify.yml` (path-filtered to this app, runs in this folder). Plan/build/test stages run there, not locally, for anything gated on merge (typecheck, lint, test, build — `ci-shopify.yml`).

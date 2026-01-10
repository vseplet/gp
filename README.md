# Git Profile Manager

> **gp** — tool for managing multiple git identities

## Why?

If you have multiple GitHub/GitLab accounts (personal, work, open-source), you
know the pain:

- Commits go out with the wrong name/email
- SSH keys conflict between accounts
- Manual config changes for every repo

**gp** fixes this. Create profiles once, then just pick one when cloning or
apply to existing repos.

## Install

```bash
curl -fsSL https://raw.githubusercontent.com/vseplet/gp/main/install.sh | bash
```

This will install [Deno](https://deno.land/) (if not present) and gp.

## Usage

### Create a profile

```bash
gp profile add work
```

You'll be prompted for name and email. An SSH key is generated automatically —
add the public key to GitHub/GitLab.

### List profiles

```bash
gp profile list
```

### Clone with a profile

```bash
gp clone git@github.com:user/repo.git -p work
```

Or without `-p` for interactive selection:

```bash
gp clone git@github.com:user/repo.git
```

The repo is cloned using the profile's SSH key and configured automatically.

### Apply profile to existing repo

```bash
cd my-repo
gp use work
```

Creates a new profile (or picks existing) and applies it to the current repo in
one step.

### Backup and restore

```bash
# Export all profiles with SSH keys
gp backup export ~/my-profiles.tar.gz

# Import on another machine
gp backup import ~/my-profiles.tar.gz

# Overwrite existing profiles
gp backup import ~/my-profiles.tar.gz --force
```

## How it works

Each profile stores:

- **name** — Git commit author name
- **email** — Git commit author email
- **sshKey** — Path to SSH private key

Profiles are saved in `~/.gitprofiles.json`. SSH keys are stored in
`~/.ssh/gitprofile_<name>`.

When you apply a profile, gp sets local repo config:

```bash
git config user.name "..."
git config user.email "..."
git config core.sshCommand "ssh -i ~/.ssh/gitprofile_<name> -o IdentitiesOnly=yes"
```

## Fun fact

This project was built as an experiment in mobile programming — just for fun
while waiting for food to be prepared.

Setup: Samsung S25 + Termux + Claude Code + Rokid Max 2 AR glasses + voice
control.

## License

MIT

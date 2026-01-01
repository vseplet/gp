# Git Profile Manager

> **gp** — CLI tool for managing multiple Git identities

## Why?

If you have multiple GitHub/GitLab accounts (personal, work, open-source), you
know the pain:

- Commits go out with the wrong name/email
- SSH keys conflict between accounts
- Manual config changes for every repo

**gp** fixes this. Create profiles once, then just pick one when cloning or
apply to existing repos.

## Install

Requires [Deno](https://deno.land/).

```bash
deno install -g -n gp -rf --allow-read --allow-write --allow-run --allow-env \
  --import-map=https://cdn.jsdelivr.net/gh/vseplet/gp@main/import_map.json \
  https://cdn.jsdelivr.net/gh/vseplet/gp@main/mod.ts
```

Or from source:

```bash
git clone https://github.com/vseplet/gp.git
cd gp
deno task install
```

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

### Remove a profile

```bash
gp profile remove work

# Keep the SSH key
gp profile remove work --keep-key
```

### Show profile details

```bash
gp profile show work
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

## License

MIT

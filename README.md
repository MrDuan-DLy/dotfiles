# Dotfiles

Managed with [chezmoi](https://www.chezmoi.io/) and Homebrew. Secrets are encrypted with [age](https://www.chezmoi.io/user-guide/encryption/age/) before they enter the repository.

## Managed Files

| Source path | Target path | Purpose | Secret handling |
| --- | --- | --- | --- |
| `Brewfile` | none | Homebrew packages and casks for macOS bootstrap | Stored in repo, ignored as a target dotfile |
| `dot_claude/settings.json.tmpl` | `~/.claude/settings.json` | Claude Code settings with OS-specific vault paths | No plaintext secrets |
| `dot_claude/skills/notes/` | `~/.claude/skills/notes/` | Personal `/notes` knowledge workflow | No plaintext secrets |
| `dot_config/aerospace/aerospace.toml` | `~/.config/aerospace/aerospace.toml` | AeroSpace window manager | No plaintext secrets |
| `dot_config/ghostty/config` | `~/.config/ghostty/config` | Primary terminal config | No plaintext secrets |
| `dot_config/kitty/kitty.conf` | `~/.config/kitty/kitty.conf` | Kitty fallback terminal config | No plaintext secrets |
| `dot_config/nvim/` | `~/.config/nvim/` | LazyVim-based Neovim config | Nested starter `.git` is ignored |
| `dot_gitconfig` | `~/.gitconfig` | Git identity and defaults | Uses GitHub noreply email |
| `dot_ssh/encrypted_config.age` | `~/.ssh/config` | SSH host aliases | Encrypted with age |
| `dot_tmux.conf` | `~/.tmux.conf` | tmux workflow and terminal integration | No plaintext secrets |
| `tampermonkey/` | none | Userscripts installable by raw GitHub URL | Stored in repo, ignored as target dotfiles |

## New Mac Setup

```bash
# Install Homebrew first if needed:
# /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

brew install chezmoi age bitwarden-cli git

bw config server <YOUR_BW_SERVER>
bw login
export BW_SESSION="$(bw unlock --raw)"
mkdir -p ~/.config/chezmoi
bw get notes "chezmoi age key" > ~/.config/chezmoi/key.txt
chmod 600 ~/.config/chezmoi/key.txt

chezmoi init --apply git@github.com:MrDuan-DLy/dotfiles.git
chezmoi cd
brew bundle --file Brewfile
chezmoi apply
```

After applying on macOS:

- Enable AeroSpace in System Settings if macOS asks for Accessibility permission.
- Open Ghostty once so macOS registers the app and loads the managed config.
- Keep Kitty installed as a fallback terminal.
- Restart tmux servers, or reload tmux with `prefix r`.

## Daily Workflow

Use chezmoi as the review gate between local config files and the public repo:

```bash
chezmoi status
chezmoi diff
chezmoi apply
chezmoi cd
git status --short
git diff --check
```

Recommended edit flows:

```bash
chezmoi edit ~/.tmux.conf
chezmoi edit --apply ~/.config/ghostty/config
chezmoi add ~/.config/aerospace/aerospace.toml
chezmoi add --encrypt ~/.ssh/config
```

Pull and review remote changes before applying:

```bash
chezmoi git pull -- --autostash --rebase
chezmoi diff
chezmoi apply
```

## Security Checklist

This repository is designed to be safe for GitHub, but it is still public-dotfiles territory. Before pushing:

```bash
chezmoi status
chezmoi diff
git diff --check
rg -n --hidden --glob '!**/.git/**' --glob '!**/*.age' -i \
  '(password|passwd|secret|token|api[_-]?key|private[_-]?key|BEGIN .*PRIVATE KEY|ghp_|github_pat_|AKIA[0-9A-Z]{16}|xox[baprs]-|-----BEGIN)' .
```

Rules:

- Never commit `~/.config/chezmoi/key.txt`, private SSH keys, `.env`, cloud credentials, package tokens, or password-manager sessions.
- Add sensitive files with `chezmoi add --encrypt`, not plain `chezmoi add`.
- Keep `.chezmoiignore` conservative for machine-local state and credentials.
- Keep automatic git push disabled; review and push manually.
- Treat age recipients as public metadata, but treat the age identity file as a secret.

## Homebrew

The `Brewfile` is the machine bootstrap manifest. It is stored in the repo but ignored as a target dotfile.

```bash
brew bundle check --file Brewfile --verbose
brew bundle install --file Brewfile
brew outdated
brew upgrade
brew cleanup
```

Notes:

- Use Apple Clang for normal macOS builds unless a project explicitly needs upstream LLVM tooling.
- Use Homebrew `llvm` for `clangd`, `clang-tidy`, newer LLVM tools, or language/toolchain work that needs upstream features.
- `brew autoremove` may remove old versioned LLVM formulae once nothing depends on them; keep the unversioned `llvm` formula for current upstream LLVM.

## Terminal Workflow

Ghostty is the default terminal. Kitty remains installed as a reliable fallback.

| Shortcut | Action |
| --- | --- |
| `alt-t` | Open Ghostty |
| `alt-shift-t` | Open Kitty |
| `cmd+backquote` | Toggle Ghostty quick terminal |

Clipboard integration:

- Ghostty and Kitty both advertise true color and OSC52 support.
- tmux uses `set-clipboard on`.
- Neovim uses system clipboard locally and OSC52 over SSH.

For a one-off remote copy:

```bash
ssh user@host 'cat /path/to/file' | pbcopy
```

## AeroSpace

AeroSpace is installed by the Brewfile and configured at `~/.config/aerospace/aerospace.toml`.

| Shortcut | Action |
| --- | --- |
| `alt-ctrl-h/j/k/l` | Focus tiled window left/down/up/right |
| `alt-ctrl-shift-h/j/k/l` | Move focused window left/down/up/right |
| `alt-1` ... `alt-9` | Switch workspace |
| `alt-shift-1` ... `alt-shift-9` | Move focused window to workspace |
| `alt-/` | Toggle tiles orientation |
| `alt-,` | Toggle accordion layout |
| `alt--` / `alt-=` | Resize focused window |
| `alt-shift-tab` | Move workspace to next monitor |
| `alt-shift-;`, then `r` | Reset current workspace layout |
| `alt-shift-;`, then `f` | Toggle floating/tiling |
| `alt-shift-;`, then `t` | Force current window into tiled layout |
| `alt-shift-;`, then `b` | Balance window sizes |
| `alt-shift-;`, then `esc` | Reload AeroSpace config |

## Tampermonkey

Install on a new machine from Tampermonkey -> Utilities -> Import from URL:

| Script | URL |
| --- | --- |
| BB Discussion Extractor | `https://raw.githubusercontent.com/MrDuan-DLy/dotfiles/main/tampermonkey/BB-Discussion-Extractor.user.js` |
| Claude Chat Exporter | `https://raw.githubusercontent.com/MrDuan-DLy/dotfiles/main/tampermonkey/Claude-Chat-Exporter.user.js` |
| Transcript Extractor | `https://raw.githubusercontent.com/MrDuan-DLy/dotfiles/main/tampermonkey/bb-transcript-extractor.user.js` |

## Claude Code `/notes` Skill

Personal knowledge management for the Obsidian vault:

| Command | Description |
| --- | --- |
| `/notes` | Dashboard: inbox count, review due, stats |
| `/notes extract [topic]` | Extract durable notes from the current AI conversation |
| `/notes process` | Process `inbox.md` into cards, references, glossaries, daily blocks, and map updates |
| `/notes review` | Spaced repetition review |
| `/notes weekly` | Generate weekly learning summary |
| `/notes query <topic>` | Search and show knowledge connections |
| `/notes import <url>` | Import external content into vault |
| `/notes maintain [scope]` | Audit note types, repair links, trim review noise, and improve map integration |

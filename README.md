# Dotfiles

Managed by [chezmoi](https://www.chezmoi.io/). Secrets encrypted with [age](https://github.com/FiloSottile/age), keys stored in self-hosted [Vaultwarden](https://github.com/dani-garcia/vaultwarden).

## What's Managed

| Path | Description | Encrypted |
|------|-------------|-----------|
| `~/.claude/settings.json` | Claude Code settings (OS-templated vault path) | No |
| `~/.claude/skills/notes/` | `/notes` knowledge management skill | No |
| `~/.config/aerospace/aerospace.toml` | AeroSpace tiling window manager | No |
| `~/.config/nvim/` | Neovim (LazyVim) config | No |
| `~/.config/kitty/kitty.conf` | Kitty terminal config | No |
| `~/.gitconfig` | Git global config | No |
| `~/.ssh/config` | SSH config (hosts, aliases) | **Yes** (age) |
| `~/.tmux.conf` | Tmux config | No |
| `tampermonkey/` | Tampermonkey userscripts (not managed by chezmoi, raw URL install) | No |

## New Machine Setup

```bash
# 1. Install bootstrap tools
brew install chezmoi age bitwarden-cli

# 2. Restore age key from Bitwarden
bw config server <YOUR_BW_SERVER>
bw login
export BW_SESSION=$(bw unlock --raw)
mkdir -p ~/.config/chezmoi
bw get notes "chezmoi age key" > ~/.config/chezmoi/key.txt
chmod 600 ~/.config/chezmoi/key.txt

# 3. Init + apply
chezmoi init --apply <THIS_REPO>

# 4. Install macOS packages from this repo
chezmoi cd
brew bundle --file Brewfile
chezmoi apply
```

After applying on macOS:

- Open System Settings → Privacy & Security → Accessibility and enable AeroSpace if macOS asks for permission.
- Open kitty once so macOS registers the terminal app and loads the managed config.
- In an existing tmux server, reload with `prefix r`, or start a new server.

## AeroSpace Usage

AeroSpace is installed by the Brewfile and configured at `~/.config/aerospace/aerospace.toml`.

| Shortcut | Action |
|----------|--------|
| `alt-enter` | Open a new kitty window |
| `alt-h/j/k/l` | Focus window left/down/up/right |
| `alt-shift-h/j/k/l` | Move focused window left/down/up/right |
| `alt-1` … `alt-9` | Switch workspace |
| `alt-shift-1` … `alt-shift-9` | Move focused window to workspace |
| `alt-/` | Toggle tiles orientation |
| `alt-,` | Toggle accordion layout |
| `alt--` / `alt-=` | Resize focused window |
| `alt-tab` | Switch back to previous workspace |
| `alt-shift-tab` | Move workspace to next monitor |
| `alt-shift-;`, then `r` | Reset/flatten current workspace layout |
| `alt-shift-;`, then `f` | Toggle floating/tiling |
| `alt-shift-;`, then `b` | Balance window sizes |
| `alt-shift-;`, then `esc` | Reload AeroSpace config |

## Terminal Clipboard

kitty, tmux, and Neovim are configured for OSC52 clipboard integration:

- local Neovim uses `unnamedplus`, so normal yanks go to the system clipboard;
- remote Neovim over SSH uses Neovim's `osc52` provider;
- tmux has `set-clipboard on`, so programs inside tmux can write the local clipboard through kitty.

For a one-off remote copy, this is still the simplest path:

```bash
ssh user@host 'cat /path/to/file' | pbcopy
```

## Tampermonkey Scripts

Self-written userscripts, stored in this repo for cross-machine sync. Not managed by chezmoi (in `.chezmoiignore`).

Install on a new machine: Tampermonkey → Utilities → Import from URL:

| Script | URL |
|--------|-----|
| BB Discussion Extractor | `https://raw.githubusercontent.com/MrDuan-DLy/dotfiles/main/tampermonkey/BB-Discussion-Extractor.user.js` |
| Claude Chat Exporter | `https://raw.githubusercontent.com/MrDuan-DLy/dotfiles/main/tampermonkey/Claude-Chat-Exporter.user.js` |
| 自动提取字幕工具 | `https://raw.githubusercontent.com/MrDuan-DLy/dotfiles/main/tampermonkey/bb-transcript-extractor.user.js` |

## Claude Code `/notes` Skill

Personal knowledge management for Obsidian vault:

| Command | Description |
|---------|-------------|
| `/notes` | Dashboard: inbox count, review due, stats |
| `/notes extract [topic]` | Extract durable notes directly from the current AI conversation |
| `/notes process` | Process `inbox.md` into cards, references, glossaries, Daily blocks, and map updates |
| `/notes review` | Spaced repetition review (SM-2) |
| `/notes weekly` | Generate weekly learning summary |
| `/notes query <topic>` | Search and show knowledge connections |
| `/notes import <url>` | Import external content into vault |
| `/notes maintain [scope]` | Audit note types, repair links, trim review noise, and improve map integration |

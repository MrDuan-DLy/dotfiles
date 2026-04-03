# Dotfiles

Managed by [chezmoi](https://www.chezmoi.io/). Secrets encrypted with [age](https://github.com/FiloSottile/age), keys stored in self-hosted [Vaultwarden](https://github.com/dani-garcia/vaultwarden).

## What's Managed

| Path | Description | Encrypted |
|------|-------------|-----------|
| `~/.claude/settings.json` | Claude Code settings (OS-templated vault path) | No |
| `~/.claude/skills/notes/` | `/notes` knowledge management skill | No |
| `~/.config/nvim/` | Neovim (LazyVim) config | No |
| `~/.config/kitty/kitty.conf` | Kitty terminal config | No |
| `~/.gitconfig` | Git global config | No |
| `~/.ssh/config` | SSH config (hosts, aliases) | **Yes** (age) |
| `~/.tmux.conf` | Tmux config | No |
| `tampermonkey/` | Tampermonkey userscripts (not managed by chezmoi, raw URL install) | No |

## New Machine Setup

```bash
# 1. Install tools (macOS: brew, Linux: apt/npm)
brew install chezmoi age bitwarden-cli  # macOS
# Linux: sudo apt install age && npm install -g @bitwarden/cli

# 2. Restore age key from Bitwarden
bw config server <YOUR_BW_SERVER>
bw login
export BW_SESSION=$(bw unlock --raw)
mkdir -p ~/.config/chezmoi
bw get notes "chezmoi age key" > ~/.config/chezmoi/key.txt
chmod 600 ~/.config/chezmoi/key.txt

# 3. Init + apply
chezmoi init --apply <THIS_REPO>
```

## Tampermonkey Scripts

Self-written userscripts, stored in this repo for cross-machine sync. Not managed by chezmoi (in `.chezmoiignore`).

Install on a new machine: Tampermonkey → Utilities → Import from URL:

| Script | Install |
|--------|---------|
| BB Discussion Extractor | [Install](https://raw.githubusercontent.com/MrDuan-DLy/dotfiles/main/tampermonkey/BB-Discussion-Extractor.user.js) |
| Claude Chat Exporter | [Install](https://raw.githubusercontent.com/MrDuan-DLy/dotfiles/main/tampermonkey/Claude-Chat-Exporter.user.js) |
| 自动提取字幕工具 | [Install](https://raw.githubusercontent.com/MrDuan-DLy/dotfiles/main/tampermonkey/bb-transcript-extractor.user.js) |

## Claude Code `/notes` Skill

Personal knowledge management for Obsidian vault:

| Command | Description |
|---------|-------------|
| `/notes` | Dashboard: inbox count, review due, stats |
| `/notes process` | Extract knowledge cards from `inbox.md` |
| `/notes review` | Spaced repetition review (SM-2) |
| `/notes weekly` | Generate weekly learning summary |
| `/notes query <topic>` | Search and show knowledge connections |
| `/notes import <url>` | Import external content into vault |

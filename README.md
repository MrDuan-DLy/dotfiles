# Dotfiles

Managed by [chezmoi](https://www.chezmoi.io/). Secrets encrypted with [age](https://github.com/FiloSottile/age), keys stored in self-hosted [Vaultwarden](https://github.com/dani-garcia/vaultwarden) (`REDACTED_BW_SERVER`).

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

## Devices

| Device | OS | chezmoi | Notes |
|--------|-----|---------|-------|
| Mac (primary) | macOS arm64 | Full | Main development machine |
| WSL | Debian x64 | Full | Windows Subsystem for Linux |
| Windows | Windows x64 | Manual | No chezmoi, sync manually |

## New Machine Setup

### macOS

```bash
# 1. Install tools
brew install chezmoi age bitwarden-cli

# 2. Restore age key from Bitwarden
bw config server https://REDACTED_BW_SERVER
bw login
export BW_SESSION=$(bw unlock --raw)
mkdir -p ~/.config/chezmoi
bw get notes "chezmoi age key" > ~/.config/chezmoi/key.txt
chmod 600 ~/.config/chezmoi/key.txt

# 3. Init + apply (chezmoi config auto-generated from .chezmoi.toml.tmpl)
chezmoi init --apply git@github.com:MrDuan-DLy/dotfiles.git

# 4. Load SSH keys into agent (no disk writes)
bw get notes "SSH - GitHub (shalud)" | ssh-add -
bw get notes "SSH - AWS Server" | ssh-add -
```

### Linux / WSL

```bash
# 1. Install tools
sudo apt install age
# chezmoi
sh -c "$(curl -fsLS get.chezmoi.io)" -- -b ~/.local/bin
# bw CLI (requires Node.js 20+)
npm install -g @bitwarden/cli

# 2. Restore age key (same as macOS step 2)
bw config server https://REDACTED_BW_SERVER
bw login
export BW_SESSION=$(bw unlock --raw)
mkdir -p ~/.config/chezmoi
bw get notes "chezmoi age key" > ~/.config/chezmoi/key.txt
chmod 600 ~/.config/chezmoi/key.txt

# 3. Init + apply
chezmoi init --apply git@github.com:MrDuan-DLy/dotfiles.git
```

## Templates

`settings.json.tmpl` sets `OBSIDIAN_VAULT` path per OS:
- **macOS**: `/Users/sean/Documents/Obsidian/notes/obsidian-knowledge-system`
- **Linux**: `/home/sean/Documents/Obsidian/notes/obsidian-knowledge-system`
- **Windows**: `C:\Users\Sean\Documents\College\notes\ai-notes\obsidian-knowledge-system`

## Claude Code `/notes` Skill

A personal knowledge management skill synced across machines:

| Command | Description |
|---------|-------------|
| `/notes` | Dashboard: inbox count, review due, total cards |
| `/notes process` | Extract knowledge cards from `inbox.md` |
| `/notes review` | Spaced repetition review (SM-2 algorithm) |
| `/notes weekly` | Generate weekly learning summary |
| `/notes query <topic>` | Search knowledge base and show connections |
| `/notes import <url>` | Import external content into vault |

## Related Services

- **Obsidian LiveSync**: CouchDB on Azure UK (`REDACTED_SYNC_SERVER`), syncs vault across devices
- **Vaultwarden**: Self-hosted on Tencent Cloud, credentials at `REDACTED_BW_SERVER`
- **Tailscale**: Connects all devices (Mac, WSL/Windows, Azure, Tencent, Oracle servers)

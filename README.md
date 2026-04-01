# Dotfiles

Managed by [chezmoi](https://www.chezmoi.io/). Secrets encrypted with [age](https://github.com/FiloSottile/age), keys stored in [Bitwarden](https://bitwarden.com/) (self-hosted).

## New Machine Setup

```bash
# 1. Install tools
brew install chezmoi age bitwarden-cli

# 2. Restore age key (from Bitwarden)
bw config server https://<YOUR_BITWARDEN_DOMAIN>
bw login
mkdir -p ~/.config/chezmoi
bw get notes "chezmoi age key" > ~/.config/chezmoi/key.txt
chmod 600 ~/.config/chezmoi/key.txt

# 3. Restore dotfiles + encrypted SSH config
chezmoi init --apply git@github.com:<YOUR_GITHUB_USER>/dotfiles.git

# 4. Load SSH keys into memory (no disk writes)
export BW_SESSION=$(bw unlock --raw)
bw get notes "SSH - GitHub (shalud)" | ssh-add -
bw get notes "SSH - AWS Server" | ssh-add -
# ... load more keys as needed
```

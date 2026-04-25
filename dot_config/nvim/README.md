# LazyVim config

Personal Neovim configuration based on [LazyVim](https://www.lazyvim.org/), managed with chezmoi.

## Layout

- `lua/config/options.lua`: editor options and global LazyVim switches.
- `lua/config/keymaps.lua`: personal keymaps.
- `lua/config/autocmds.lua`: personal autocmds.
- `lua/config/lazy.lua`: lazy.nvim bootstrap only; keep this close to the LazyVim starter.
- `lua/plugins/*.lua`: local plugin additions or overrides.
- `lazyvim.json`: LazyVim extras enabled with `:LazyExtras`.

## Extension rules

- Prefer `:LazyExtras` for language packs and first-party LazyVim feature bundles.
- Prefer `opts` over `config = function() ... end` when customizing plugins.
- Add one focused file under `lua/plugins/` per feature area or plugin.
- Disable built-in plugins with `{ "plugin/name", enabled = false }` in `lua/plugins/disabled.lua`.
- Keep generated runtime state out of chezmoi; do not manage `.config/nvim/.git`.

## Maintenance

```vim
:Lazy update
:Lazy health
:checkhealth
```

After changing local config, persist it with:

```sh
chezmoi add ~/.config/nvim
chezmoi diff
```

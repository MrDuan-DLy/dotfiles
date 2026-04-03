-- Keymaps are automatically loaded on the VeryLazy event
-- Default keymaps that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/keymaps.lua
-- Add any additional keymaps here

-- Alt + 方向键切换窗口（和 tmux 一致）
vim.keymap.set("n", "<M-Left>", "<C-w>h")
vim.keymap.set("n", "<M-Right>", "<C-w>l")
vim.keymap.set("n", "<M-Up>", "<C-w>k")
vim.keymap.set("n", "<M-Down>", "<C-w>j")

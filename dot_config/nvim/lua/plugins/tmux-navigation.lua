return {
  {
    "alexghergh/nvim-tmux-navigation",
    event = "VeryLazy",
    opts = {
      disable_when_zoomed = true,
      keybindings = {
        left = "<M-h>",
        down = "<M-j>",
        up = "<M-k>",
        right = "<M-l>",
      },
    },
    config = function(_, opts)
      local nav = require("nvim-tmux-navigation")
      nav.setup(opts)

      vim.keymap.set("n", "<M-Left>", nav.NvimTmuxNavigateLeft, { desc = "Navigate left" })
      vim.keymap.set("n", "<M-Down>", nav.NvimTmuxNavigateDown, { desc = "Navigate down" })
      vim.keymap.set("n", "<M-Up>", nav.NvimTmuxNavigateUp, { desc = "Navigate up" })
      vim.keymap.set("n", "<M-Right>", nav.NvimTmuxNavigateRight, { desc = "Navigate right" })
    end,
  },
}

return {
  "neovim/nvim-lspconfig",
  opts = {
    servers = {
      hls = {
        settings = {
          haskell = {
            plugin = {
              -- Disable noisy type lenses; keep inline hints as the primary type signal.
              ["ghcide-type-lenses"] = { globalOn = false },
            },
          },
        },
      },
    },
  },
}

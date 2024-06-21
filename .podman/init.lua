vim.g.mapleader     = " "           -- Mapleader is the spacebar
vim.o.showmatch     = false         -- Don't flash highlight matching parens
vim.o.ignorecase    = true          -- Case insensitive search
vim.o.hlsearch      = true          -- Highlight as you search
vim.o.incsearch     = true          -- Incremental search
vim.o.tabstop       = 2             -- Tabs are 2 spaces
vim.o.softtabstop   = 2             -- See multiple spaces as tabstops so <BS> does the right thing
vim.o.expandtab     = true          -- Convert tabs to whitespaces
vim.o.shiftwidth    = 2             -- Width for autoindent
vim.g.markdown_recommended_style = 0  -- Respect tabstop even in markdown files
vim.o.autoindent    = true          -- Indent a new line the same amount as the line just typed
vim.o.smartindent   = true          -- Increase indent after {, etc
vim.o.number        = true          -- Show line numbers
vim.o.wildmenu      = true          -- Display matches when we tab-complete
vim.o.wildignore    = vim.o.wildignore .. "*/node_modules/*"
vim.o.wildmode      = "longest,list"  -- Get bash-like tab completions
vim.o.syntax        = "on"          -- Syntax highlighting on
vim.o.mouse         = "a"           -- Enable mouse click
vim.o.clipboard     = "unnamedplus" -- Use system clipboard
vim.o.cursorline    = false          -- Highlight current cursorline
vim.o.ttyfast       = true          -- Speed up scrolling in vim
vim.o.relativenumber= false         -- Relative line numbers
vim.o.linebreak     = true          -- Don't break words when wrapping
vim.o.list          = true          -- Show trailing whitespaces
vim.o.splitbelow    = true          -- Default splits to below / right so the new pane is selected
vim.o.splitright    = true
vim.o.backupcopy    = 'yes'         -- Don't bork file watchers when we save
vim.o.shell         = 'bash'        -- Use bash in nvim :terminal

vim.opt.signcolumn = 'yes'
vim.opt.completeopt = {'menu', 'menuone', 'noinsert'}

-- I don't want to navigate by actual lines, but rather by visual lines
-- e.g. respecting wraps.
vim.keymap.set('n', 'j', 'gj');
vim.keymap.set('n', 'k', 'gk');
vim.keymap.set('n', '0', 'g0');
vim.keymap.set('n', '$', 'g$');

-- Ctrl+s
vim.keymap.set('n', '<c-s>', '<esc>:w<cr>')
vim.keymap.set('i', '<c-s>', '<esc>:w<cr>')

-- Easier split pane shortcuts
-- Space-J go to left pane, Space-K got to right pane, etc
vim.keymap.set('n', '<leader>j', '<c-w><c-j>')
vim.keymap.set('n', '<leader>k', '<c-w><c-k>')
vim.keymap.set('n', '<leader>l', '<c-w><c-l>')
vim.keymap.set('n', '<leader>h', '<c-w><c-h>')

-- Escape in terminal mode is the same as in edit mode
vim.keymap.set('t', '<esc>', '<c-\\><c-n>')

-- Use lazy.nvim for plugin management
local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not vim.loop.fs_stat(lazypath) then
  vim.fn.system({
    "git",
    "clone",
    "--filter=blob:none",
    "https://github.com/folke/lazy.nvim.git",
    "--branch=stable", -- latest stable release
    lazypath,
  })
end

vim.opt.rtp:prepend(lazypath)

require("lazy").setup({
  -- Tree sitter
  {
    'nvim-treesitter/nvim-treesitter',
    build = ':TSUpdate',
    config = function ()
      local configs = require("nvim-treesitter.configs")

      configs.setup({
          ensure_installed = { "javascript", "lua", "vim", "vimdoc", "typescript", "tsx", "html", "css", "markdown" },
          sync_install = false,
          highlight = { enable = true },
          indent = { enable = true },
        })
    end
  },

  -- Language server protocol
  { 'neovim/nvim-lspconfig' },

  -- Fuzzy Finder (files, lsp, etc)
  {
    'nvim-telescope/telescope.nvim',
    event = 'VimEnter',
    branch = '0.1.x',
    dependencies = {
      'nvim-lua/plenary.nvim',
      {
        'nvim-telescope/telescope-fzf-native.nvim',
        build = 'make',
        cond = function()
          return vim.fn.executable 'make' == 1
        end,
      },
      { 'nvim-telescope/telescope-ui-select.nvim' },
    },
  },

  -- Autocompletion
  {
    'hrsh7th/nvim-cmp',
    dependencies = {
      'hrsh7th/cmp-nvim-lsp',
      'hrsh7th/cmp-buffer',
      'hrsh7th/cmp-path',
      'hrsh7th/cmp-cmdline',
      'hrsh7th/cmp-vsnip',
      'hrsh7th/vim-vsnip',
    }
  },

  -- Format on save
  {
    "stevearc/conform.nvim",
    event = { "BufWritePre" },
    cmd = { "ConformInfo" },
    keys = {
      {
        -- Customize or remove this keymap to your liking
        "<leader>pp",
        function()
          require("conform").format({ async = true, lsp_fallback = true })
        end,
        mode = "",
        desc = "Format buffer",
      },
    },
    -- Everything in opts will be passed to setup()
    opts = {
      -- Define your formatters
      formatters_by_ft = {
        lua = { "stylua" },
        python = { "isort", "black" },
        javascript = { { "prettierd", "prettier" } },
        typescript = { { "prettierd", "prettier" } },
        html = { { "prettierd", "prettier" } },
        css = { { "prettierd", "prettier" } },
        typescriptreact = { { "prettierd", "prettier" } },
      },
      -- Set up format-on-save
      format_on_save = { timeout_ms = 500, lsp_fallback = true },
      -- Customize formatters
      formatters = {
        shfmt = {
          prepend_args = { "-i", "2" },
        },
      },
    },
    init = function()
      -- If you want the formatexpr, here is the place to set it
      vim.o.formatexpr = "v:lua.require'conform'.formatexpr()"
    end,
  },
  -- Automatically close pairs
  {
    'windwp/nvim-autopairs',
    event = "InsertEnter",
    opts = {} -- this is equalent to setup({}) function
  },

  -- Git niceties
  { "tpope/vim-fugitive" },

  -- Yank to system clipboard even if in an ssh / remote shell
  { 'ibhagwan/smartyank.nvim' }
});

-- Format on save
-- require("conform").setup({
--   formatters_by_ft = {
--     lua = { "stylua" },
--     -- Conform will run multiple formatters sequentially
--     python = { "isort", "black" },
--     -- Use a sub-list to run only the first available formatter
--     javascript = { { "prettierd", "prettier" } },
--     typescript = { { "prettierd", "prettier" } },
--   },
-- })

-- Set up nvim-cmp.
function setup_cmp()
  local cmp = require'cmp'

  cmp.setup({
    snippet = {
      -- REQUIRED - you must specify a snippet engine
      expand = function(args)
        vim.fn["vsnip#anonymous"](args.body) -- For `vsnip` users.
      end,
    },
    window = {
      -- completion = cmp.config.window.bordered(),
      -- documentation = cmp.config.window.bordered(),
    },
    mapping = cmp.mapping.preset.insert({
      ['<C-b>'] = cmp.mapping.scroll_docs(-4),
      ['<C-f>'] = cmp.mapping.scroll_docs(4),
      ['<C-Space>'] = cmp.mapping.complete(),
      ['<C-e>'] = cmp.mapping.abort(),
      ['<CR>'] = cmp.mapping.confirm({ select = true }), -- Accept currently selected item. Set `select` to `false` to only confirm explicitly selected items.

      ['<Tab>'] = function(fallback)
        local has_words_before = function()
          unpack = unpack or table.unpack
          local line, col = unpack(vim.api.nvim_win_get_cursor(0))
          return col ~= 0 and vim.api.nvim_buf_get_lines(0, line - 1, line, true)[1]:sub(col, col):match('%s') == nil
        end

        if not cmp.select_next_item() then
          if vim.bo.buftype ~= 'prompt' and has_words_before() then
            cmp.complete()
          else
            fallback()
          end
        end
      end,
    }),
    sources = cmp.config.sources({
      { name = 'nvim_lsp' },
      { name = 'vsnip' }, -- For vsnip users.
      -- { name = 'luasnip' }, -- For luasnip users.
      -- { name = 'ultisnips' }, -- For ultisnips users.
      -- { name = 'snippy' }, -- For snippy users.
    }, {
      { name = 'buffer' },
    })
  })

  -- To use git you need to install the plugin petertriho/cmp-git and uncomment lines below
  -- Set configuration for specific filetype.
  --[[ cmp.setup.filetype('gitcommit', {
    sources = cmp.config.sources({
      { name = 'git' },
    }, {
      { name = 'buffer' },
    })
 })
 require("cmp_git").setup() ]]-- 

  -- Use buffer source for `/` and `?` (if you enabled `native_menu`, this won't work anymore).
  cmp.setup.cmdline({ '/', '?' }, {
    mapping = cmp.mapping.preset.cmdline(),
    sources = {
      { name = 'buffer' }
    }
  })

  -- Use cmdline & path source for ':' (if you enabled `native_menu`, this won't work anymore).
  cmp.setup.cmdline(':', {
    mapping = cmp.mapping.preset.cmdline(),
    sources = cmp.config.sources({
      { name = 'path' }
    }, {
      { name = 'cmdline' }
    }),
    matching = { disallow_symbol_nonprefix_matching = false }
  })

  -- Set up lspconfig.
  local capabilities = require('cmp_nvim_lsp').default_capabilities()
  local lsp = require('lspconfig')
  lsp.tailwindcss.setup{ capabilities = capabilities }
  lsp.tsserver.setup{ capabilities = capabilities }
  lsp.gopls.setup{ capabilities = capabilities }
end

setup_cmp()

-- LSP config
vim.api.nvim_create_autocmd('LspAttach', {
  desc = 'LSP keybindings',
  callback = function(event)
    local bufmap = function(mode, lhs, rhs)
      local opts = {buffer = event.buf}
      vim.keymap.set(mode, lhs, rhs, opts)
    end

    vim.api.nvim_buf_set_option(event.buf, 'omnifunc', 'v:lua.vim.lsp.omnifunc')

    -- Trigger LSP completion
    bufmap('i', '<C-Space>', '<C-x><C-o>')

    -- Displays hover information about the symbol under the cursor
    bufmap('n', 'K', '<cmd>lua vim.lsp.buf.hover()<cr>')

    -- Jump to the definition
    bufmap('n', 'gd', '<cmd>lua vim.lsp.buf.definition()<cr>')

    -- Jump to declaration
    bufmap('n', 'gD', '<cmd>lua vim.lsp.buf.declaration()<cr>')

    -- Lists all the implementations for the symbol under the cursor
    bufmap('n', 'gi', '<cmd>lua vim.lsp.buf.implementation()<cr>')

    -- Jumps to the definition of the type symbol
    bufmap('n', 'go', '<cmd>lua vim.lsp.buf.type_definition()<cr>')

    -- Lists all the references
    bufmap('n', 'gr', '<cmd>lua vim.lsp.buf.references()<cr>')

    -- Displays a function's signature information
    bufmap('n', 'gs', '<cmd>lua vim.lsp.buf.signature_help()<cr>')

    -- Renames all references to the symbol under the cursor
    bufmap('n', '<leader>rn', '<cmd>lua vim.lsp.buf.rename()<cr>')

    -- Format code in current buffer
    bufmap({'n', 'x'}, '<leader>cf', '<cmd>lua vim.lsp.buf.format({async = true})<cr>')

    -- Selects a code action available at the current cursor position
    bufmap('n', '<leader>ca', '<cmd>lua vim.lsp.buf.code_action()<cr>')

    -- Show diagnostics in a floating window
    bufmap('n', 'gl', '<cmd>lua vim.diagnostic.open_float()<cr>')

    -- Move to the previous diagnostic
    bufmap('n', '[d', '<cmd>lua vim.diagnostic.goto_prev()<cr>')

    -- Move to the next diagnostic
    bufmap('n', ']d', '<cmd>lua vim.diagnostic.goto_next()<cr>')
  end
})

-- Telescope bindings
function setup_telescope()
  local builtin = require('telescope.builtin')
  vim.keymap.set('n', '<leader>ff', builtin.find_files, { desc = '[F]ind [F]iles' })
  vim.keymap.set('n', '<leader>fg', builtin.live_grep, { desc = '[F]ind Live [G]rep' })
  vim.keymap.set('n', '<leader>fl', builtin.live_grep, { desc = '[F]ind [L]ive Grep' })
  vim.keymap.set('n', '<leader>fb', builtin.buffers, { desc = '[F]ind [B]uffers' })
  vim.keymap.set('n', '<leader>fh', builtin.help_tags, { desc = '[F]ind [H]elp Tags' })
  vim.keymap.set('n', '<leader>fd', builtin.current_buffer_fuzzy_find, { desc = '[F]ind Current Buffer' })
  vim.keymap.set('n', '<leader>fk', builtin.keymaps, { desc = '[F]ind [K]eymaps' })
  vim.keymap.set('n', '<leader>fs', builtin.builtin, { desc = '[F]ind [S]elect Telescope' })
  vim.keymap.set('n', '<leader>fp', builtin.diagnostics, { desc = '[F]ind LS[P] Diagnostics' })
  vim.keymap.set('n', '<leader>fr', builtin.resume, { desc = '[F]ind [R]esume' })
  vim.keymap.set('n', '<leader>f.', builtin.oldfiles, { desc = '[F]ind Recent Files ("." for repeat)' })
  vim.keymap.set('n', '<leader><leader>', builtin.buffers, { desc = '[ ] Find existing buffers' })

  -- Slightly advanced example of overriding default behavior and theme
  vim.keymap.set('n', '<leader>/', function()
    -- You can pass additional configuration to Telescope to change the theme, layout, etc.
    builtin.current_buffer_fuzzy_find(require('telescope.themes').get_dropdown {
      winblend = 10,
      previewer = false,
    })
  end, { desc = '[/] Fuzzily search in current buffer' })

  -- It's also possible to pass additional configuration options.
  --  See `:help telescope.builtin.live_grep()` for information about particular keys
  vim.keymap.set('n', '<leader>s/', function()
    builtin.live_grep {
      grep_open_files = true,
      prompt_title = 'Live Grep in Open Files',
    }
  end, { desc = '[S]earch [/] in Open Files' })

  -- Shortcut for searching your Neovim configuration files
  vim.keymap.set('n', '<leader>sn', function()
    builtin.find_files { cwd = vim.fn.stdpath 'config' }
  end, { desc = '[S]earch [N]eovim files' })
end

setup_telescope()

-- Yank to clipboard, etc, even from within podman
require('smartyank').setup {
  highlight = {
    enabled = true,         -- highlight yanked text
    timeout = 100,
  },
  clipboard = {
    enabled = true
  },
  tmux = {
    enabled = true,
    -- remove `-w` to disable copy to host client's clipboard
    cmd = { 'tmux', 'set-buffer', '-w' }
  },
  osc52 = {
    enabled = true,
    -- escseq = 'tmux',     -- use tmux escape sequence, only enable if
                            -- you're using tmux and have issues (see #4)
    ssh_only = false,       -- false to OSC52 yank also in local sessions
    silent = false,         -- true to disable the "n chars copied" echo
    echo_hl = "Directory",  -- highlight group of the OSC52 echo message
  },
  -- By default copy is only triggered by "intentional yanks" where the
  -- user initiated a `y` motion (e.g. `yy`, `yiw`, etc). Set to `false`
  -- if you wish to copy indiscriminately:
  validate_yank = false,
}


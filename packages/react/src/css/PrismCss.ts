/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * PrismCss – Centralized Prism.js setup.
 *
 * Imports Prism core, registers a curated set of language grammars, and
 * loads the default Prism CSS theme.  Import this module (side-effect
 * only) wherever Prism syntax highlighting is needed:
 *
 *   import '@datalayer/jupyter-react/lib/css/PrismCss';
 *
 * **Language load order matters**: `prism-clike` must come before
 * `prism-c`, `prism-javascript`, etc., and `prism-c` must come before
 * `prism-objectivec`.  The ordering below is intentionally correct.
 */

// 1. Core
import Prism from 'prismjs';

// 2. Set global so late-loading language components can find it
if (typeof window !== 'undefined') {
  (window as any).Prism = Prism;
}

// 3. Language grammars – ORDER MATTERS (base → derived)
//    Use .js extensions to match @lexical/code import specifiers for Vite
//    deduplication. All languages from @lexical/code are included here so
//    they are guaranteed to load in the correct dependency order.
import 'prismjs/components/prism-clike.js';
import 'prismjs/components/prism-javascript.js';
import 'prismjs/components/prism-markup.js';
import 'prismjs/components/prism-markdown.js';
import 'prismjs/components/prism-c.js';
import 'prismjs/components/prism-css.js';
import 'prismjs/components/prism-objectivec.js';
import 'prismjs/components/prism-sql.js';
import 'prismjs/components/prism-powershell.js';
import 'prismjs/components/prism-python.js';
import 'prismjs/components/prism-rust.js';
import 'prismjs/components/prism-swift.js';
import 'prismjs/components/prism-typescript.js';
import 'prismjs/components/prism-java.js';
import 'prismjs/components/prism-cpp.js';

// 4. Default theme
import 'prismjs/themes/prism.css';

export default Prism;

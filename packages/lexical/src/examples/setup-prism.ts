/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Setup Prism globally via the centralized PrismCss module from
 * @datalayer/jupyter-react. This ensures Prism core, language grammars,
 * and the default theme are loaded once in the correct order.
 */
import Prism from '@datalayer/jupyter-react/lib/css/PrismCss';

export default Prism;

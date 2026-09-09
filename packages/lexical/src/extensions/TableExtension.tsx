/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Tables, as a Lexical extension.
 *
 * `@lexical/table`'s `TableExtension` laid out the way this package's
 * stylesheet expects — no scrolling wrapper around the table — plus the
 * dialog behind `INSERT_TABLE_WITH_DIALOG_COMMAND`, rendered as a decorator
 * of the React extension since its place in the tree does not matter.
 *
 * @module extensions/TableExtension
 */

import { TableExtension as LexicalTableExtension } from '@lexical/table';
import { ReactExtension } from '@lexical/react/ReactExtension';
import { configExtension, defineExtension } from 'lexical';
import { TableInsertDialogPlugin } from '../plugins/TablePlugin';

export const TableExtension = defineExtension({
  name: '@datalayer/jupyter-lexical/Table',
  dependencies: [
    configExtension(LexicalTableExtension, { hasHorizontalScroll: false }),
    configExtension(ReactExtension, {
      decorators: [<TableInsertDialogPlugin />],
    }),
  ],
});

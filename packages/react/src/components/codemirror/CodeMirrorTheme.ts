/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';

const theme = EditorView.theme(
  {
    '&': {
      fontSize: '9pt',
      border: '1px solid var(--borderColor-default, #d0d7de)',
      backgroundColor: 'var(--bgColor-default, #ffffff)',
      color: 'var(--fgColor-default, #1f2328)',
    },
    '.cm-content': {
      fontFamily: 'Menlo, Monaco, Lucida Console, monospace',
      minHeight: '10px',
      color: 'var(--fgColor-default, #1f2328)',
      caretColor: 'var(--fgColor-accent, #0969da)',
    },
    '.cm-gutters': {
      minHeight: '10px',
      backgroundColor: 'var(--bgColor-muted, #f6f8fa)',
      color: 'var(--fgColor-muted, #656d76)',
      borderRight: '1px solid var(--borderColor-default, #d0d7de)',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      color: 'var(--fgColor-muted, #656d76)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'var(--bgColor-neutral-muted, rgba(175, 184, 193, 0.2))',
      color: 'var(--fgColor-default, #1f2328)',
    },
    '.cm-scroller': {
      overflow: 'auto',
      //    maxHeight: "600px"
    },
  },
  { dark: false }
);

export const codeMirrorTheme: Extension = [theme];

export default codeMirrorTheme;

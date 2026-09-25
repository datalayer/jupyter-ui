/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import type { EditorThemeClasses } from 'lexical';

const theme: EditorThemeClasses = {
  characterLimit: 'JupyterLexicalTheme__characterLimit',
  code: 'JupyterLexicalTheme__code',
  codeHighlight: {
    atrule: 'JupyterLexicalTheme__tokenAttr',
    attr: 'JupyterLexicalTheme__tokenAttr',
    boolean: 'JupyterLexicalTheme__tokenProperty',
    builtin: 'JupyterLexicalTheme__tokenSelector',
    cdata: 'JupyterLexicalTheme__tokenComment',
    char: 'JupyterLexicalTheme__tokenSelector',
    class: 'JupyterLexicalTheme__tokenFunction',
    'class-name': 'JupyterLexicalTheme__tokenFunction',
    comment: 'JupyterLexicalTheme__tokenComment',
    constant: 'JupyterLexicalTheme__tokenProperty',
    deleted: 'JupyterLexicalTheme__tokenProperty',
    doctype: 'JupyterLexicalTheme__tokenComment',
    entity: 'JupyterLexicalTheme__tokenOperator',
    function: 'JupyterLexicalTheme__tokenFunction',
    important: 'JupyterLexicalTheme__tokenVariable',
    inserted: 'JupyterLexicalTheme__tokenSelector',
    keyword: 'JupyterLexicalTheme__tokenAttr',
    namespace: 'JupyterLexicalTheme__tokenVariable',
    number: 'JupyterLexicalTheme__tokenProperty',
    operator: 'JupyterLexicalTheme__tokenOperator',
    prolog: 'JupyterLexicalTheme__tokenComment',
    property: 'JupyterLexicalTheme__tokenProperty',
    punctuation: 'JupyterLexicalTheme__tokenPunctuation',
    regex: 'JupyterLexicalTheme__tokenVariable',
    selector: 'JupyterLexicalTheme__tokenSelector',
    string: 'JupyterLexicalTheme__tokenSelector',
    symbol: 'JupyterLexicalTheme__tokenProperty',
    tag: 'JupyterLexicalTheme__tokenProperty',
    url: 'JupyterLexicalTheme__tokenOperator',
    variable: 'JupyterLexicalTheme__tokenVariable',
  },
  embedBlock: {
    base: 'JupyterLexicalTheme__embedBlock',
    focus: 'JupyterLexicalTheme__embedBlockFocus',
  },
  hashtag: 'JupyterLexicalTheme__hashtag',
  heading: {
    h1: 'JupyterLexicalTheme__h1',
    h2: 'JupyterLexicalTheme__h2',
    h3: 'JupyterLexicalTheme__h3',
    h4: 'JupyterLexicalTheme__h4',
    h5: 'JupyterLexicalTheme__h5',
    h6: 'JupyterLexicalTheme__h6',
  },
  image: 'editor-image',
  link: 'JupyterLexicalTheme__link',
  list: {
    listitem: 'JupyterLexicalTheme__listItem',
    listitemChecked: 'JupyterLexicalTheme__listItemChecked',
    listitemUnchecked: 'JupyterLexicalTheme__listItemUnchecked',
    nested: {
      listitem: 'JupyterLexicalTheme__nestedListItem',
    },
    olDepth: [
      'JupyterLexicalTheme__ol1',
      'JupyterLexicalTheme__ol2',
      'JupyterLexicalTheme__ol3',
      'JupyterLexicalTheme__ol4',
      'JupyterLexicalTheme__ol5',
    ],
    ul: 'JupyterLexicalTheme__ul',
  },
  ltr: 'JupyterLexicalTheme__ltr',
  mark: 'JupyterLexicalTheme__mark',
  markOverlap: 'JupyterLexicalTheme__markOverlap',
  layoutContainer: 'JupyterLexicalTheme__layoutContainer',
  layoutItem: 'JupyterLexicalTheme__layoutItem',
  paragraph: 'JupyterLexicalTheme__paragraph',
  quote: 'JupyterLexicalTheme__quote',
  rtl: 'JupyterLexicalTheme__rtl',
  table: 'JupyterLexicalTheme__table',
  tableCell: 'JupyterLexicalTheme__tableCell',
  tableCellHeader: 'JupyterLexicalTheme__tableCellHeader',
  text: {
    bold: 'JupyterLexicalTheme__textBold',
    code: 'JupyterLexicalTheme__textCode',
    italic: 'JupyterLexicalTheme__textItalic',
    strikethrough: 'JupyterLexicalTheme__textStrikethrough',
    subscript: 'JupyterLexicalTheme__textSubscript',
    superscript: 'JupyterLexicalTheme__textSuperscript',
    underline: 'JupyterLexicalTheme__textUnderline',
    underlineStrikethrough: 'JupyterLexicalTheme__textUnderlineStrikethrough',
  },
};

export default theme;

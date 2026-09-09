/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The two views the LaTeX examples share: a plain-text source editor, and
 * the LaTeX read back into a Jupyter Lexical editor, read-only or writable.
 *
 * @module examples/components/LatexViews
 */

import { useCallback, useMemo } from 'react';
import {
  $createLineBreakNode,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  defineExtension,
  type EditorState,
  type LexicalEditor,
} from 'lexical';
import { AutoFocusExtension } from '@lexical/extension';
import { HistoryExtension } from '@lexical/history';
import { PlainTextExtension } from '@lexical/plain-text';
import { LexicalExtensionComposer } from '@lexical/react/LexicalExtensionComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { EditorRefPlugin } from '@lexical/react/LexicalEditorRefPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { Box } from '@datalayer/primer-addons';
import { $convertFromLatexString, LATEX_TRANSFORMERS } from '../../convert';
import { JupyterLexicalExtension } from '../../extensions';
import { commentTheme } from '../../themes';

// ─── Source editor ─────────────────────────────────────────────────────────

const SOURCE_STYLE: React.CSSProperties = {
  fontFamily:
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  fontSize: 13,
  lineHeight: 1.5,
  minHeight: 320,
  padding: 12,
  outline: 'none',
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
};

/**
 * A plain-text Lexical editor holding a source text.
 *
 * Its root extension is made once per `value`: the composer rebuilds the
 * editor whenever the extension changes, which is exactly when the source
 * changes. Every keystroke is reported through `onChange`.
 */
export function SourceEditor({
  value,
  label,
  onChange,
}: {
  value: string;
  label: string;
  onChange: (text: string) => void;
}) {
  const extension = useMemo(
    () =>
      defineExtension({
        name: '@datalayer/jupyter-lexical/examples/FormatsSource',
        namespace: 'lexical-formats-source',
        dependencies: [PlainTextExtension, HistoryExtension],
        theme: { paragraph: 'lexical-formats-source-paragraph' },
        $initialEditorState: () => {
          const paragraph = $createParagraphNode();
          value.split('\n').forEach((line, index) => {
            if (index > 0) {
              paragraph.append($createLineBreakNode());
            }
            if (line) {
              paragraph.append($createTextNode(line));
            }
          });
          $getRoot().append(paragraph);
        },
      }),
    [value],
  );
  const handleChange = useCallback(
    (state: EditorState) =>
      onChange(state.read(() => $getRoot().getTextContent())),
    [onChange],
  );
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'border.default',
        borderRadius: 2,
        bg: 'canvas.default',
      }}
    >
      <LexicalExtensionComposer extension={extension} contentEditable={null}>
        <ContentEditable
          className="lexical-formats-source"
          aria-label={label}
          style={SOURCE_STYLE}
        />
        <OnChangePlugin onChange={handleChange} />
      </LexicalExtensionComposer>
    </Box>
  );
}

// ─── LaTeX view ────────────────────────────────────────────────────────────

// Stable on purpose: a new element here would rebuild the view's editor.
const LATEX_CONTENT_EDITABLE = (
  <div className="editor-scroller">
    <div className="editor">
      <ContentEditable className="editor-input" aria-label="LaTeX document" />
    </div>
  </div>
);

/**
 * The LaTeX rendered: read back into a Jupyter Lexical editor, so equations
 * go through KaTeX and every block the importer understands shows as the
 * document would. Read-only, or an editor in its own right whose instance
 * `onEditor` receives, for the host to read back.
 */
export function LatexView({
  latex,
  editable,
  onEditor,
}: {
  latex: string;
  editable: boolean;
  onEditor?: (editor: LexicalEditor | null) => void;
}) {
  const extension = useMemo(
    () =>
      defineExtension({
        name: editable
          ? '@datalayer/jupyter-lexical/examples/FormatsLatexEditor'
          : '@datalayer/jupyter-lexical/examples/FormatsLatexPreview',
        namespace: 'lexical-formats-latex',
        editable,
        theme: commentTheme,
        dependencies: editable
          ? [JupyterLexicalExtension, AutoFocusExtension]
          : [JupyterLexicalExtension],
        $initialEditorState: () => {
          $convertFromLatexString(latex, LATEX_TRANSFORMERS);
        },
      }),
    [latex, editable],
  );
  const handleEditor = useCallback(
    (editor: LexicalEditor | null) => {
      onEditor?.(editor);
    },
    [onEditor],
  );
  return (
    <div className="editor-shell">
      <div className="editor-container">
        <div className="editor-inner">
          <LexicalExtensionComposer
            extension={extension}
            contentEditable={LATEX_CONTENT_EDITABLE}
          >
            {editable && <EditorRefPlugin editorRef={handleEditor} />}
          </LexicalExtensionComposer>
        </div>
      </div>
    </div>
  );
}

/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React from "react";
import MonacoEditor, { EditorDidMount } from "@monaco-editor/react";
import prettier from "prettier";
import parser from "prettier/parser-babel";
import { FC, useCallback, useRef } from "react";
import codeShift from "jscodeshift";
import Highlighter from "monaco-jsx-highlighter";

import "./CodeEditor.css";
import "./CodeEditorSyntax.css";

interface CodeEditorProps {
  initialValue: string;
  onChange(value: string): void;
}

const CodeEditor: FC<CodeEditorProps> = ({ initialValue, onChange }) => {
  const editorRef = useRef<any>();
  const onEditorDidMount = useCallback<EditorDidMount>(
    (getValue, monacoEditor) => {
      editorRef.current = monacoEditor;
      monacoEditor.onDidChangeModelContent(() => {
        onChange(getValue());
      });
      monacoEditor.getModel()?.updateOptions({ tabSize: 2 });

      const highlighter = new Highlighter(
        // @ts-ignore
        window.monaco,
        codeShift,
        monacoEditor
      );
      highlighter.highLightOnDidChangeModelContent(
        () => {},
        () => {},
        undefined,
        () => {}
      );
    },
    [onChange]
  );

  const onFormatClick = useCallback(() => {
    // get current value from editor
    const unformatted = editorRef.current.getModel().getValue();

    // format that value
    const formatted = prettier
      .format(unformatted, {
        parser: "babel",
        plugins: [parser],
        useTabs: false,
        semi: true,
        singleQuote: true
      })
      .replace(/\n$/, "");

    // set the formatted value back in the editor
    editorRef.current.setValue(formatted);
  }, []);

  return (
    <div className="editor-wrapper">
      <button
        className="button button-format is-primary is-small"
        type="button"
        onClick={onFormatClick}
      >
        Format
      </button>
      <MonacoEditor
        editorDidMount={onEditorDidMount}
        value={initialValue}
        theme="dark"
        language="javascript"
        height="100%"
        options={{
          wordWrap: "on",
          minimap: { enabled: false },
          showUnused: false,
          folding: false,
          lineNumbersMinChars: 3,
          fontSize: 16,
          scrollBeyondLastLine: false,
          automaticLayout: true
        }}
      />
    </div>
  );
};

export default CodeEditor;

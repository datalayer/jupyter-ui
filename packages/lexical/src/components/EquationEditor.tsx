/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import './../../style/lexical/EquationEditor.css';

import {ChangeEvent, RefObject} from 'react';

type BaseEquationEditorProps = {
  equation: string;
  inline: boolean;
  inputRef: {current: null | HTMLInputElement | HTMLTextAreaElement};
  setEquation: (equation: string) => void;
};

export default function EquationEditor({
  equation,
  setEquation,
  inline,
  inputRef,
}: BaseEquationEditorProps): JSX.Element {
  const onChange = (event: ChangeEvent) => {
    setEquation((event.target as HTMLInputElement).value);
  };

  const props = {
    equation,
    inputRef,
    onChange,
  };

  return inline ? (
    <InlineEquationEditor
      {...props}
      inputRef={inputRef as RefObject<HTMLInputElement>}
    />
  ) : (
    <BlockEquationEditor
      {...props}
      inputRef={inputRef as RefObject<HTMLTextAreaElement>}
    />
  );
}

type EquationEditorImplProps = {
  equation: string;
  inputRef: {current: null | HTMLInputElement};
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

function InlineEquationEditor({
  equation,
  onChange,
  inputRef,
}: EquationEditorImplProps): JSX.Element {
  return (
    <span className="EquationEditor_inputBackground">
      <span className="EquationEditor_dollarSign">$</span>
      <input
        className="EquationEditor_inlineEditor"
        value={equation}
        onChange={onChange}
        autoFocus
        ref={inputRef}
      />
      <span className="EquationEditor_dollarSign">$</span>
    </span>
  );
}

type BlockEquationEditorImplProps = {
  equation: string;
  inputRef: {current: null | HTMLTextAreaElement};
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
};

function BlockEquationEditor({
  equation,
  onChange,
  inputRef,
}: BlockEquationEditorImplProps): JSX.Element {
  return (
    <div className="EquationEditor_inputBackground">
      <span className="EquationEditor_dollarSign">{'$$\n'}</span>
      <textarea
        className="EquationEditor_blockEditor"
        value={equation}
        onChange={onChange}
        ref={inputRef}
      />
      <span className="EquationEditor_dollarSign">{'\n$$'}</span>
    </div>
  );
}

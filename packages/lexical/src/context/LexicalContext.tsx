/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, createContext, useContext } from 'react';
import { LexicalEditor } from 'lexical';

type LexicalContextType = {
  editor?: LexicalEditor;
  setEditor: (editor?: LexicalEditor) => void;
};

const context = createContext<LexicalContextType | undefined>(undefined);

export function useLexical() {
  const lexicalContext = useContext(context);
  if (!lexicalContext) {
    throw new Error('useContext must be inside a Provider with a value');
  }
  return lexicalContext;
}

export const LexicalContextProvider = context.Provider;
export const LexicalContextConsumer = context.Consumer;

type Props = {
  children: React.ReactNode;
};

export const LexicalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}: Props) => {
  const [editor, setEditor] = useState<LexicalEditor>();
  return (
    <LexicalContextProvider value={{ editor, setEditor }}>
      {children}
    </LexicalContextProvider>
  );
};

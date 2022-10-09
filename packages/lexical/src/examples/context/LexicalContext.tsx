import React, {useState, createContext, useContext} from 'react';
import { LexicalEditor } from "lexical";

type LexicalCntextType = {
  editor?: LexicalEditor;
  setEditor: (editor?: LexicalEditor) => void;
};

const context = createContext<LexicalCntextType | undefined>(undefined);

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

export const LexicalProvider: React.FC<{
  children: React.ReactNode;
}> = ({children}: Props) => {
  const [editor, setEditor] = useState<LexicalEditor>();
  return (
    <LexicalContextProvider value={{editor, setEditor}}>
      {children}
    </LexicalContextProvider>
  );
};

/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createContext, useContext, useState, ReactNode } from 'react';

type CommentsContextType = {
  showComments: boolean;
  toggleComments: () => void;
  setShowComments: (show: boolean) => void;
};

const CommentsContext = createContext<CommentsContextType | undefined>(
  undefined,
);

export const CommentsProvider = ({ children }: { children: ReactNode }) => {
  const [showComments, setShowComments] = useState(false);

  const toggleComments = () => setShowComments(prev => !prev);

  return (
    <CommentsContext.Provider
      value={{ showComments, toggleComments, setShowComments }}
    >
      {children}
    </CommentsContext.Provider>
  );
};

export const useComments = () => {
  const context = useContext(CommentsContext);
  if (!context) {
    throw new Error('useComments must be used within CommentsProvider');
  }
  return context;
};

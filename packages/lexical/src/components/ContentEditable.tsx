/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import type { CSSProperties } from 'react';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';

export const LexicalContentEditable = ({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}): JSX.Element => {
  return (
    <ContentEditable
      className={className || 'ContentEditable__root'}
      style={style}
    />
  );
};

export default LexicalContentEditable;

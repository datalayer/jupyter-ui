/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import {ContentEditable} from '@lexical/react/LexicalContentEditable';

import './../../style/lexical/ContentEditable.css';

export const LexicalContentEditable = ({
  className,
}: {
  className?: string;
}): JSX.Element => {
  return <ContentEditable className={className || 'ContentEditable__root'} />;
}

export default LexicalContentEditable;

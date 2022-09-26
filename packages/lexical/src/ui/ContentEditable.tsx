/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {ContentEditable} from '@lexical/react/LexicalContentEditable';

import './ContentEditable.css';

export const LexicalContentEditable = ({
  className,
}: {
  className?: string;
}): JSX.Element => {
  return <ContentEditable className={className || 'ContentEditable__root'} />;
}

export default LexicalContentEditable;

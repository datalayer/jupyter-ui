/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { AutoLinkPlugin as LexicalAutoLinkPlugin } from '@lexical/react/LexicalAutoLinkPlugin';
import { AUTO_LINK_MATCHERS } from '../extensions/AutoLinkExtension';

/** `AutoLinkExtension` for an editor built with `LexicalComposer`. */
export const AutoLinkPlugin = () => {
  return <LexicalAutoLinkPlugin matchers={AUTO_LINK_MATCHERS} />;
};

export default AutoLinkPlugin;

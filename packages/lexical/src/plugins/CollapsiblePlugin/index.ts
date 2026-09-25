/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { registerCollapsible } from '../../extensions/CollapsibleExtension';

export { INSERT_COLLAPSIBLE_COMMAND } from '../../extensions/CollapsibleExtension';

// Re-export node classes and utilities
export {
  CollapsibleContainerNode,
  $createCollapsibleContainerNode,
  $isCollapsibleContainerNode,
} from './CollapsibleContainerNode';
export {
  CollapsibleContentNode,
  $createCollapsibleContentNode,
  $isCollapsibleContentNode,
} from './CollapsibleContentNode';
export {
  CollapsibleTitleNode,
  $createCollapsibleTitleNode,
  $isCollapsibleTitleNode,
} from './CollapsibleTitleNode';

/** `CollapsibleExtension` for an editor built with `LexicalComposer`. */
export function CollapsiblePlugin(): null {
  const [editor] = useLexicalComposerContext();
  useEffect(() => registerCollapsible(editor), [editor]);
  return null;
}

export default CollapsiblePlugin;

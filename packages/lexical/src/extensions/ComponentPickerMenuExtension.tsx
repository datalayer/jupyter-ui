/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The `/` block picker, as a Lexical extension.
 *
 * `ComponentPickerMenuPlugin` inserts Jupyter cells against the kernel the
 * host holds, so the extension exposes it as its output component for the
 * host to place with the kernel:
 *
 * ```tsx
 * const ComponentPickerMenu = useExtensionComponent(ComponentPickerMenuExtension);
 * return <ComponentPickerMenu kernel={kernel} />;
 * ```
 *
 * @module extensions/ComponentPickerMenuExtension
 */

import { ReactExtension } from '@lexical/react/ReactExtension';
import { defineExtension } from 'lexical';
import { ComponentPickerMenuPlugin } from '../plugins/ComponentPickerMenuPlugin';

export const ComponentPickerMenuExtension = defineExtension({
  name: '@datalayer/jupyter-lexical/ComponentPickerMenu',
  dependencies: [ReactExtension],
  build: () => ({ Component: ComponentPickerMenuPlugin }),
});

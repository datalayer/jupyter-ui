/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Embeds offered when a supported URL is pasted, as a Lexical extension.
 *
 * Mounts `AutoEmbedPlugin` — the typeahead menu, its dialog and the YouTube
 * and Loom embed configs — as a decorator of the React extension, and
 * depends on the YouTube and Loom extensions whose commands the embeds
 * dispatch.
 *
 * @module extensions/AutoEmbedExtension
 */

import { ReactExtension } from '@lexical/react/ReactExtension';
import { configExtension, defineExtension } from 'lexical';
import { AutoEmbedPlugin } from '../plugins/AutoEmbedPlugin';
import { LoomExtension } from './LoomExtension';
import { YouTubeExtension } from './YouTubeExtension';

export const AutoEmbedExtension = defineExtension({
  name: '@datalayer/jupyter-lexical/AutoEmbed',
  dependencies: [
    YouTubeExtension,
    LoomExtension,
    configExtension(ReactExtension, {
      decorators: [<AutoEmbedPlugin key="auto-embed" />],
    }),
  ],
});

/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import { Schema} from 'prosemirror-model';
import { setup } from './../setup/setup';
import { hashtagInlinePlugin } from './hashtag/HashTagInlinePlugin';

const createPlugins = (schema: Schema) => {
  const plugins = setup({ schema });
  return plugins.concat([
    hashtagInlinePlugin
  ]);
};

export default createPlugins;

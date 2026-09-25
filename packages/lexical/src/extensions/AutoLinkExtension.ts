/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Automatic links for URLs and e-mail addresses, as a Lexical extension.
 *
 * `@lexical/link`'s `AutoLinkExtension` configured with this package's
 * matchers: URLs (with or without a scheme, opened in a new tab) and e-mail
 * addresses (as `mailto:`).
 *
 * @module extensions/AutoLinkExtension
 */

import {
  AutoLinkExtension as LexicalAutoLinkExtension,
  type LinkMatcher,
} from '@lexical/link';
import { configExtension, defineExtension } from 'lexical';

const URL_MATCHER =
  /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

const EMAIL_MATCHER =
  /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

/** The matchers behind `AutoLinkExtension` and `AutoLinkPlugin`. */
export const AUTO_LINK_MATCHERS: LinkMatcher[] = [
  (text: string) => {
    const match = URL_MATCHER.exec(text);
    if (match) {
      const url = match[0].startsWith('http')
        ? match[0]
        : `https://${match[0]}`;
      return {
        index: match.index,
        length: match[0].length,
        text: match[0],
        url,
        attributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      };
    }
    return null;
  },
  (text: string) => {
    const match = EMAIL_MATCHER.exec(text);
    if (match) {
      return {
        index: match.index,
        length: match[0].length,
        text: match[0],
        url: `mailto:${match[0]}`,
      };
    }
    return null;
  },
];

export const AutoLinkExtension = defineExtension({
  name: '@datalayer/jupyter-lexical/AutoLink',
  dependencies: [
    configExtension(LexicalAutoLinkExtension, { matchers: AUTO_LINK_MATCHERS }),
  ],
});

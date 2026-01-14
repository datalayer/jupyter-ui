/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { AutoLinkPlugin as LexicalAutoLinkPlugin } from '@lexical/react/LexicalAutoLinkPlugin';

const URL_MATCHER =
  /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

const EMAIL_MATCHER =
  /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

const MATCHERS = [
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

export const AutoLinkPlugin = () => {
  return <LexicalAutoLinkPlugin matchers={MATCHERS} />;
};

export default AutoLinkPlugin;

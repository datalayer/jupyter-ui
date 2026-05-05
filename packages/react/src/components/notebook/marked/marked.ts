/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { IMarkdownParser } from '@jupyterlab/rendermime';
import { IEditorLanguageRegistry } from '@jupyterlab/codemirror';
import { marked } from 'marked';

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

const preprocessMath = (content: string): string => {
  const fencedBlocks: string[] = [];
  const withPlaceholders = content.replace(/```[\s\S]*?```/g, block => {
    const index = fencedBlocks.push(block) - 1;
    return `@@JUPYTER_REACT_FENCE_${index}@@`;
  });

  const withBlockMath = withPlaceholders.replace(
    /\$\$([\s\S]+?)\$\$/g,
    (_match, expression: string) =>
      `<div class="math display">\\[${escapeHtml(expression.trim())}\\]</div>`
  );

  const withInlineMath = withBlockMath.replace(
    /(^|[^$\\])\$([^\n$]+?)\$/g,
    (_match, prefix: string, expression: string) =>
      `${prefix}<span class="math inline">\\(${escapeHtml(
        expression.trim()
      )}\\)</span>`
  );

  return withInlineMath.replace(/@@JUPYTER_REACT_FENCE_(\d+)@@/g, (_m, i) => {
    const index = Number(i);
    return Number.isInteger(index) ? fencedBlocks[index] : _m;
  });
};

const inlineMathRule = /^\$(?!\s)([^$\n]|\\\$)+?(?<!\s)\$/;
const blockMathRule = /^\$\$([\s\S]+?)\$\$(?:\n|$)/;

export const getMarked = (
  languages: IEditorLanguageRegistry
): IMarkdownParser => {
  Private.initializeMarked(languages);
  return {
    render: (content: string): Promise<string> =>
      new Promise<string>((resolve, reject) => {
        const preprocessedContent = preprocessMath(content);
        marked(preprocessedContent, (err: any, content: string) => {
          if (err) {
            reject(err);
          } else {
            resolve(content);
          }
        });
      }),
  };
};

namespace Private {
  let markedInitialized = false;
  export function initializeMarked(languages: IEditorLanguageRegistry): void {
    if (markedInitialized) {
      return;
    } else {
      markedInitialized = true;
    }

    // Teach marked about notebook-style LaTeX so MathJax can typeset it.
    marked.use({
      extensions: [
        {
          name: 'blockMath',
          level: 'block',
          start(src: string) {
            const index = src.indexOf('$$');
            return index < 0 ? undefined : index;
          },
          tokenizer(src: string) {
            const match = blockMathRule.exec(src);
            if (!match) {
              return undefined;
            }
            return {
              type: 'blockMath',
              raw: match[0],
              text: match[1].trim(),
            };
          },
          renderer(token: any) {
            return `<div class="math display">\\[${escapeHtml(token.text)}\\]</div>`;
          },
        },
        {
          name: 'inlineMath',
          level: 'inline',
          start(src: string) {
            const index = src.indexOf('$');
            return index < 0 ? undefined : index;
          },
          tokenizer(src: string) {
            const match = inlineMathRule.exec(src);
            if (!match) {
              return undefined;
            }
            const raw = match[0];
            return {
              type: 'inlineMath',
              raw,
              text: raw.slice(1, -1),
            };
          },
          renderer(token: any) {
            return `<span class="math inline">\\(${escapeHtml(token.text)}\\)</span>`;
          },
        },
      ],
    });

    marked.setOptions({
      gfm: true,
      sanitize: false,
      // breaks: true; We can't use GFM breaks as it causes problems with tables
      langPrefix: 'language-',
      highlight: (code, lang, callback) => {
        const cb = (err: Error | null, code: string) => {
          if (callback) {
            callback(err, code);
          }
          return code;
        };
        if (!lang) {
          // no language, no highlight
          return cb(null, code);
        }
        const el = document.createElement('div');
        try {
          languages
            .highlight(code, languages.findBest(lang), el)
            .then(() => {
              return cb(null, el.innerHTML);
            })
            .catch(reason => {
              return cb(reason as Error, code);
            });
        } catch (err) {
          console.error(`Failed to highlight ${lang} code`, err);
          return cb(err as Error, code);
        }
      },
    });
  }
}

export default getMarked;

import { Mode } from '@jupyterlab/codemirror';
import { IMarkdownParser } from '@jupyterlab/rendermime';
import { marked } from 'marked';

export const getMarked = (): IMarkdownParser => {
  Private.initializeMarked();
  return {
    render: (content: string): Promise<string> =>
      new Promise<string>((resolve, reject) => {
        marked(content, (err: any, content: string) => {
          if (err) {
            reject(err);
          } else {
            resolve(content);
          }
        });
      })
  };
};

namespace Private {
  let markedInitialized = false;
  export function initializeMarked(): void {
    if (markedInitialized) {
      return;
    } else {
      markedInitialized = true;
    }
    marked.setOptions({
      gfm: true,
      sanitize: false,
      // breaks: true; We can't use GFM breaks as it causes problems with tables
      langPrefix: `language-`,
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
        Mode.ensure(lang)
          .then(spec => {
            const el = document.createElement('div');
            if (!spec) {
              console.error(`No CodeMirror mode: ${lang}`);
              return cb(null, code);
            }
            try {
              Mode.run(code, spec, el);
              return cb(null, el.innerHTML);
            } catch (err: any) {
              console.error(`Failed to highlight ${lang} code`, err);
              return cb(err, code);
            }
          })
          .catch(err => {
            console.error(`No CodeMirror mode: ${lang}`);
            console.error(`Require CodeMirror mode error: ${err}`);
            return cb(null, code);
          });
        return code;
      }
    });
  }
}

export default getMarked;

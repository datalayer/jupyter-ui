/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/*
 * Copyright (c) 2021-2026 Datalayer, Inc.
 *
 * MIT License
 */

import { MathJaxTypesetter } from '@jupyterlab/mathjax-extension';

/**
 * Build a latex typesetter that degrades gracefully when MathJax cannot
 * initialize in browser-bundled environments.
 */
export const createLatexTypesetter = () => {
  // mathjax-full loader relies on Node-style __dirname in this build path.
  // In browser-only environments this is unavailable and causes runtime errors.
  if (
    typeof window !== 'undefined' &&
    typeof (globalThis as any).__dirname === 'undefined'
  ) {
    return undefined;
  }

  try {
    const latexTypesetter = new MathJaxTypesetter();
    const originalTypeset = latexTypesetter.typeset.bind(latexTypesetter);
    let disabledAfterError = false;

    latexTypesetter.typeset = async node => {
      if (disabledAfterError) {
        return;
      }
      try {
        await originalTypeset(node);
      } catch (error) {
        disabledAfterError = true;
        console.warn(
          'MathJax typesetting failed once; disabling LaTeX rendering for this session.'
        );
      }
    };

    return latexTypesetter;
  } catch (error) {
    console.warn(
      'MathJax typesetter initialization failed. Rendering without LaTeX.'
    );
    return undefined;
  }
};

export default createLatexTypesetter;

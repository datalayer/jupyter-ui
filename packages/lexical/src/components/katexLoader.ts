/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * KaTeX and its stylesheet, fetched once, the first time an equation is
 * drawn or rasterised.
 *
 * They were static imports — the library in `KatexRenderer` and the PDF
 * rasteriser, the stylesheet in `EquationsPlugin` — so every editor carried
 * the typesetter, about 80 KiB compressed, whether its document held an
 * equation or not. A failed fetch is forgotten, so the next equation tries
 * again.
 *
 * Not exported from the package: it is how this package draws equations, not
 * something a host calls.
 *
 * @module components/katexLoader
 */

type Katex = (typeof import('katex'))['default'];

let loading: Promise<Katex> | undefined;

export function loadKatex(): Promise<Katex> {
  if (!loading) {
    loading = Promise.all([
      import('katex'),
      import('katex/dist/katex.css'),
    ]).then(
      ([module]) => module.default,
      error => {
        loading = undefined;
        throw error;
      },
    );
  }
  return loading;
}

export default loadKatex;

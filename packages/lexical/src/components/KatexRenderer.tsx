/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import type { JSX } from 'react';
import { useEffect, useRef } from 'react';
import { loadKatex } from './katexLoader';

export default function KatexRenderer({
  equation,
  inline,
  onClick,
}: Readonly<{
  equation: string;
  inline: boolean;
  onClick: () => void;
}>): JSX.Element {
  const katexElementRef = useRef(null);

  useEffect(() => {
    // KaTeX arrives on the first equation drawn: see `katexLoader`. An
    // equation edited, or unmounted, before it lands is not drawn stale.
    let cancelled = false;
    void loadKatex()
      .then(katex => {
        const katexElement = katexElementRef.current;
        if (cancelled || katexElement === null) {
          return;
        }
        katex.render(equation, katexElement, {
          displayMode: !inline, // true === block display //
          // KaTeX paints this itself, so it takes a colour, not a token.
          errorColor: 'var(--fgColor-danger, #cc0000)',
          output: 'html',
          strict: 'warn',
          throwOnError: false,
          trust: false,
        });
      })
      .catch(error => {
        // The chunk or its stylesheet did not load. `loadKatex` forgets the
        // failed attempt, so the next equation drawn tries again; this one
        // stays as its source text rather than failing the editor.
        console.debug('KaTeX could not be loaded', error);
      });
    return () => {
      cancelled = true;
    };
  }, [equation, inline]);

  return (
    // We use spacers either side to ensure Android doesn't try and compose from the
    // inner text from Katex. There didn't seem to be any other way of making this work,
    // without having a physical space.
    <>
      <span> </span>
      <span
        role="button"
        tabIndex={-1}
        onClick={onClick}
        ref={katexElementRef}
      />
      <span> </span>
    </>
  );
}

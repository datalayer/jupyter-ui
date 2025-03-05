/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import katex from 'katex';
import {useEffect, useRef} from 'react';

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
    const katexElement = katexElementRef.current;

    if (katexElement !== null) {
      katex.render(equation, katexElement, {
        displayMode: !inline, // true === block display //
        errorColor: '#cc0000',
        output: 'html',
        strict: 'warn',
        throwOnError: false,
        trust: false,
      });
    }
  }, [equation, inline]);

  return (
    // We use spacers either side to ensure Android doesn't try and compose from the
    // inner text from Katex. There didn't seem to be any other way of making this work,
    // without having a physical space.
    <>
      <span className="spacer"> </span>
      <span
        role="button"
        tabIndex={-1}
        onClick={onClick}
        ref={katexElementRef}
      />
      <span className="spacer"> </span>
    </>
  );
}

/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @types/react 19 no longer declares the global `JSX` namespace, but
 * @primer/react 37 still types its polymorphic `as` prop with
 * `keyof JSX.IntrinsicElements`. Without this shim the only global intrinsic
 * element left is the `relative-time` one that @github/relative-time-element
 * declares, and every `<Text as="h2">` or `<PageHeader as="h2">` fails to
 * type-check once @primer/react resolves styled-components 5 types.
 */
import type { JSX as ReactJSX } from 'react';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface IntrinsicElements extends ReactJSX.IntrinsicElements {}
  }
}

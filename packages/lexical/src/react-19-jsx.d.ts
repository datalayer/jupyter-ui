/*
 * Copyright (c) 2023-2025 Datalayer, Inc.
 * Distributed under the terms of the Modified BSD License.
 */

/**
 * Repopulates the global `JSX` namespace that React 19's `@types/react` removed.
 *
 * React 19 moved the namespace to `React.JSX`. Dependencies compiled against
 * React 18 types still reference the bare global -- notably `@primer/react`'s
 * `utils/polymorphic.d.ts`, whose `as` overload is guarded by
 * `As extends keyof JSX.IntrinsicElements`. Web-component packages such as
 * `@github/relative-time-element` keep the global alive by augmenting it, so the
 * namespace exists but holds only their custom elements: the guard cannot hold
 * for `"h3"`, the polymorphic overload drops out, and `<Heading as="h3">` reports
 * its children as `never`.
 *
 * Each member is declared as an interface extending its `React.JSX` counterpart
 * so it *merges* with those augmentations. Type aliases would collide instead,
 * and `skipLibCheck` would hide the collision while the augmentation quietly won.
 *
 * Types only -- no runtime cost.
 */
import type * as React from 'react';

declare global {
  namespace JSX {
    interface Element extends React.JSX.Element {}
    interface ElementClass extends React.JSX.ElementClass {}
    interface ElementAttributesProperty
      extends React.JSX.ElementAttributesProperty {}
    interface ElementChildrenAttribute
      extends React.JSX.ElementChildrenAttribute {}
    interface IntrinsicAttributes extends React.JSX.IntrinsicAttributes {}
    interface IntrinsicClassAttributes<T>
      extends React.JSX.IntrinsicClassAttributes<T> {}
    interface IntrinsicElements extends React.JSX.IntrinsicElements {}
  }
}

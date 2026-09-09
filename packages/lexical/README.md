[![Datalayer](https://assets.datalayer.tech/datalayer-25.svg)](https://datalayer.io)

[![Become a Sponsor](https://img.shields.io/static/v1?label=Become%20a%20Sponsor&message=%E2%9D%A4&logo=GitHub&style=flat&color=1ABC9C)](https://github.com/sponsors/datalayer)

# 🪐 ✍️ Jupyter Lexical

> A literate Jupyter for accessible and reproducible data analysis.

<div align="center" style="text-align: center">
  <img alt="Jupyter UI Slate" src="https://datalayer-jupyter-examples.s3.amazonaws.com/jupyter-react-slate.gif" />
</div>

## Extensions

The editor is built with [Lexical extensions](https://lexical.dev/docs/extensions/intro):
every behaviour of this package is an extension in `src/extensions`, and
`JupyterLexicalExtension` bundles them all. A host depends on the bundle from
its own root extension, adds what is its own — namespace, theme, initial
state, focus on mount — and renders the content editable where it wants it:

```tsx
import { AutoFocusExtension } from '@lexical/extension';
import { LexicalExtensionComposer } from '@lexical/react/LexicalExtensionComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { JupyterLexicalExtension, commentTheme } from '@datalayer/jupyter-lexical';
import { defineExtension } from 'lexical';

// Module scope: the composer rebuilds the editor whenever this reference changes.
const extension = defineExtension({
  name: 'my-app/Document',
  namespace: 'my-document',
  theme: commentTheme,
  dependencies: [JupyterLexicalExtension, AutoFocusExtension],
});

export const Document = () => (
  <LexicalExtensionComposer extension={extension} contentEditable={null}>
    <ContentEditable className="editor-input" />
  </LexicalExtensionComposer>
);
```

Bundled behaviours are reconfigured from the root with `configExtension`, for
instance `configExtension(HistoryExtension, { disabled: true })` for a
collaborative document, or `configExtension(ListMaxIndentLevelExtension, { maxDepth: 3 })`.
Some of them expose signals in their output so a live editor can be
reconfigured without being rebuilt — the list ceiling, or the `lexicalId` and
`serviceManager` of `LexicalStateExtension` that register the editor in the
shared store for agent tools.

Two kinds of behaviour need the host: what only the host has (a kernel,
completion providers) and what hangs off the host's DOM (floating menus).
The first are output components — `JupyterInputOutputExtension`,
`ComponentPickerMenuExtension` and `InlineCompletionExtension` — placed with
`useExtensionComponent` or `<ExtensionComponent lexical:extension={…} />`;
the second stay React plug-ins rendered as children of the composer, as do
the toolbar, the comments panel and the collaboration provider.

Every extension keeps a React plug-in of the same name in `src/plugins` for an
editor still built with `LexicalComposer`; the plug-in is a thin wrapper over
the extension's `register…` function, so both paths share one implementation.

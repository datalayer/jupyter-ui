/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * How each kind of variable is drawn.
 *
 * A registry of renderers, each saying which variables it draws: scalars and
 * strings, collections, numpy arrays, pandas frames and series, matplotlib
 * figures, modules, functions and classes, and a fallback on the `repr` that
 * draws anything. A host registers its own for the types it knows
 * (`kernelVariableRenderers.register`): the newest registered that matches
 * wins, the built-in ones after, the fallback last.
 *
 * @module components/kernel/variables/renderers
 */

import type { ReactElement, ReactNode } from 'react';
import { Suspense, lazy } from 'react';
import type { Kernel } from '@jupyterlab/services';
import { Label, Text } from '@primer/react';
import { Box } from '@datalayer/primer-addons';
import {
  formatBytes,
  kernelVariableExtent,
  type KernelVariable,
  type KernelVariableDetails,
} from './introspection';

/** What a renderer is handed. */
export type KernelVariableRendererProps = {
  variable: KernelVariableDetails;
  /**
   * The kernel's connection, when the variables come from one: what a live
   * renderer (an ipywidget) talks to. Absent for a sandbox reached over HTTP.
   */
  connection?: Kernel.IKernelConnection;
};

/** The live widget view: the widgets' code is loaded only when one is opened. */
const WidgetVariableView = lazy(() => import('./WidgetVariableView'));

/** One way of drawing variables. */
export type KernelVariableRenderer = {
  /** Its id: `dataframe`, a host's own. */
  id: string;
  /** Whether it draws this variable. */
  matches: (variable: KernelVariable) => boolean;
  /** The list row's one line; the variable's `preview` otherwise. */
  summary?: (variable: KernelVariable) => string;
  /** The details, once the variable was read in full. */
  render: (props: KernelVariableRendererProps) => ReactNode;
};

const monospace = {
  fontFamily: 'mono',
  fontSize: 0,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
} as const;

/** The `repr`, as it came, in a scrolling block. */
export function KernelVariableRepr({
  variable,
}: KernelVariableRendererProps): ReactElement {
  return (
    <Box>
      <Box
        as="pre"
        data-kernel-variable-repr=""
        sx={{
          ...monospace,
          m: 0,
          p: 2,
          maxHeight: 240,
          overflow: 'auto',
          bg: 'canvas.inset',
          color: 'fg.default',
          border: '1px solid',
          borderColor: 'border.default',
          borderRadius: 2,
        }}
      >
        {variable.repr}
      </Box>
      {variable.truncated && (
        <Text as="p" sx={{ fontSize: 0, color: 'fg.muted', m: 0, mt: 1 }}>
          Cut at {variable.repr.length.toLocaleString()} characters.
        </Text>
      )}
    </Box>
  );
}

/** Facts as `key: value` lines. */
function Facts({
  facts,
}: {
  facts: [string, string | undefined | null][];
}): ReactElement {
  return (
    <Box
      as="dl"
      sx={{
        display: 'grid',
        gridTemplateColumns: 'max-content 1fr',
        columnGap: 3,
        rowGap: 1,
        m: 0,
        fontSize: 1,
      }}
    >
      {facts
        .filter(([, value]) => value)
        .map(([key, value]) => (
          <Box key={key} sx={{ display: 'contents' }}>
            <Box as="dt" sx={{ color: 'fg.muted' }}>
              {key}
            </Box>
            <Box as="dd" sx={{ m: 0, ...monospace, fontSize: 1 }}>
              {value}
            </Box>
          </Box>
        ))}
    </Box>
  );
}

/** A small table: a dataframe's head, a series, a mapping's first items. */
export function KernelVariableTableView({
  columns,
  index,
  rows,
  caption,
}: {
  columns: string[];
  index?: string[];
  rows: string[][];
  caption?: string;
}): ReactElement {
  const cell = {
    px: 2,
    py: 1,
    borderBottom: '1px solid',
    borderColor: 'border.muted',
    textAlign: 'left',
    whiteSpace: 'nowrap',
    fontFamily: 'mono',
    fontSize: 0,
  } as const;
  return (
    <Box
      sx={{
        overflow: 'auto',
        maxHeight: 280,
        border: '1px solid',
        borderColor: 'border.default',
        borderRadius: 2,
      }}
    >
      <Box
        as="table"
        data-kernel-variable-table=""
        sx={{ borderCollapse: 'collapse', width: '100%', color: 'fg.default' }}
      >
        {caption && (
          <Box
            as="caption"
            sx={{
              textAlign: 'left',
              p: 2,
              fontSize: 0,
              color: 'fg.muted',
            }}
          >
            {caption}
          </Box>
        )}
        <thead>
          <Box as="tr" sx={{ bg: 'canvas.subtle' }}>
            {index && <Box as="th" sx={cell} />}
            {columns.map((column, i) => (
              <Box
                as="th"
                key={`${column}-${i}`}
                sx={{ ...cell, fontWeight: 'bold' }}
              >
                {column}
              </Box>
            ))}
          </Box>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              {index && (
                <Box as="th" sx={{ ...cell, color: 'fg.muted' }}>
                  {index[r]}
                </Box>
              )}
              {row.map((value, c) => (
                <Box as="td" key={c} sx={cell}>
                  {value}
                </Box>
              ))}
            </tr>
          ))}
        </tbody>
      </Box>
    </Box>
  );
}

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(item => String(item)) : [];

const builtins: KernelVariableRenderer[] = [
  {
    id: 'scalar',
    matches: v => v.kind === 'scalar' || v.kind === 'string',
    render: ({ variable }) => (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Facts
          facts={[
            ['Type', variable.type],
            ['Length', variable.length?.toLocaleString()],
            ['Size', formatBytes(variable.size)],
          ]}
        />
        <KernelVariableRepr variable={variable} />
      </Box>
    ),
  },
  {
    id: 'collection',
    matches: v =>
      v.kind === 'sequence' || v.kind === 'set' || v.kind === 'mapping',
    render: ({ variable }) => {
      const items = Array.isArray(variable.data.items)
        ? (variable.data.items as unknown[])
        : [];
      const mapping = variable.kind === 'mapping';
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Facts
            facts={[
              ['Type', variable.type],
              ['Length', kernelVariableExtent(variable)],
              ['Size', formatBytes(variable.size)],
            ]}
          />
          {items.length > 0 && (
            <KernelVariableTableView
              caption={
                variable.length !== undefined && variable.length > items.length
                  ? `The first ${items.length} of ${variable.length.toLocaleString()}`
                  : undefined
              }
              columns={mapping ? ['Key', 'Value'] : ['Item']}
              index={mapping ? undefined : items.map((_, i) => String(i))}
              rows={items.map(item =>
                mapping ? strings(item) : [String(item)]
              )}
            />
          )}
        </Box>
      );
    },
  },
  {
    id: 'ndarray',
    matches: v => v.kind === 'ndarray',
    render: ({ variable }) => (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Facts
          facts={[
            ['Shape', variable.shape ? `(${variable.shape.join(', ')})` : ''],
            ['Dtype', variable.dtype],
            ['Size', formatBytes(variable.size)],
          ]}
        />
        <KernelVariableRepr variable={variable} />
      </Box>
    ),
  },
  {
    id: 'dataframe',
    matches: v => v.kind === 'dataframe',
    render: ({ variable }) => {
      const columns = strings(variable.data.columns);
      const dtypes = strings(variable.data.dtypes);
      const rows = Array.isArray(variable.data.rows)
        ? (variable.data.rows as unknown[]).map(strings)
        : [];
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Facts
            facts={[
              ['Shape', kernelVariableExtent(variable)],
              ['Size', formatBytes(variable.size)],
            ]}
          />
          {columns.length > 0 ? (
            <KernelVariableTableView
              caption={`head(${rows.length})`}
              columns={columns.map((column, i) =>
                dtypes[i] ? `${column} · ${dtypes[i]}` : column
              )}
              index={strings(variable.data.index)}
              rows={rows}
            />
          ) : (
            <KernelVariableRepr variable={variable} />
          )}
        </Box>
      );
    },
  },
  {
    id: 'series',
    matches: v => v.kind === 'series',
    render: ({ variable }) => {
      const values = strings(variable.data.values);
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Facts
            facts={[
              ['Name', variable.data.name as string | null],
              ['Length', kernelVariableExtent(variable)],
              ['Size', formatBytes(variable.size)],
            ]}
          />
          <KernelVariableTableView
            caption={`head(${values.length})`}
            columns={[String(variable.data.name ?? variable.name)]}
            index={strings(variable.data.index)}
            rows={values.map(value => [value])}
          />
        </Box>
      );
    },
  },
  {
    id: 'figure',
    matches: v => v.kind === 'figure',
    render: ({ variable }) =>
      typeof variable.data.png === 'string' ? (
        <Box
          as="img"
          alt={`The figure ${variable.name}`}
          src={`data:image/png;base64,${variable.data.png}`}
          sx={{ maxWidth: '100%', bg: 'white', borderRadius: 2 }}
        />
      ) : (
        <KernelVariableRepr variable={variable} />
      ),
  },
  {
    id: 'widget',
    matches: v => v.kind === 'widget',
    summary: v => (v.preview ? `value: ${v.preview}` : v.type),
    render: ({ variable, connection }) => (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Facts
          facts={[
            ['Widget', variable.type],
            ['Value', variable.preview],
            ['Description', variable.data.description as string | undefined],
          ]}
        />
        {connection && variable.modelId ? (
          <Suspense
            fallback={
              <Text sx={{ fontSize: 1, color: 'fg.muted' }}>
                Loading the widget…
              </Text>
            }
          >
            <WidgetVariableView
              connection={connection}
              modelId={variable.modelId}
            />
          </Suspense>
        ) : (
          <Text as="p" sx={{ m: 0, fontSize: 1, color: 'fg.muted' }}>
            The widget is drawn live where the page talks to its kernel.
          </Text>
        )}
      </Box>
    ),
  },
  {
    id: 'callable',
    matches: v =>
      v.kind === 'function' || v.kind === 'class' || v.kind === 'module',
    summary: v =>
      v.kind === 'module' ? `module ${v.preview}` : `${v.kind} ${v.preview}`,
    render: ({ variable }) => (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {variable.kind !== 'module' && (
          <Box sx={{ ...monospace, fontSize: 1 }}>
            {variable.kind === 'class' ? 'class ' : 'def '}
            {variable.preview}
            {(variable.data.signature as string | undefined) ?? ''}
          </Box>
        )}
        {variable.kind === 'class' &&
          strings(variable.data.bases).length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {strings(variable.data.bases).map(base => (
                <Label key={base} variant="secondary">
                  {base}
                </Label>
              ))}
            </Box>
          )}
        <Facts
          facts={[
            [
              'Module',
              variable.kind === 'module' ? variable.preview : undefined,
            ],
            ['File', variable.data.file as string | undefined],
          ]}
        />
        {typeof variable.data.doc === 'string' && variable.data.doc && (
          <Text as="p" sx={{ m: 0, fontSize: 1, whiteSpace: 'pre-wrap' }}>
            {variable.data.doc}
          </Text>
        )}
      </Box>
    ),
  },
];

/** Anything: its `repr`. */
export const fallbackKernelVariableRenderer: KernelVariableRenderer = {
  id: 'repr',
  matches: () => true,
  render: ({ variable }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Facts
        facts={[
          [
            'Type',
            variable.module && variable.module !== 'builtins'
              ? `${variable.module}.${variable.type}`
              : variable.type,
          ],
          ['Size', formatBytes(variable.size)],
        ]}
      />
      <KernelVariableRepr variable={variable} />
    </Box>
  ),
};

/** The renderers, the host's first. */
export class KernelVariableRenderers {
  private _registered: KernelVariableRenderer[] = [];

  /** Add a renderer; it wins over those before it. Returns the undo. */
  register(renderer: KernelVariableRenderer): () => void {
    this._registered.unshift(renderer);
    return () => {
      this._registered = this._registered.filter(r => r !== renderer);
    };
  }

  /** Every renderer, in the order they are tried. */
  list(): KernelVariableRenderer[] {
    return [...this._registered, ...builtins, fallbackKernelVariableRenderer];
  }

  /** The renderer of a variable, trying `extra` first. */
  resolve(
    variable: KernelVariable,
    extra: readonly KernelVariableRenderer[] = []
  ): KernelVariableRenderer {
    return (
      [...extra, ...this.list()].find(renderer => renderer.matches(variable)) ??
      fallbackKernelVariableRenderer
    );
  }
}

/** The renderers every variables view draws with. */
export const kernelVariableRenderers = new KernelVariableRenderers();

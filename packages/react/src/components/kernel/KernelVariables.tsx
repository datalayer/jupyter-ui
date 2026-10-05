/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The variables of a kernel, listed.
 *
 * Given a jupyter-react `Kernel`, a kernel connection, or anything that runs
 * Python and says what it printed (an agent's sandbox over HTTP), it lists
 * the namespace — name, type, shape or size, a one-line preview — refreshed
 * after each execution on the kernel, and on demand. A variable clicked is
 * read in full and drawn by its renderer (`variables/renderers`).
 *
 * The code it runs is the shared snippet (`variables/introspection`), sent
 * silently and out of the history (`variables/execution`).
 *
 * @module components/kernel/KernelVariables
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import type {
  Kernel as JupyterKernel,
  KernelMessage,
} from '@jupyterlab/services';
import {
  Flash,
  IconButton,
  Label,
  Spinner,
  Text,
  TextInput,
  ToggleSwitch,
} from '@primer/react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  SearchIcon,
  SyncIcon,
} from '@primer/octicons-react';
import { Box } from '@datalayer/primer-addons';
import type Kernel from '../../jupyter/kernel/Kernel';
import {
  formatBytes,
  inspectKernelVariable,
  kernelVariableExtent,
  listKernelVariables,
  supportsKernelVariables,
  type KernelVariable,
  type KernelVariableDetails,
  type KernelVariablesExecutor,
} from './variables/introspection';
import { kernelConnectionExecutor } from './variables/execution';
import {
  kernelVariableRenderers,
  type KernelVariableRenderer,
} from './variables/renderers';

export type KernelVariablesProps = {
  /** A jupyter-react kernel. */
  kernel?: Kernel;
  /** Or a kernel connection. */
  connection?: JupyterKernel.IKernelConnection | null;
  /**
   * Or anything that runs code and says what it printed: a sandbox reached
   * over HTTP. Listed when mounted and on *Refresh*; there are no executions
   * to follow.
   */
  execute?: KernelVariablesExecutor;
  /** The language `execute` runs (default `python`). */
  language?: string;
  /** Refresh after each execution on the kernel (default `true`). */
  autoRefresh?: boolean;
  /** List modules too (default `false`; a toggle shows them). */
  showModules?: boolean;
  /** Renderers tried before the registered ones. */
  renderers?: readonly KernelVariableRenderer[];
  /** The list's height; it scrolls past it. */
  maxHeight?: number | string;
};

type Source =
  | { state: 'none' }
  | { state: 'starting' }
  | { state: 'unsupported'; language: string }
  | {
      state: 'ready';
      execute: KernelVariablesExecutor;
      language: string;
      connection?: JupyterKernel.IKernelConnection;
    };

/** The words of a state with nothing to list. */
function Notice({
  children,
  busy = false,
  ...rest
}: {
  children: string;
  busy?: boolean;
  [key: `data-${string}`]: string;
}): ReactElement {
  return (
    <Box
      {...rest}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 3,
        color: 'fg.muted',
        fontSize: 1,
      }}
    >
      {busy && <Spinner size="small" />}
      <Text>{children}</Text>
    </Box>
  );
}

/** Where the variables come from, once it can be asked. */
function useSource(
  kernel: Kernel | undefined,
  connection: JupyterKernel.IKernelConnection | null | undefined,
  execute: KernelVariablesExecutor | undefined,
  language: string,
  ownMessages: Set<string>
): Source {
  const [source, setSource] = useState<Source>({ state: 'none' });
  useEffect(() => {
    let cancelled = false;
    const set = (next: Source) => !cancelled && setSource(next);
    if (execute) {
      set(
        supportsKernelVariables(language)
          ? { state: 'ready', execute, language }
          : { state: 'unsupported', language }
      );
      return () => {
        cancelled = true;
      };
    }
    if (!kernel && !connection) {
      set({ state: 'none' });
      return () => {
        cancelled = true;
      };
    }
    set({ state: 'starting' });
    (async () => {
      if (kernel) {
        await kernel.ready;
      }
      const resolved = connection ?? kernel?.connection ?? null;
      if (!resolved) {
        set({ state: 'none' });
        return;
      }
      const info = await resolved.info;
      const name = info?.language_info?.name ?? '';
      set(
        supportsKernelVariables(name)
          ? {
              state: 'ready',
              execute: kernelConnectionExecutor(resolved, id =>
                ownMessages.add(id)
              ),
              language: name,
              connection: resolved,
            }
          : { state: 'unsupported', language: name || 'an unknown language' }
      );
    })().catch(() => set({ state: 'none' }));
    return () => {
      cancelled = true;
    };
  }, [kernel, connection, execute, language, ownMessages]);
  return source;
}

/** One variable, read in full and drawn by its renderer. */
function VariableDetails({
  variable,
  connection,
  execute,
  language,
  renderers,
  version,
}: {
  variable: KernelVariable;
  connection?: JupyterKernel.IKernelConnection;
  execute: KernelVariablesExecutor;
  language: string;
  renderers: readonly KernelVariableRenderer[];
  version: number;
}): ReactElement {
  const [details, setDetails] = useState<KernelVariableDetails>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    let cancelled = false;
    setError(undefined);
    inspectKernelVariable(execute, variable.name, { language })
      .then(read => !cancelled && setDetails(read))
      .catch(
        reason =>
          !cancelled &&
          setError(reason instanceof Error ? reason.message : String(reason))
      );
    return () => {
      cancelled = true;
    };
    // Read again when the list was: the value may have changed.
  }, [execute, variable.name, language, version]);
  if (error) {
    return (
      <Flash variant="danger" sx={{ fontSize: 1 }}>
        {error}
      </Flash>
    );
  }
  if (!details) {
    return <Notice busy>Reading the variable…</Notice>;
  }
  const renderer = kernelVariableRenderers.resolve(details, renderers);
  return (
    <Box
      data-kernel-variable-details={details.name}
      data-renderer={renderer.id}
    >
      {renderer.render({ variable: details, connection })}
    </Box>
  );
}

/** The variables of a kernel, listed, each opened by a click. */
export const KernelVariables = ({
  kernel,
  connection,
  execute,
  language = 'python',
  autoRefresh = true,
  showModules = false,
  renderers = [],
  maxHeight = 480,
}: KernelVariablesProps): ReactElement => {
  // The requests this view sent: their end is not an execution to follow.
  const ownMessages = useMemo(() => new Set<string>(), []);
  const source = useSource(kernel, connection, execute, language, ownMessages);
  const [variables, setVariables] = useState<KernelVariable[]>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [filter, setFilter] = useState('');
  const [modules, setModules] = useState(showModules);
  const [open, setOpen] = useState<string>();
  const [version, setVersion] = useState(0);
  const pending = useRef<ReturnType<typeof setTimeout>>(undefined);

  const refresh = useCallback(async () => {
    if (source.state !== 'ready') {
      return;
    }
    setLoading(true);
    try {
      const listed = await listKernelVariables(source.execute, {
        language: source.language,
        modules,
      });
      setVariables(listed);
      setError(undefined);
      setVersion(v => v + 1);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setLoading(false);
    }
  }, [source, modules]);

  useEffect(() => {
    setVariables(undefined);
    setOpen(undefined);
    void refresh();
  }, [refresh]);

  // After each execution on the kernel — not this view's own — and after a
  // restart, list again.
  useEffect(() => {
    const kernelConnection =
      source.state === 'ready' ? source.connection : undefined;
    if (!kernelConnection || !autoRefresh) {
      return;
    }
    const later = () => {
      clearTimeout(pending.current);
      pending.current = setTimeout(() => void refresh(), 250);
    };
    const onIOPub = (
      _: JupyterKernel.IKernelConnection,
      message: KernelMessage.IIOPubMessage
    ) => {
      if (message.header.msg_type !== 'status') {
        return;
      }
      const state = (message.content as KernelMessage.IStatusMsg['content'])
        .execution_state;
      const parent = message.parent_header as Partial<KernelMessage.IHeader>;
      if (
        state === 'idle' &&
        parent?.msg_type === 'execute_request' &&
        parent.msg_id &&
        !ownMessages.has(parent.msg_id)
      ) {
        later();
      }
    };
    let restarting = false;
    const onStatus = (
      _: JupyterKernel.IKernelConnection,
      status: KernelMessage.Status
    ) => {
      if (status === 'restarting' || status === 'autorestarting') {
        restarting = true;
        setVariables([]);
        setOpen(undefined);
      } else if (status === 'idle' && restarting) {
        restarting = false;
        later();
      }
    };
    kernelConnection.iopubMessage.connect(onIOPub);
    kernelConnection.statusChanged.connect(onStatus);
    return () => {
      clearTimeout(pending.current);
      kernelConnection.iopubMessage.disconnect(onIOPub);
      kernelConnection.statusChanged.disconnect(onStatus);
    };
  }, [source, autoRefresh, refresh, ownMessages]);

  const shown = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    return (variables ?? []).filter(
      variable =>
        !needle ||
        variable.name.toLowerCase().includes(needle) ||
        variable.type.toLowerCase().includes(needle)
    );
  }, [variables, filter]);

  if (source.state === 'none') {
    return (
      <Notice data-kernel-variables="none">
        No kernel: its variables are listed once there is one.
      </Notice>
    );
  }
  if (source.state === 'starting') {
    return (
      <Notice busy data-kernel-variables="starting">
        The kernel is starting…
      </Notice>
    );
  }
  if (source.state === 'unsupported') {
    return (
      <Notice data-kernel-variables="unsupported">
        {`Variables are listed for Python kernels; this one runs ${source.language}.`}
      </Notice>
    );
  }
  const ready = source;
  return (
    <Box
      data-kernel-variables="ready"
      sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <TextInput
          aria-label="Filter the variables"
          placeholder="Filter by name or type"
          leadingVisual={SearchIcon}
          value={filter}
          onChange={event => setFilter(event.target.value)}
          size="small"
          sx={{ flex: 1, minWidth: 0 }}
        />
        <IconButton
          icon={SyncIcon}
          aria-label="Refresh the variables"
          size="small"
          disabled={loading}
          onClick={() => void refresh()}
          data-kernel-variables-refresh=""
        />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Text
          id="kernel-variables-modules"
          sx={{ fontSize: 0, color: 'fg.muted', flex: 1 }}
        >
          {variables
            ? `${shown.length} of ${variables.length} variable${variables.length === 1 ? '' : 's'}`
            : ''}
        </Text>
        <Text sx={{ fontSize: 0, color: 'fg.muted' }}>Modules</Text>
        <ToggleSwitch
          size="small"
          aria-labelledby="kernel-variables-modules"
          checked={modules}
          onClick={() => setModules(!modules)}
          statusLabelPosition="end"
        />
      </Box>
      {error && (
        <Flash variant="danger" sx={{ fontSize: 1 }}>
          {error}
        </Flash>
      )}
      {!variables && !error && <Notice busy>Listing the variables…</Notice>}
      {variables && variables.length === 0 && !error && (
        <Notice data-kernel-variables="empty">
          No variables yet: define some by running code.
        </Notice>
      )}
      {shown.length > 0 && (
        <Box
          as="ul"
          sx={{
            listStyle: 'none',
            m: 0,
            p: 0,
            maxHeight,
            overflow: 'auto',
            border: '1px solid',
            borderColor: 'border.default',
            borderRadius: 2,
          }}
        >
          {shown.map(variable => {
            const expanded = open === variable.name;
            const renderer = kernelVariableRenderers.resolve(
              variable,
              renderers
            );
            const extent = kernelVariableExtent(variable);
            return (
              <Box
                as="li"
                key={variable.name}
                data-kernel-variable={variable.name}
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'border.muted',
                  '&:last-child': { borderBottom: 'none' },
                }}
              >
                <Box
                  as="button"
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setOpen(expanded ? undefined : variable.name)}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'auto minmax(0, 1fr) auto',
                    columnGap: 2,
                    alignItems: 'baseline',
                    width: '100%',
                    textAlign: 'left',
                    px: 2,
                    py: 1,
                    border: 'none',
                    bg: expanded ? 'canvas.subtle' : 'transparent',
                    color: 'fg.default',
                    cursor: 'pointer',
                    '&:hover': { bg: 'canvas.subtle' },
                  }}
                >
                  <Box sx={{ color: 'fg.muted', alignSelf: 'center' }}>
                    {expanded ? (
                      <ChevronDownIcon size={12} />
                    ) : (
                      <ChevronRightIcon size={12} />
                    )}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Text
                      sx={{
                        fontFamily: 'mono',
                        fontSize: 1,
                        fontWeight: 'bold',
                      }}
                    >
                      {variable.name}
                    </Text>
                    <Text
                      as="div"
                      sx={{
                        fontFamily: 'mono',
                        fontSize: 0,
                        color: 'fg.muted',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {renderer.summary?.(variable) ?? variable.preview}
                    </Text>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: 1,
                    }}
                  >
                    <Label variant="secondary" size="small">
                      {variable.type}
                    </Label>
                    <Text sx={{ fontSize: 0, color: 'fg.muted' }}>
                      {extent || formatBytes(variable.size)}
                    </Text>
                  </Box>
                </Box>
                {expanded && (
                  <Box sx={{ px: 3, pb: 3, pt: 1 }}>
                    <VariableDetails
                      variable={variable}
                      connection={ready.connection}
                      execute={ready.execute}
                      language={ready.language}
                      renderers={renderers}
                      version={version}
                    />
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      )}
      {variables && variables.length > 0 && shown.length === 0 && (
        <Notice>No variable matches the filter.</Notice>
      )}
    </Box>
  );
};

export default KernelVariables;

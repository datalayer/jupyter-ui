/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * A marimo notebook on a Jupyter kernel: marimo's own notebook UI — its
 * cells, editors, outputs and `mo.ui` elements — with marimo's kernel running
 * inside the Jupyter kernel it is given.
 *
 * marimo mounts once per page (its app owns page-level state), so render one
 * `MarimoNotebook` at a time; a second one shows an explanation instead.
 *
 * @module marimo/MarimoNotebook
 */

import { useEffect, useRef, useState } from 'react';
import type { Kernel as JupyterKernel } from '@jupyterlab/services';
import type { Kernel } from '../jupyter/kernel/Kernel';
import { kernelPort } from './kernelPort';
import type { MarimoMountOptions } from './bundle/index';

import './bundle/marimo.css';

/** The bundle, loaded once, on first use. */
let runtime: Promise<typeof import('./bundle/index')> | undefined;

function loadRuntime() {
  runtime ??= import('./bundle/index');
  return runtime;
}

/**
 * The tags marimo's page normally carries, read when its modules load: a
 * `<marimo-wasm>` makes marimo take its in-browser runtime path (the kernel
 * bridge replaces that runtime), `<marimo-filename>` names the notebook.
 */
function prepareDocument(filename: string) {
  if (!document.querySelector('marimo-wasm')) {
    document.head.appendChild(document.createElement('marimo-wasm'));
  }
  let tag = document.querySelector('marimo-filename');
  if (!tag) {
    tag = document.createElement('marimo-filename');
    tag.setAttribute('hidden', '');
    document.head.appendChild(tag);
  }
  tag.textContent = filename;
}

let mounted = false;

export interface MarimoNotebookProps {
  /** The kernel that runs the notebook; marimo must be installed in it. */
  kernel: Kernel | JupyterKernel.IKernelConnection;
  /** The notebook's source: a marimo `.py` file (`app = marimo.App()`, `@app.cell`, ...). */
  code?: string;
  /** Where the notebook lives on the kernel's filesystem; saved there. */
  filename?: string;
  /** `edit` shows the cells and their editors (the default); `read` the app view. */
  mode?: 'edit' | 'read';
  /** marimo user configuration, e.g. `{ runtime: { auto_instantiate: false } }`. */
  config?: Record<string, unknown>;
  /** The notebook's app configuration, e.g. `{ width: 'full' }`. */
  appConfig?: Record<string, unknown>;
  /** Query parameters the notebook reads with `mo.query_params()`. */
  queryParams?: Record<string, string | string[]>;
  /** Install marimo into a kernel that lacks it (pip, a minute or two); default true. */
  installMarimo?: boolean;
  /** The height of the notebook's container. */
  height?: string;
}

const EMPTY_NOTEBOOK = `import marimo

app = marimo.App()


@app.cell
def _():
    import marimo as mo
    return (mo,)


if __name__ == "__main__":
    app.run()
`;

function connectionOf(
  kernel: Kernel | JupyterKernel.IKernelConnection
): JupyterKernel.IKernelConnection | undefined {
  if ('connection' in kernel) {
    return (kernel as Kernel).connection ?? undefined;
  }
  return kernel as JupyterKernel.IKernelConnection;
}

export const MarimoNotebook = (props: MarimoNotebookProps) => {
  const {
    kernel,
    code = EMPTY_NOTEBOOK,
    filename = 'notebook.py',
    mode = 'edit',
    config = {},
    appConfig = {},
    queryParams,
    installMarimo = true,
    height = '100%',
  } = props;
  const container = useRef<HTMLDivElement>(null);
  const [failure, setFailure] = useState<string>();
  const connection = connectionOf(kernel);

  useEffect(() => {
    const el = container.current;
    if (!el || !connection) {
      return;
    }
    if (mounted) {
      setFailure(
        'marimo is already mounted on this page: one MarimoNotebook at a time.'
      );
      return;
    }
    mounted = true;
    let cancelled = false;
    prepareDocument(filename);
    void loadRuntime()
      .then(marimo => {
        if (cancelled) {
          return;
        }
        marimo.connectKernel(kernelPort(connection), {
          filename,
          code,
          queryParams,
          installMarimo,
        });
        const options: MarimoMountOptions = {
          filename,
          code,
          mode,
          config,
          appConfig,
          view: { showAppCode: true },
        };
        const error = marimo.mount(options, el);
        if (error) {
          console.error('marimo could not mount', error.stack ?? error);
          setFailure(error.message);
        }
      })
      .catch((error: unknown) => {
        console.error('marimo could not start', error);
        setFailure(error instanceof Error ? error.message : String(error));
      });
    return () => {
      cancelled = true;
    };
    // The notebook is mounted once, for the kernel it first sees.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection]);

  if (failure) {
    return (
      <div
        role="alert"
        style={{ padding: '1rem', color: 'var(--fgColor-danger, #d1242f)' }}
      >
        {failure}
      </div>
    );
  }
  return (
    <div
      ref={container}
      className="marimo"
      style={{ height, overflow: 'auto' }}
    />
  );
};

export default MarimoNotebook;

/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React, { useState, useEffect, useRef } from 'react';
import BrowserOnly from '@docusaurus/core/lib/client/exports/BrowserOnly';

type JupyterCellProps = {
  jupyterServerUrl?: string;
  jupyterServerToken?: string;
  source?: string;
};

type JupyterModules = {
  JupyterReactTheme: React.ComponentType<{ children: React.ReactNode }>;
  Cell: React.ComponentType<{ source: string; kernel?: any }>;
  useJupyter: (props: {
    jupyterServerUrl: string;
    jupyterServerToken: string;
    startDefaultKernel: boolean;
  }) => { defaultKernel?: any; kernelIsLoading: boolean };
};

// Inner component that loads and renders the Jupyter cell
const JupyterCellInner = (props: JupyterCellProps) => {
  const {
    jupyterServerUrl = 'https://oss.datalayer.run/api/jupyter-server',
    jupyterServerToken = '60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6',
    source = '',
  } = props;

  const [modules, setModules] = useState<JupyterModules | null>(null);
  const loadedRef = useRef(false);

  // Load modules only once on mount
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const loadModules = async () => {
      const [jupyterUseModule, themeModule, cellModule] = await Promise.all([
        import('@datalayer/jupyter-react/lib/jupyter/JupyterUse'),
        import('@datalayer/jupyter-react/lib/theme/JupyterReactTheme'),
        import('@datalayer/jupyter-react/lib/components/cell/Cell'),
      ]);
      setModules({
        useJupyter: jupyterUseModule.useJupyter,
        JupyterReactTheme: themeModule.JupyterReactTheme,
        Cell: cellModule.Cell,
      });
    };
    loadModules();
  }, []);

  if (!modules) {
    return <div>Loading Jupyter components...</div>;
  }

  const { JupyterReactTheme } = modules;

  // JupyterReactTheme must wrap the component that uses useJupyter
  return (
    <JupyterReactTheme>
      <JupyterCellContent
        modules={modules}
        jupyterServerUrl={jupyterServerUrl}
        jupyterServerToken={jupyterServerToken}
        source={source}
      />
    </JupyterReactTheme>
  );
};

// Memoized Cell wrapper to prevent re-renders
const MemoizedCell = React.memo(
  ({
    Cell,
    source,
    kernel,
  }: {
    Cell: React.ComponentType<{ source: string; kernel?: any }>;
    source: string;
    kernel: any;
  }) => {
    return <Cell source={source} kernel={kernel} />;
  },
  (prevProps, nextProps) => {
    // Only re-render if source changes, never re-render for kernel changes
    // since we pass a stable kernel ref
    return (
      prevProps.source === nextProps.source &&
      prevProps.kernel === nextProps.kernel
    );
  },
);

// Separate component to use hooks - must be inside JupyterReactTheme
const JupyterCellContent = ({
  modules,
  jupyterServerUrl,
  jupyterServerToken,
  source,
}: {
  modules: JupyterModules;
  jupyterServerUrl: string;
  jupyterServerToken: string;
  source: string;
}) => {
  const { Cell, useJupyter } = modules;
  const [kernelReady, setKernelReady] = useState(false);
  const kernelRef = useRef<any>(null);
  const readyPromiseRef = useRef<Promise<void> | null>(null);

  const { defaultKernel, kernelIsLoading } = useJupyter({
    jupyterServerUrl,
    jupyterServerToken,
    startDefaultKernel: true,
  });

  // Wait for kernel to be truly ready before rendering Cell
  // Use refs to ensure we only set up the kernel once
  useEffect(() => {
    if (defaultKernel && !kernelRef.current && !readyPromiseRef.current) {
      kernelRef.current = defaultKernel;
      readyPromiseRef.current = defaultKernel.ready.then(() => {
        setKernelReady(true);
      });
    }
  }, [defaultKernel]);

  if (kernelIsLoading || !kernelReady || !kernelRef.current) {
    return <div>Connecting to Jupyter kernel...</div>;
  }

  return (
    <MemoizedCell Cell={Cell} source={source} kernel={kernelRef.current} />
  );
};

const JupyterCell = (props: JupyterCellProps) => {
  return (
    <BrowserOnly
      fallback={<div>Jupyter Cell fallback content for prerendering.</div>}
    >
      {() => <JupyterCellInner {...props} />}
    </BrowserOnly>
  );
};

export default JupyterCell;

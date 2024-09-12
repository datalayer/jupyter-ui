/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { memo, useState, useEffect, useMemo, useRef } from 'react';
import { Box } from '@primer/react';
import { JupyterLab } from '@jupyterlab/application';
import { PageConfig } from '@jupyterlab/coreutils';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { ServiceManager } from '@jupyterlab/services';
import { useJupyter } from '../../jupyter/JupyterContext';
import { Colormode } from '../../theme/JupyterLabColormode';
import { JupyterLabAppCorePlugins } from './JupyterLabAppPlugins';
import JupyterLabAppAdapter from './JupyterLabAppAdapter';
import JupyterLabAppCss from './JupyterLabAppCss';

// The webpack public path needs to be set before loading the CSS assets.
(globalThis as any).__webpack_public_path__ = PageConfig.getOption('fullStaticUrl') + '/';
(window as any).__webpack_public_path__ = PageConfig.getOption('fullStaticUrl') + '/';

export type JupyterLabAppProps = {
  PluginType?: any;
  devMode: boolean;
  disabledPlugins: Array<string>;
  headless: boolean;
  height: string | number;
  hostId: string;
  mimeRendererPromises?: Array<Promise<IRenderMime.IExtensionModule>>;
  mimeRenderers: Array<IRenderMime.IExtensionModule>;
  nosplash: boolean;
  onJupyterLab: (jupyterLabAppdapter: JupyterLabAppAdapter) => void;
  onPlugin?: (plugin: any) => void;
  pluginId?: string;
  pluginPromises?: Array<Promise<JupyterLab.IPluginModule>>;
  plugins: Array<JupyterLab.IPluginModule>;
  position: string;
  serverless: boolean;
  serviceManager: ServiceManager.IManager;
  startDefaultKernel: boolean;
  theme: Colormode;
  width: string | number;
};

const JupyterLabAppComponent = (props: JupyterLabAppProps) => {
  const {
    PluginType,
    headless,
    height,
    hostId,
    onJupyterLab,
    onPlugin,
    pluginId,
    position,
    serverless,
    serviceManager: propsServiceManager,
    startDefaultKernel,
    theme,
    width,
  } = props;
  const { serviceManager, collaborative } = useJupyter({
    serverless,
    serviceManager: propsServiceManager,
    startDefaultKernel,
  });
  const defaultMimeExtensionPromises = useMemo(
    () =>
      props.mimeRendererPromises ??
      JupyterLabAppCorePlugins(collaborative).mimeExtensionPromises,
    []
  );
  const defaultExtensionPromises = useMemo(
    () =>
      props.pluginPromises ??
      JupyterLabAppCorePlugins(collaborative).extensionPromises,
    []
  );
  const ref = useRef<HTMLDivElement>(null);
  const [_, setAdapter] = useState<JupyterLabAppAdapter>();
  useEffect(() => {
    if (ref && serviceManager) {
      const adapter = new JupyterLabAppAdapter({
        ...props,
        mimeRendererPromises: defaultMimeExtensionPromises,
        pluginPromises: defaultExtensionPromises,
        collaborative,
        serviceManager,
      });
      adapter.ready.then(() => {
        onJupyterLab(adapter!);
        if (pluginId && PluginType && onPlugin) {
          const plugin = adapter!.service(pluginId) as typeof PluginType;
          onPlugin(plugin);
        }
      });
      setAdapter(adapter);
    }
  }, [hostId, ref, serviceManager, theme]);
  return (
    <>
      <Box
        sx={{
          '& .jp-LabShell': {
            position: position as any,
            height: height as any,
            width: width as any,
            display: headless ? 'none' : 'inherit',
          },
        }}
      >
        <JupyterLabAppCss theme={theme} />
        <div ref={ref} id={hostId} />
      </Box>
    </>
  );
};

JupyterLabAppComponent.defaultProps = {
  devMode: false,
  disabledPlugins: [],
  headless: false,
  height: '100vh',
  hostId: 'app-example-id',
  mimeRenderers: [],
  onJupyterLab: (_: JupyterLabAppAdapter) => {},
  plugins: [],
  position: 'relative',
  nosplash: false,
  serverless: false,
  startDefaultKernel: false,
  theme: 'light',
  width: '100%',
} as Partial<JupyterLabAppProps>;

export const JupyterLabApp = memo(JupyterLabAppComponent);

export default JupyterLabApp;

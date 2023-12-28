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
import { useJupyter } from '../../jupyter/JupyterContext';
import { JupyterLabTheme } from './../../jupyter/lab/JupyterLabTheme';
import { JupyterLabAppCorePlugins } from './JupyterLabAppPlugins';
import JupyterLabAppAdapter from './JupyterLabAppAdapter';
import JupyterLabAppCss from './JupyterLabAppCss';

// The webpack public path needs to be set before loading the CSS assets.
(globalThis as any).__webpack_public_path__ =
  PageConfig.getOption('fullStaticUrl') + '/';
(window as any).__webpack_public_path__ =
  PageConfig.getOption('fullStaticUrl') + '/';

export type JupyterLabAppProps = {
  devMode: boolean;
  extensionPromises?: Array<Promise<JupyterLab.IPluginModule>>;
  extensions: Array<JupyterLab.IPluginModule>;
  headless: boolean;
  height: string | number;
  hostId: string;
  mimeExtensionPromises?: Array<Promise<IRenderMime.IExtensionModule>>;
  mimeExtensions: Array<IRenderMime.IExtensionModule>;
  disabledExtensions: Array<string>;
  onPlugin?: (plugin: any) => void;
  onJupyterLab: (jupyterLabAppdapter: JupyterLabAppAdapter) => void;
  pluginId?: string;
  PluginType?: any;
  position: string;
  splash: boolean;
  theme: JupyterLabTheme;
  width: string | number;
};

export const JupyterLabApp = (props: JupyterLabAppProps) => {
  const {
    hostId,
    position,
    height,
    width,
    headless,
    theme,
    onJupyterLab,
    pluginId,
    PluginType,
    onPlugin,
  } = props;
  const { serviceManager, collaborative } = useJupyter();
  const defaultMimeExtensionPromises = useMemo(
    () =>
      props.mimeExtensionPromises ??
      JupyterLabAppCorePlugins(collaborative).mimeExtensionPromises,
    []
  );
  const defaultExtensionPromises = useMemo(
    () =>
      props.extensionPromises ??
      JupyterLabAppCorePlugins(collaborative).extensionPromises,
    []
  );
  const ref = useRef<HTMLDivElement>(null);
  const [_, setAdapter] = useState<JupyterLabAppAdapter>();
  useEffect(() => {
    if (ref && serviceManager) {
      const adapter = new JupyterLabAppAdapter({
        ...props,
        mimeExtensionPromises: defaultMimeExtensionPromises,
        extensionPromises: defaultExtensionPromises,
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

JupyterLabApp.defaultProps = {
  devMode: false,
  extensions: [],
  headless: false,
  height: '100vh',
  hostId: 'app-example-id',
  mimeExtensions: [],
  disabledExtensions: [],
  onJupyterLab: (jupyterLabAppAdapter: JupyterLabAppAdapter) => {},
  position: 'relative',
  splash: true,
  theme: 'light',
  width: '100%',
} as Partial<JupyterLabAppProps>;

export default memo(JupyterLabApp);

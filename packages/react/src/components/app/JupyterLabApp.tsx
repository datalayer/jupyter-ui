import { memo, useState, useEffect, useRef } from "react";
import { Box } from "@primer/react";
import { PageConfig } from '@jupyterlab/coreutils';
import { JupyterLab } from '@jupyterlab/application';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { useJupyter } from "../../jupyter/JupyterContext";
import { JupyterLabTheme } from "./../../jupyter/lab/JupyterLabTheme";
import JupyterLabAppAdapter from "./JupyterLabAppAdapter";
import JupyterLabAppCss from "./JupyterLabAppCss";

let _adapter: JupyterLabAppAdapter | undefined = undefined;

// The webpack public path needs to be set before loading the CSS assets.
(global as any).__webpack_public_path__ = PageConfig.getOption('fullStaticUrl') + '/';

export type JupyterLabAppProps = {
  devMode: boolean;
  extensionPromises?: Array<Promise<JupyterLab.IPluginModule>>;
  extensions: Array<JupyterLab.IPluginModule>;
  headless: boolean;
  height: string | number;
  hostId: string;
  mimeExtensionPromises?: Array<Promise<IRenderMime.IExtensionModule>>;
  mimeExtensions: Array<IRenderMime.IExtensionModule>;
  onPlugin?: (plugin: any) => void;
  onJupyterLab: (jupyterLabAppdapter: JupyterLabAppAdapter) => void;
  pluginId?: string;
  PluginType?: any;
  position: string;
  theme: JupyterLabTheme;
  width: string | number;
}

export const JupyterLabApp = (props: JupyterLabAppProps) => {
  const {
    hostId, position, height, width, headless, theme,
    onJupyterLab, pluginId, PluginType, onPlugin,
  } = props;
  const { serviceManager, collaborative } = useJupyter();
  const ref = useRef<HTMLDivElement>(null);
  const [_, setAdapter] = useState<JupyterLabAppAdapter>();
  useEffect(() => {
    if (ref && serviceManager) {
      if (!_adapter) {
        _adapter = new JupyterLabAppAdapter({
          ...props,
          collaborative,
          serviceManager,
        });
      }
      _adapter.ready.then(() => {
        onJupyterLab(_adapter!);
        if (pluginId && PluginType && onPlugin) {
          const plugin = _adapter!.service(pluginId) as typeof PluginType;
          onPlugin(plugin);
        }
      });
      setAdapter(_adapter);
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
        <JupyterLabAppCss theme={theme}/>
        <div ref={ref} id={hostId}/>
      </Box>
    </>
  )
}

JupyterLabApp.defaultProps = {
  devMode: false,
  extensions: [],
  headless: false,
  height: "100vh",
  hostId: "app-example-id",
  mimeExtensions: [],
  onJupyterLab: (jupyterlabAppAdapter: JupyterLabAppAdapter) => {},
  position: "relative",
  theme: 'light',
  width: "100%",
} as Partial<JupyterLabAppProps>;

export default memo(JupyterLabApp);

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
  hostId: string;
  extensions: Array<JupyterLab.IPluginModule>;
  mimeExtensions: Array<IRenderMime.IExtensionModule>;
  extensionPromises?: Array<Promise<JupyterLab.IPluginModule>>;
  mimeExtensionPromises?: Array<Promise<IRenderMime.IExtensionModule>>;
  position: string;
  width: string | number;
  height: string | number;
  devMode: boolean;
  headless: boolean;
  theme: JupyterLabTheme;
  onReady: (jupyterlabAppdapter: JupyterLabAppAdapter) => void;
}

export const JupyterLabApp = (props: JupyterLabAppProps) => {
  const { hostId, position, height, width, headless, theme, onReady } = props;
  const { serviceManager, collaborative } = useJupyter();
  const ref = useRef<HTMLDivElement>(null);
  const [_, setAdapter] = useState<JupyterLabAppAdapter>();
  useEffect(() => {
    if (_adapter) {
      setAdapter(_adapter);
      onReady(_adapter);
      return;
    }
    if (ref && serviceManager) {
      const adapter = new JupyterLabAppAdapter({
        ...props,
        collaborative,
        serviceManager,
      });
      adapter.ready.then(() => {
        onReady(adapter);
      });
      setAdapter(_adapter);
      _adapter = adapter;
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
  hostId: "app-example-id",
  extensions: [],
  mimeExtensions: [],
  position: "relative",
  width: "100%",
  height: "100vh",
  devMode: false,
  theme: 'light',
  headless: false,
  onReady: (jupyterlabAppAdapter: JupyterLabAppAdapter) => {}
} as Partial<JupyterLabAppProps>;

export default memo(JupyterLabApp);

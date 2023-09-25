import { useState, useEffect, useRef } from "react";
import { Box } from "@primer/react";
import { JupyterLab } from '@jupyterlab/application';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { ServiceManager } from "@jupyterlab/services";
import JupyterLabAppAdapter from "./JupyterLabAppAdapter";
import { useJupyter } from "../../jupyter/JupyterContext";

export type JupyterLabAppProps = {
  hostId: string;
  extensions: Array<JupyterLab.IPluginModule>;
  mimeExtensions: Array<IRenderMime.IExtensionModule>;
  extensionPromises: Array<Promise<JupyterLab.IPluginModule>>;
  mimeExtensionPromises: Array<Promise<IRenderMime.IExtensionModule>>;
  position: string;
  width: string | number;
  height: string | number;
  devMode: boolean;
  headless: boolean;
  serviceManager?: ServiceManager
  onReady: (jupyterLab: JupyterLab) => void
}

export const JupyterLabApp = (props: JupyterLabAppProps) => {
  const { hostId, position, height, width, headless, onReady } = props;
  const { serviceManager } = useJupyter();
  const ref = useRef<HTMLDivElement>(null);
  const [_, setAdapter] = useState<JupyterLabAppAdapter>();
  useEffect(() => {
    if (ref && serviceManager) {
      const adapter = new JupyterLabAppAdapter({
        ...props,
        serviceManager,
      });
      adapter.ready.then(() => {
        onReady(adapter.jupyterLab);
      });
      setAdapter(adapter);
    }
  }, [hostId, ref, serviceManager]);
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
        <div ref={ref} id={hostId}/>
      </Box>
    </>
  )
}

JupyterLabApp.defaultProps = {
  hostId: "app-example-id",
  extensions: [],
  mimeExtensions: [],
  extensionPromises: [],
  mimeExtensionPromises: [],
  position: "relative",
  width: "100%",
  height: "100vh",
  devMode: false,
  headless: false,
  onReady: (jupyterLab: JupyterLab) => {}
} as Partial<JupyterLabAppProps>;

export default JupyterLabApp;

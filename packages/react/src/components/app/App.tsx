import { useState, useEffect, useRef } from "react";
import { Box } from "@primer/react";
import { JupyterLab } from '@jupyterlab/application';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import AppAdapter from "./AppAdapter";

export type AppProps = {
  hostId?: string;
  extensions: Array<JupyterLab.IPluginModule>;
  mimeExtensions: Array<IRenderMime.IExtensionModule>;
  extensionPromises: Array<Promise<JupyterLab.IPluginModule>>;
  mimeExtensionsPromises: Array<Promise<IRenderMime.IExtensionModule>>;
}

export const App = (props: AppProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { hostId, extensions, mimeExtensions, extensionPromises, mimeExtensionsPromises } = props;
  const [_, setAdapter] = useState<AppAdapter>();
  useEffect(() => {
    if (ref) {
      const adapter = new AppAdapter({
        hostId,
        extensions,
        mimeExtensions,
        extensionPromises,
        mimeExtensionsPromises,
      });
      setAdapter(adapter);
    }
  }, [hostId, ref])
  return (
    <>
      <Box
        sx={{
          '& .jp-LabShell': {
//            position: "relative",
            height: 800,
          }
        }}
      >
        <div ref={ref} id={hostId}/>
    </Box>
  </>
  )
}

App.defaultProps = {
  hostId: "app-example-id",
} as Partial<AppProps>;

export default App;

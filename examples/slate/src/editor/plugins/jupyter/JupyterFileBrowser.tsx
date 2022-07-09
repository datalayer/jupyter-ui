import { FileBrowser } from '@datalayer/jupyter-react';
import { RenderJupyterProps } from "../../elements/Element";

const JupyterFileBrowser = ({attributes, children, element}: RenderJupyterProps) => {
  return (
    <div {...attributes}>
      <FileBrowser/>
      {children}
    </div>
  )   
}

export default JupyterFileBrowser;

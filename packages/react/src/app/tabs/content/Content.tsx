import { JupyterFrontEndProps } from '../../JupyterReact';
import { Jupyter } from './../../../jupyter/Jupyter';
import { FileBrowser } from './../../../components/filebrowser/FileBrowser';

const Content = (props: JupyterFrontEndProps) => {
  return (
    <>
      <Jupyter startDefaultKernel={false}>
        <FileBrowser/>
      </Jupyter>
    </>
  )
}

export default Content;

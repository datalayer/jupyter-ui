import { Jupyter } from '../../../jupyter/Jupyter';
import { FileBrowser } from '../../../components/filebrowser/FileBrowser';

const FileBrowserComponent = () => {
  return (
    <>
      <Jupyter>
        <FileBrowser/>
      </Jupyter>
    </>
  )
}

export default FileBrowserComponent;

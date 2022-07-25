import FileBrowserAdapter from './FileBrowserAdapter';
import Lumino from '../../jupyter/lumino/Lumino';

export const FileBrowser = () => {
  const fileBrowserAdpater = new FileBrowserAdapter();
  return <Lumino>{fileBrowserAdpater.panel}</Lumino>
}

export default FileBrowser;

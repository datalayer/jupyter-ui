import FileBrowserAdapter from './FileBrowserAdapter';
import Lumino from '../../jupyter/lumino/Lumino';

export const FileBrowserLab = () => {
  const fileBrowserAdapter = new FileBrowserAdapter();
  return <Lumino>{fileBrowserAdapter.panel}</Lumino>
}

export default FileBrowserLab;

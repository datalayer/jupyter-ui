import FileManagerAdapter from './FileManagerAdapter';
import Lumino from '../../../jupyter/lumino/Lumino';

export const FileManagerLab = () => {
  const fileBrowserAdapter = new FileManagerAdapter();
  return <Lumino>{fileBrowserAdapter.panel}</Lumino>
}

export default FileManagerLab;

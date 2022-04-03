import FileBrowserAdapter from './FileBrowserAdapter';
import LuminoAttached from '../../lumino/LuminoAttached';

const FileBrowserLumino = () => {
  const fileBrowserLumino = new FileBrowserAdapter();
  return <LuminoAttached>{fileBrowserLumino.panel}</LuminoAttached>
}

export default FileBrowserLumino;

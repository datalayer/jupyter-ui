import FileBrowserAdapter from './FileBrowserAdapter';
import LuminoAttached from '../../lumino/LuminoAttached';

const FileBrowser = () => {
  const fileBrowserAdpater = new FileBrowserAdapter();
  return <LuminoAttached>{fileBrowserAdpater.panel}</LuminoAttached>
}

export default FileBrowser;

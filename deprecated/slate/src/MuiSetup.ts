import { create } from 'jss';
import { jssPreset } from '@mui/styles';
import createCache from '@emotion/cache';

const setupMui = (id: string) => {
  const jss = create({
    ...jssPreset(),
    insertionPoint: document.getElementById(id) as HTMLElement,
  });
  const cache = createCache({
    key: 'css',
    prepend: true,
  });  
  return { jss, cache }
}

export default setupMui;

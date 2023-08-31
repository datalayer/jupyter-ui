import { ICell } from '@jupyterlab/nbformat';
import { UUID } from '@lumino/coreutils';

// const MAX = Number.MAX_SAFE_INTEGER;
// const MAX = 999999;

export const newSourceId = (base: string) => {
//  return base + Math.floor(Math.random() * MAX).toString();
  return base;
};

export const newUuid = () => {
  return UUID.uuid4();
}

export const sourceAsString = (cell: ICell) => {
  let source = cell.source;
  if (typeof(source) === 'object') {
    source = (source as []).join('\n')
  }
  return source;
}

export const getCookie = (name: string): string | null=> {
	const nameLenPlus = (name.length + 1);
	return document.cookie
		.split(';')
		.map(c => c.trim())
		.filter(cookie => {
			return cookie.substring(0, nameLenPlus) === `${name}=`;
		})
		.map(cookie => {
			return decodeURIComponent(cookie.substring(nameLenPlus));
		})[0] || null;
}

import { IWidgetTracker } from '@jupyterlab/apputils';
import { Token } from '@lumino/coreutils';
import { Viewer } from './ViewerDocument';

export type IViewerTracker = IWidgetTracker<Viewer>

export const IViewerTracker = new Token<IViewerTracker>(
  '@datalayer/jupyter-dashboard:IViewerTracker'
);

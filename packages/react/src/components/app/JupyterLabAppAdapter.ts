import { JupyterLab } from '@jupyterlab/application';
import { PageConfig } from '@jupyterlab/coreutils';
import { JupyterLabAppProps } from "./JupyterLabApp";

// The webpack public path needs to be set before loading the CSS assets.
(global as any).__webpack_public_path__ = PageConfig.getOption('fullStaticUrl') + '/';
// const styles = import('./AppCss' as any) as Promise<any>;
import('./JupyterLabAppCss') as Promise<any>;

export class JupyterLabAppAdapter {
  private _props: JupyterLabAppProps;
  private _jupyterLab: JupyterLab;
  private _ready: Promise<void>;
  private _readyResolve: () => void;

  constructor(props: JupyterLabAppProps) {
    this._ready = new Promise((resolve, _) => {
      this._readyResolve = resolve;
    });
    this.loadApp(props);
  }

  async loadApp(props: JupyterLabAppProps) {
    const { hostId, extensions, mimeExtensions, extensionPromises, mimeExtensionPromises, devMode, headless } = props;
    this._props = props;
//    await styles;
    const renderMimeExtensionResolved = await Promise.all(mimeExtensionPromises);
    mimeExtensions.push(...renderMimeExtensionResolved);
    this._jupyterLab = new JupyterLab({
      mimeExtensions,
      devMode,
      deferred: {
        patterns: [],
        matches: [],
      },
    });
    const extensionResolved = await Promise.all(extensionPromises);
    extensions.push(...extensionResolved);
    this._jupyterLab.registerPluginModules(extensions);
    if (headless) {
      this._jupyterLab.deregisterPlugin('@jupyterlab/apputils-extension:splash', true);
    }
    this._jupyterLab.start({
      hostID: hostId,
    });
    this._jupyterLab.restored.then(() => {
      this._readyResolve();
    });
  }

  get jupyterLab() {
    return this._jupyterLab;
  }

  get ready() {
    return this._ready;
  }

  get props() {
    return this._props;
  }

}

export default JupyterLabAppAdapter;

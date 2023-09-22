import { JupyterLab } from '@jupyterlab/application';
import { PageConfig } from '@jupyterlab/coreutils';
import { AppProps } from "./App";

// The webpack public path needs to be set before loading the CSS assets.
(global as any).__webpack_public_path__ = PageConfig.getOption('fullStaticUrl') + '/';
// const styles = import('./AppCss' as any) as Promise<any>;
import('./AppCss' as any) as Promise<any>;

export class AppAdapter {
  private _jupyterLab: JupyterLab;

  constructor(props: AppProps) {
    this.loadApp(props);
  }

  async loadApp(props: AppProps) {
    const { hostId, extensions, mimeExtensions, extensionPromises, mimeExtensionsPromises } = props;
//    await styles;
    const renderMimeExtensionResolved = await Promise.all(mimeExtensionsPromises);
    mimeExtensions.push(...renderMimeExtensionResolved);
    this._jupyterLab = new JupyterLab({ mimeExtensions });
    const extensionResolved = await Promise.all(extensionPromises);
    extensions.push(...extensionResolved);
    this._jupyterLab.registerPluginModules(extensions);
//    await jupyterLab.start({ hostID: hostId });
    this._jupyterLab.start({ hostID: hostId });
//    await jupyterLab.restored;
  }

  get jupyterLab() {
    return this._jupyterLab;
  }

}

export default AppAdapter;

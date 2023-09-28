import { CommandRegistry } from '@lumino/commands';
// import { Widget } from '@lumino/widgets';
import { JupyterLab, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { JupyterFrontEnd, LabShell } from '@jupyterlab/application';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { JupyterLabAppProps } from "./JupyterLabApp";
/*
interface IHeadLessLabShell extends ILabShell {
//  set currentWidget(widget: Widget | null);
}
class HeadlessLabShell extends LabShell implements IHeadLessLabShell {
  private _currentWidget: Widget | null;
  constructor(options?: ILabShell.IOptions) {
    super(options);
  }
  get currentWidget() {
    return this._currentWidget;
  }
  set currentWidget(widget: Widget | null) {
    this._currentWidget = widget;
  }
}
class HeadLessJupyterLab extends JupyterLab implements JupyterFrontEnd<ILabShell> {
  constructor(options?: JupyterLab.IOptions) {
    super(options);
  }
}
*/
type Plugin = JupyterFrontEndPlugin<any, any, any> & {
  service: any;
}

type Plugins = Map<string, Plugin>;

export class JupyterLabAppAdapter {
  private _props: JupyterLabAppProps;
  private _jupyterlab: JupyterLab;
  private _shell: LabShell;
  private _plugins: Plugins;
  private _ready: Promise<void>;
  private _readyResolve: () => void;

  constructor(props: JupyterLabAppProps) {
    this._ready = new Promise((resolve, _) => {
      this._readyResolve = resolve;
    });
    this.loadApp(props);
  }

  async loadApp(props: JupyterLabAppProps) {
    this._props = props;
    const { hostId, extensions, mimeExtensions, extensionPromises, mimeExtensionPromises, devMode, headless, serviceManager } = props;
    const mimeExtensionResolved = await Promise.all(mimeExtensionPromises);
    mimeExtensions.push(...mimeExtensionResolved);
    this._shell = new LabShell();
    this._jupyterlab = new JupyterLab({
      shell: this._shell,
      mimeExtensions,
      devMode,
      serviceManager,
      disabled: {
        patterns: [],
        matches: [],
      },
      deferred: {
        patterns: [],
        matches: [],
      },
    });
    const extensionResolved = await Promise.all(extensionPromises);
    extensions.push(...extensionResolved);
    this._jupyterlab.registerPluginModules(extensions);
    if (headless) {
//      this._jupyterlab.deregisterPlugin('@jupyterlab/apputils-extension:splash', true);
    }
    this._jupyterlab.start({
      hostID: hostId,
      startPlugins: [],
      ignorePlugins: [],
    });
    this._jupyterlab.restored.then(() => {
      this._plugins = (this._jupyterlab as any)['_plugins'];
      this._readyResolve();  
    })
  }

  get jupyterlab(): JupyterLab {
    return this._jupyterlab;
  }

  get shell(): LabShell {
    return this._shell;
  }

  get docRegistry(): DocumentRegistry {
    return this._jupyterlab.docRegistry;
  }

  get commands(): CommandRegistry {
    return this._jupyterlab.commands;
  }

  get mimeExtensions(): IRenderMime.IExtensionModule[] {
    return this._jupyterlab.info.mimeExtensions;
  }

  get info(): JupyterLab.IInfo {
    return this._jupyterlab.info;
  }

  get path(): JupyterFrontEnd.IPaths {
    return this._jupyterlab.paths;
  }

  get plugins(): Plugins {
    return this._plugins;
  }

  get ready(): Promise<void> {
    return this._ready;
  }

  get props(): JupyterLabAppProps {
    return this._props;
  }

  plugin(id: string): Plugin | undefined {
    return this._plugins.get(id);
  }

  service(id: string): Plugin["service"] {
    return this._plugins.get(id)?.service;
  }

}

export default JupyterLabAppAdapter;

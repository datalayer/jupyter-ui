/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { CommandRegistry } from '@lumino/commands';
import { BoxPanel, Widget, FocusTracker } from '@lumino/widgets';
import { JupyterLab, JupyterFrontEndPlugin, JupyterFrontEnd, LabShell } from '@jupyterlab/application';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { NotebookPanel } from '@jupyterlab/notebook';
import { ServiceManager } from '@jupyterlab/services';
import { JupyterLabAppProps } from './JupyterLabApp';

type Plugin = JupyterFrontEndPlugin<any, any, any> & {
  service: any;
};

type Plugins = Map<string, Plugin>;

type Props = JupyterLabAppProps & {
  serviceManager: ServiceManager.IManager;
  collaborative?: boolean;
};

export class JupyterLabAppAdapter {
  private _jupyterLab: JupyterLab;
  private _shell: LabShell;
  private _plugins: Plugins;
  private _ready: Promise<void>;
  private _readyResolve: () => void;

  constructor(props: Props, jupyterlab?: JupyterLab) {
    if (jupyterlab) {
      this._jupyterLab = jupyterlab;
      this._ready = new Promise((resolve, _) => {
        this._readyResolve = resolve;
      });
      this._plugins = (this._jupyterLab as any)['_plugins'];
      this._readyResolve();
      return;
    }
    this._ready = new Promise((resolve, _) => {
      this._readyResolve = resolve;
    });
    this.load(props);
  }

  private async load(props: Props) {
    const {
      disabledPlugins,
      hostId,
      plugins: extensions,
      mimeRenderers: mimeExtensions,
      nosplash,
      pluginPromises: extensionPromises,
      mimeRendererPromises: mimeExtensionPromises,
      devMode,
      serviceManager,
    } = props;
    const mimeExtensionResolved = await Promise.all(mimeExtensionPromises!);
    mimeExtensions.push(...mimeExtensionResolved);
    this._shell = new LabShell();
    this._jupyterLab = new JupyterLab({
      shell: this._shell,
      mimeExtensions,
      devMode,
      serviceManager,
      disabled: {
        matches: [],
        patterns: [],
      },
      deferred: {
        patterns: [],
        matches: [],
      },
    });
    const extensionResolved = await Promise.all(extensionPromises!);
    disabledPlugins.push(
      "@jupyterlab/notebook-extension:language-server",
      "@jupyterlab/notebook-extension:update-raw-mimetype",
      "@jupyterlab/fileeditor-extension:language-server",
      "@jupyterlab/apputils-extension:sessionDialogs",
    );
    const disabledPluginsSet = new Set(disabledPlugins);
    extensionResolved.forEach(ext => {
      if (Array.isArray(ext.default)) {
        ext.default.forEach(plugin => {
          if (!disabledPluginsSet.has(plugin.id)) {
            extensions.push(plugin as any);
          }
        });
      }
      else {
        if (!disabledPluginsSet.has(ext.default.id)) {
          extensions.push(ext);
        }
      }
    });
    this._jupyterLab.registerPluginModules(extensions);
    if (nosplash) {
      this._jupyterLab.deregisterPlugin('@jupyterlab/apputils-extension:splash', true);
    }
    /*
    if (collaborative) {
      this._jupyterLab.deregisterPlugin("@jupyterlab/filebrowser-extension:default-file-browser", true);
    }
    */
    this._jupyterLab.start({
      hostID: hostId,
      bubblingKeydown: true, // TODO Check this prop.
      startPlugins: [], // How is this used in JupyterLab core?
      ignorePlugins: [], // How is this used in JupyterLab core?
    }).then(() => {
//      this._plugins = (this._jupyterLab as any)['_plugins'];
//      this._readyResolve();
    });
    this._jupyterLab.restored.then(() => {
      this._plugins = (this._jupyterLab as any)['_plugins'];
      this._readyResolve();
    });
  }

  static create(jupyterLab: JupyterLab): JupyterLabAppAdapter {
    return new JupyterLabAppAdapter(undefined as any, jupyterLab);
  }

  get jupyterLab(): JupyterLab {
    return this._jupyterLab;
  }

  get shell(): LabShell {
    return this._jupyterLab.shell;
  }

  get docRegistry(): DocumentRegistry {
    return this._jupyterLab.docRegistry;
  }

  get commands(): CommandRegistry {
    return this._jupyterLab.commands;
  }

  get serviceManager(): ServiceManager.IManager {
    return this._jupyterLab.serviceManager;
  }

  get mimeExtensions(): IRenderMime.IExtensionModule[] {
    return this._jupyterLab.info.mimeExtensions;
  }

  get info(): JupyterLab.IInfo {
    return this._jupyterLab.info;
  }

  get path(): JupyterFrontEnd.IPaths {
    return this._jupyterLab.paths;
  }

  get plugins(): Plugins {
    return this._plugins;
  }

  get ready(): Promise<void> {
    return this._ready;
  }

  get focusTracker(): FocusTracker<Widget> {
    return (this.shell as any)._tracker as FocusTracker<Widget>;
  }

  plugin(id: string): Plugin | undefined {
    return this._plugins.get(id);
  }

  service(id: string): Plugin['service'] {
    return this._plugins.get(id)?.service;
  }

  async notebook(path: string) {
    await this.commands.execute('apputils:reset');
    const notebookPanel = (await this.commands.execute('docmanager:open', {
      path: path,
      factory: 'Notebook',
      kernel: { name: 'python3' },
    })) as NotebookPanel;
    const boxPanel = new BoxPanel();
    boxPanel.addClass('dla-Jupyter-Notebook');
    boxPanel.spacing = 0;
    boxPanel.addWidget(notebookPanel);
    this.focusTracker.add(notebookPanel);
    return boxPanel;
  }
}

export default JupyterLabAppAdapter;

/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { CommandRegistry } from '@lumino/commands';
import { BoxPanel, Widget, FocusTracker } from '@lumino/widgets';
import {
  JupyterLab,
  JupyterFrontEndPlugin,
  JupyterFrontEnd,
  LabShell,
} from '@jupyterlab/application';
import { IThemeManager, IWindowResolver } from '@jupyterlab/apputils';
import { PageConfig } from '@jupyterlab/coreutils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { NotebookPanel } from '@jupyterlab/notebook';
import { ServiceManager } from '@jupyterlab/services';
import { JupyterLabAppProps } from './JupyterLabApp';

export type Plugin = JupyterFrontEndPlugin<any, any, any> & {
  service: any;
};

export type Plugins = Map<string, Plugin>;

export type JupyterLabAppAdapterProps = JupyterLabAppProps & {
  serviceManager: ServiceManager.IManager;
  collaborative?: boolean;
};

export class JupyterLabAppAdapter {
  private _jupyterLab: JupyterLab;
  private _shell: LabShell;
  private _plugins: Plugins;
  private _ready: Promise<void>;
  private _readyResolve: () => void;

  constructor(props: JupyterLabAppAdapterProps, jupyterlab?: JupyterLab) {
    if (jupyterlab) {
      this._jupyterLab = jupyterlab;
      this._ready = new Promise((resolve, _) => {
        this._readyResolve = resolve;
      });
      this._plugins = (this._jupyterLab as any)['pluginRegistry']['_plugins'];
      this._readyResolve();
      return;
    }
    this._ready = new Promise((resolve, _) => {
      this._readyResolve = resolve;
    });
    this.load(props);
  }

  private async load(props: JupyterLabAppAdapterProps) {
    const {
      disabledPlugins = [],
      hostId,
      plugins: extensions = [],
      mimeRenderers: mimeExtensions = [],
      nosplash,
      pluginPromises: extensionPromises = [],
      mimeRendererPromises: mimeExtensionPromises = [],
      devMode,
      serviceManager,
    } = props;
    const mimeExtensionResolved = await Promise.all(mimeExtensionPromises);
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
    const extensionResolved = await Promise.all(extensionPromises);
    disabledPlugins.push(
      '@jupyterlab/notebook-extension:language-server',
      '@jupyterlab/notebook-extension:update-raw-mimetype',
      '@jupyterlab/fileeditor-extension:language-server',
      '@jupyterlab/apputils-extension:sessionDialogs',
      // The `resolver` plugin coordinates multi-tab workspace conflicts via a
      // BroadcastChannel beacon. On rejection it tries to recover with
      // `router.navigate(url, { hard: true })` where `url` is built from
      // `paths.urls.base` (the Jupyter Server URL). When the embedding app
      // is served from a different origin than the Jupyter Server (the
      // common case for jupyter-react), `pushState` throws `SecurityError`
      // and the plugin returns a deliberately never-resolving promise to
      // gate `IWindowResolver` consumers. That hangs the boot chain — the
      // splash overlay in particular is never disposed because ThemeManager
      // can't complete its load. Embedded JupyterLab has no notion of
      // multi-tab workspace conflicts, so the plugin is meaningless here.
      // We replace it with a no-op `IWindowResolver` provider below.
      '@jupyterlab/apputils-extension:resolver'
    );
    // Replacement for the disabled `resolver` plugin: provide a stub
    // `IWindowResolver` so dependents (e.g. `application-extension:main`)
    // can activate. The window name is irrelevant in an embedded context.
    const resolverStub: JupyterFrontEndPlugin<IWindowResolver> = {
      id: '@datalayer/jupyter-react:window-resolver',
      description: 'No-op IWindowResolver for embedded JupyterLab.',
      autoStart: true,
      provides: IWindowResolver,
      activate: () => ({
        // The interface only requires `name`. Use the configured workspace
        // (or the default) without going through BroadcastChannel-based
        // resolution, which is meaningless in an embedded context.
        name: PageConfig.getOption('workspace') || PageConfig.defaultWorkspace,
      }),
    };
    // Work around a ThemeManager startup race where repeated `_loadSettings`
    // calls while a previous theme load is still outstanding can trigger a
    // second `_loadTheme`, detach the first `<link>`, and leave the first
    // promise pending forever. In that state `_current` stays null and splash
    // disposal never runs.
    const themeLoadGuard: JupyterFrontEndPlugin<void> = {
      id: '@datalayer/jupyter-react:theme-load-guard',
      description: 'Serialize ThemeManager _loadSettings reentry during boot.',
      autoStart: true,
      requires: [IThemeManager],
      activate: (_app, themeManager: IThemeManager) => {
        const tm = themeManager as any;
        if (tm.__datalayerThemeLoadGuardPatched) {
          return;
        }
        const logPrefix = '[jupyter-react][theme-guard]';
        const previousLoadSettings = tm._loadSettings;
        if (typeof previousLoadSettings !== 'function') {
          return;
        }
        const originalLoadSettings = previousLoadSettings.bind(tm);

        const markOutstanding = () => {
          const outstanding = tm._outstanding as Promise<unknown> | null;
          if (
            !outstanding ||
            tm.__datalayerTrackedOutstanding === outstanding
          ) {
            return;
          }
          tm.__datalayerTrackedOutstanding = outstanding;
          tm.__datalayerOutstandingPending = true;
          Promise.resolve(outstanding).finally(() => {
            if (tm.__datalayerTrackedOutstanding !== outstanding) {
              return;
            }
            tm.__datalayerOutstandingPending = false;
            // Mirror JupyterLab's intent: once the outstanding load settles,
            // allow subsequent settings loads to proceed.
            if (tm._outstanding === outstanding) {
              tm._outstanding = null;
            }
          });
        };

        const guardedLoadSettings = () => {
          markOutstanding();
          if (tm.__datalayerOutstandingPending) {
            console.debug(`${logPrefix} _loadSettings deferred`, {
              current: tm._current,
              requestedTheme: tm._settings?.composite?.theme,
            });
            if (!tm.__datalayerThemeReloadQueued) {
              tm.__datalayerThemeReloadQueued = true;
              Promise.resolve(tm.__datalayerTrackedOutstanding).finally(() => {
                tm.__datalayerThemeReloadQueued = false;
                guardedLoadSettings();
              });
            }
            return;
          }
          console.debug(`${logPrefix} _loadSettings run`, {
            current: tm._current,
            requestedTheme: tm._settings?.composite?.theme,
          });
          originalLoadSettings();
          markOutstanding();
        };

        const settings = tm._settings;
        if (settings?.changed?.disconnect) {
          settings.changed.disconnect(previousLoadSettings, tm);
        }
        tm._loadSettings = guardedLoadSettings;
        if (settings?.changed?.connect) {
          settings.changed.connect(tm._loadSettings, tm);
        }

        tm.__datalayerThemeLoadGuardPatched = true;
        console.debug(`${logPrefix} patched`);
      },
    };
    extensions.push(resolverStub as any);
    extensions.push(themeLoadGuard as any);
    // Disable the splash plugin entirely when `nosplash` is requested.
    //
    // We must filter the plugin BEFORE `registerPluginModules` rather than
    // calling `app.deregisterPlugin(splashId, true)` or passing the id via
    // `ignorePlugins` to `app.start({...})`:
    //
    // - Lumino's `PluginRegistry.deregisterPlugin` only removes the plugin
    //   from `_plugins` and leaves the `_services` token map intact. The
    //   `themes` plugin declares `optional: [ISplashScreen]`, so during its
    //   activation Lumino resolves the token, finds the dangling id, then
    //   crashes accessing `plugin.activated` on `undefined`. The themes
    //   plugin then fails to activate, which in turn breaks the dependent
    //   `themes-palette-menu` plugin and removes the Settings → Theme menu.
    //   See `jupyterlab-lumino/packages/coreutils/src/plugins.ts`
    //   (`deregisterPlugin` and `resolveOptionalService`).
    // - `ignorePlugins` only excludes the plugin from the startup activation
    //   pass; Lumino still lazy-activates it when `themes` resolves the
    //   optional `ISplashScreen` service, so the splash is shown anyway.
    //
    // Filtering before registration leaves both maps empty for the splash
    // token, so optional resolution cleanly returns `null` and `themes`
    // activates with `splash = null`.
    if (nosplash) {
      disabledPlugins.push('@jupyterlab/apputils-extension:splash');
    }
    const disabledPluginsSet = new Set(disabledPlugins);
    extensionResolved.forEach(ext => {
      if (Array.isArray(ext.default)) {
        ext.default.forEach(plugin => {
          if (!disabledPluginsSet.has(plugin.id)) {
            extensions.push(plugin as any);
          }
        });
      } else {
        if (!disabledPluginsSet.has(ext.default.id)) {
          extensions.push(ext);
        }
      }
    });
    this._jupyterLab.registerPluginModules(extensions);
    /*
    if (collaborative) {
      this._jupyterLab.deregisterPlugin("@jupyterlab/filebrowser-extension:default-file-browser", true);
    }
    */
    this._jupyterLab
      .start({
        hostID: hostId,
        bubblingKeydown: true, // TODO Check this prop.
        startPlugins: [],
        ignorePlugins: [],
      })
      .then(() => {
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

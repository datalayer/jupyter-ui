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
  ILayoutRestorer,
  IRouter,
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

  private normalizeKernelSpecResources(
    specs: any,
    serviceManager: ServiceManager.IManager
  ): void {
    if (!specs?.kernelspecs) {
      return;
    }
    const baseUrl = serviceManager.serverSettings.baseUrl;
    if (!baseUrl) {
      return;
    }
    Object.values(specs.kernelspecs).forEach((spec: any) => {
      if (!spec?.resources) {
        return;
      }
      Object.entries(spec.resources).forEach(([resourceName, resourceUrl]) => {
        if (typeof resourceUrl !== 'string' || !resourceUrl) {
          return;
        }
        if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(resourceUrl)) {
          return;
        }
        spec.resources[resourceName] = new URL(resourceUrl, baseUrl).toString();
      });
    });
  }

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

  private async waitForShellAttachment(timeoutMs = 10000): Promise<void> {
    const shell = this._jupyterLab.shell;
    if (shell.isAttached) {
      return;
    }
    await new Promise<void>(resolve => {
      const deadline = Date.now() + timeoutMs;
      const check = () => {
        if (shell.isAttached) {
          resolve();
          return;
        }
        if (Date.now() >= deadline) {
          resolve();
          return;
        }
        window.requestAnimationFrame(check);
      };
      check();
    });
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
    const browserBaseUrl = new URL('.', window.location.href).toString();
    const embeddedPaths: JupyterFrontEnd.IPaths = {
      urls: {
        ...JupyterLab.defaultPaths.urls,
        // In embedded mode, JupyterLab must route against the host page
        // origin, not the remote Jupyter Server base URL.
        base: browserBaseUrl,
      },
      directories: {
        ...JupyterLab.defaultPaths.directories,
      },
    };
    this._shell = new LabShell();
    this._jupyterLab = new JupyterLab({
      shell: this._shell,
      mimeExtensions,
      devMode,
      serviceManager,
      paths: embeddedPaths,
      disabled: {
        matches: [],
        patterns: [],
      },
      deferred: {
        patterns: [],
        matches: [],
      },
    });

    // Some Jupyter servers return kernelspec icon resources as root-relative
    // paths (e.g. `/api/jupyter-server/kernelspecs/...`). In embedded dev
    // mode that resolves against localhost and causes 404s. Normalize those
    // URLs to the configured Jupyter server origin.
    this.normalizeKernelSpecResources(
      serviceManager.kernelspecs.specs,
      serviceManager
    );
    serviceManager.kernelspecs.specsChanged.connect((_, specs) => {
      this.normalizeKernelSpecResources(specs, serviceManager);
    });

    this._plugins = (this._jupyterLab as any)['pluginRegistry']['_plugins'];
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
      description: 'Prevent ThemeManager loadCSS deadlocks in embedded mode.',
      autoStart: true,
      requires: [IThemeManager],
      activate: (_app, themeManager: IThemeManager) => {
        const tm = themeManager as any;
        if (tm.__datalayerThemeLoadGuardPatched) {
          return;
        }
        const CANCELED_THEME_LOAD =
          '[jupyter-react] canceled detached theme load';
        const previousLoadCSS =
          typeof tm.loadCSS === 'function' ? tm.loadCSS.bind(tm) : null;
        const previousOnError =
          typeof tm._onError === 'function' ? tm._onError.bind(tm) : null;
        if (!previousLoadCSS) {
          return;
        }

        if (previousOnError) {
          tm._onError = (reason: unknown) => {
            const message = String(reason ?? '');
            if (message.includes(CANCELED_THEME_LOAD)) {
              return;
            }
            previousOnError(reason);
          };
        }

        tm.loadCSS = (path: string) => {
          const basePromise = previousLoadCSS(path) as Promise<void>;
          const link = tm._links?.[tm._links.length - 1] as
            | HTMLLinkElement
            | undefined;
          if (!link) {
            return basePromise;
          }

          const detachedGuard = new Promise<void>((_resolve, reject) => {
            let detachedAt = 0;
            const clear = () => {
              window.clearInterval(intervalHandle);
              window.clearTimeout(timeoutHandle);
            };
            const finish = () => {
              clear();
            };
            const cancel = () => {
              clear();
              reject(new Error(`${CANCELED_THEME_LOAD}: ${link.href}`));
            };
            const intervalHandle = window.setInterval(() => {
              if (link.isConnected) {
                detachedAt = 0;
                return;
              }
              if (!detachedAt) {
                detachedAt = Date.now();
              }
              const replacementConnected = (tm._links || []).some(
                (candidate: HTMLLinkElement) =>
                  candidate !== link &&
                  candidate.href === link.href &&
                  candidate.isConnected
              );
              // If the original link was detached and a replacement is now
              // connected (or it remains detached for a short grace period),
              // cancel this stale load so `_loadTheme` cannot apply an
              // out-of-date theme when users switch quickly.
              if (replacementConnected || Date.now() - detachedAt > 500) {
                cancel();
              }
            }, 50);
            const timeoutHandle = window.setTimeout(finish, 15000);
            basePromise.finally(finish);
          });

          return Promise.race([basePromise, detachedGuard]);
        };

        tm.__datalayerThemeLoadGuardPatched = true;
      },
    };
    // In embedded mode, persisted tracker restoration can replay stale
    // workspace entries (editors, mime documents, cloned outputs, notebooks,
    // etc.) and leave `app.restored` pending indefinitely. Keep the shell
    // layout restorer service available, but skip tracker replay entirely.
    const notebookRestoreGuard: JupyterFrontEndPlugin<void> = {
      id: '@datalayer/jupyter-react:notebook-restore-guard',
      description:
        'Disable tracker restoration replay in embedded JupyterLab mode.',
      autoStart: true,
      requires: [ILayoutRestorer],
      activate: (_app, restorer: ILayoutRestorer) => {
        const lr = restorer as any;
        if (lr.__datalayerNotebookRestoreGuardPatched) {
          return;
        }
        const previousRestore =
          typeof lr.restore === 'function' ? lr.restore.bind(lr) : null;
        if (!previousRestore) {
          return;
        }
        lr.restore = (..._args: any[]) => Promise.resolve();
        lr.__datalayerNotebookRestoreGuardPatched = true;
      },
    };
    // In embedded mode, the application main plugin can try to sync browser
    // location to Jupyter Server workspace URLs (e.g.
    // `/api/jupyter-server/lab/workspaces/...`). That hijacks the host page
    // URL and can keep the loading UX in a bad state. Keep routing behavior
    // for in-app commands, but suppress these workspace URL rewrites.
    const routerNavigateGuard: JupyterFrontEndPlugin<void> = {
      id: '@datalayer/jupyter-react:router-navigate-guard',
      description: 'Prevent embedded URL rewrite to Jupyter workspace paths.',
      autoStart: true,
      requires: [IRouter],
      activate: (_app, router: IRouter) => {
        const r = router as any;
        if (r.__datalayerRouterNavigateGuardPatched) {
          return;
        }
        const previousNavigate =
          typeof r.navigate === 'function' ? r.navigate.bind(r) : null;
        if (!previousNavigate) {
          return;
        }
        r.navigate = (path: string, options?: any) => {
          if (
            typeof path === 'string' &&
            (path.startsWith('/api/jupyter-server/lab/workspaces') ||
              path.startsWith('/lab/workspaces'))
          ) {
            return;
          }
          return previousNavigate(path, options);
        };
        r.__datalayerRouterNavigateGuardPatched = true;
      },
    };
    extensions.push(resolverStub as any);
    extensions.push(themeLoadGuard as any);
    extensions.push(notebookRestoreGuard as any);
    extensions.push(routerNavigateGuard as any);
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
    const startPromise = this._jupyterLab.start({
      hostID: hostId,
      bubblingKeydown: true, // TODO Check this prop.
      startPlugins: [],
      ignorePlugins: [],
    });
    Promise.all([startPromise, this._jupyterLab.started]).then(async () => {
      await this.waitForShellAttachment();
      await new Promise<void>(resolve =>
        window.requestAnimationFrame(() => resolve())
      );
      this._plugins = (this._jupyterLab as any)['pluginRegistry']['_plugins'];
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
    const plugins =
      this._plugins ||
      ((this._jupyterLab as any)?.['pluginRegistry']?.['_plugins'] as
        | Plugins
        | undefined);
    return plugins?.get(id);
  }

  service(id: string): Plugin['service'] {
    const plugins =
      this._plugins ||
      ((this._jupyterLab as any)?.['pluginRegistry']?.['_plugins'] as
        | Plugins
        | undefined);
    return plugins?.get(id)?.service;
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

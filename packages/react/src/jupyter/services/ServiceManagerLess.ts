/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import {
  Builder, Contents, Event, IManager, NbConvert, NbConvertManager, ServerConnection,
  ServiceManager, Setting, User, Workspace, SettingManager, WorkspaceManager,
} from '@jupyterlab/services';
import { BuildManager } from '@jupyterlab/services/lib/builder';
import { IKernelConnection, IManager as IKernelManager, IModel } from '@jupyterlab/services/lib/kernel/kernel';
import { IManager as IKernelspecManager, ISpecModels} from '@jupyterlab/services/lib/kernelspec/kernelspec';
import {IModel as ISessionModel, ISessionConnection, IManager as ISessionManager, ISessionOptions } from '@jupyterlab/services/lib/session/session';
import { IModel as ITerminalModel, IManager as ITerminaManager, ITerminal, ITerminalConnection } from '@jupyterlab/services/lib/terminal/terminal';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { PromiseDelegate, ReadonlyJSONObject } from '@lumino/coreutils';
import { ISignal, Signal } from '@lumino/signaling';

const WORKSPACE_JSON = `{
  "data": {
    "layout-restorer:data": {
      "main": {
        "dock": null
      },
      "down": {
        "size": 0,
        "widgets": []
      },
      "left": {
        "collapsed": true,
        "visible": true,
        "widgetStates": {}
      },
      "right": {
        "collapsed": true,
        "visible": true,
        "widgetStates": {}
      },
      "relativeSizes": [
      ],
      "top": {
        "simpleVisibility": true
      }
    }
  },
  "metadata": {
    "id": "default",
    "last_modified": "2024-09-02T18:06:41.834588+00:00",
    "created": "2024-09-02T18:06:41.834588+00:00"
  }
}`;

const WORKSPACE = JSON.parse(WORKSPACE_JSON) as Workspace.IWorkspace;

export class TerminalManagerLess implements ITerminaManager {
  runningChanged: ISignal<ITerminaManager, ITerminalModel[]> = new Signal(this);
  connectionFailure: ISignal<ITerminaManager, ServerConnection.NetworkError> = new Signal(this);
  isReady: boolean = true;
  ready: Promise<void> = Promise.resolve(void 0);
  serverSettings: ServerConnection.ISettings;
  isActive: boolean = true;
  disposed: ISignal<this, void> = new Signal(this);
  isDisposed: boolean = false;
  constructor(serverSettings: ServerConnection.ISettings) {
    this.serverSettings = serverSettings;
  }
  isAvailable(): boolean {
    return true;
  }
  running(): IterableIterator<ISessionModel> {
    return [].values();
  }
  startNew(options?: ITerminal.IOptions | undefined): Promise<ITerminalConnection> {
    return Promise.resolve({} as unknown as ITerminalConnection);
  }
  connectTo(options: Omit<ITerminalConnection.IOptions, 'serverSettings'>): ITerminalConnection {
    return {} as unknown as ITerminalConnection;
  }
  shutdown(name: string): Promise<void> {
    return Promise.resolve(void 0);
  }
  shutdownAll(): Promise<void> {
    return Promise.resolve(void 0);
  }
  refreshRunning(): Promise<void> {
    return Promise.resolve(void 0);
  }
  dispose(): void {}
}

export class ContentsManagerLess implements Contents.IManager {
  fileChanged: ISignal<Contents.IManager, Contents.IChangedArgs> = new Signal(this);
  isDisposed: boolean = false;
  serverSettings: ServerConnection.ISettings;
  constructor(serverSettings: ServerConnection.ISettings) {
    this.serverSettings = serverSettings;
  }
  addDrive(drive: Contents.IDrive): void {
  }
  localPath(path: string): string {
    return path;
  }
  normalize(path: string): string {
    return path;
  }
  resolvePath(root: string, path: string): string {
    return root + path;
  }
  driveName(path: string): string {
    return "";
  }
  getSharedModelFactory(path: string): Contents.ISharedFactory | null {
    return null;
  }
  get(path: string, options?: Contents.IFetchOptions | undefined): Promise<Contents.IModel> {
    return new Promise(() => {});
  }
  getDownloadUrl(path: string): Promise<string> {
    return new Promise(() => {});
  }
  newUntitled(options?: Contents.ICreateOptions | undefined): Promise<Contents.IModel> {
    return new Promise(() => {});
  }
  delete(path: string): Promise<void> {
    return new Promise(() => {});
  }
  rename(path: string, newPath: string): Promise<Contents.IModel> {
    return new Promise(() => {});
  }
  save(path: string, options?: Partial<Contents.IModel> | undefined): Promise<Contents.IModel> {
    return new Promise(() => {});
  }
  copy(path: string, toDir: string): Promise<Contents.IModel> {
    return new Promise(() => {});
  }
  createCheckpoint(path: string): Promise<Contents.ICheckpointModel> {
    return new Promise(() => {});
  }
  listCheckpoints(path: string): Promise<Contents.ICheckpointModel[]> {
    return new Promise(() => {});
  }
  restoreCheckpoint(path: string, checkpointID: string): Promise<void> {
    return new Promise(() => {});
  }
  deleteCheckpoint(path: string, checkpointID: string): Promise<void> {
    return new Promise(() => {});
  }
  dispose(): void {}
}

export class KernelManagerLess implements IKernelManager {
  runningChanged: ISignal<IKernelManager, IModel[]> = new Signal(this);
  connectionFailure: ISignal<IKernelManager, ServerConnection.NetworkError> = new Signal(this);
  isReady: boolean = true;
  ready: Promise<void> = Promise.resolve(void 0);
  serverSettings: ServerConnection.ISettings;
  isActive: boolean = true;
  disposed: ISignal<this, void> = new Signal(this);
  isDisposed: boolean = false;
  constructor(serverSettings: ServerConnection.ISettings) {
    this.serverSettings = serverSettings;
  }
  readonly runningCount = 0;
  running(): IterableIterator<IModel> {
    return [].values();
  }
  refreshRunning(): Promise<void> {
    return new Promise(() => {});
  }
  startNew(createOptions?: Partial<Pick<IModel, 'name'>> | undefined, connectOptions?: Omit<IKernelConnection.IOptions, 'serverSettings' | 'model'> | undefined): Promise<IKernelConnection> {
    return new Promise(() => {});
  }
  findById(id: string): Promise<IModel | undefined> {
    return new Promise(() => {});
  }
  connectTo(options: IKernelConnection.IOptions): IKernelConnection {
    return "" as any;
  }
  shutdown(id: string): Promise<void> {
    return new Promise(() => {});
  }
  shutdownAll(): Promise<void> {
    return new Promise(() => {});
  }
  dispose(): void {}
}

export class KernelspecManagerLess implements IKernelspecManager {
  specsChanged: ISignal<IKernelspecManager, ISpecModels> = new Signal(this);
  specs: ISpecModels | null = null;
  connectionFailure: ISignal<IManager, ServerConnection.NetworkError> = new Signal(this);
  serverSettings: ServerConnection.ISettings;
  isReady: boolean = true;
  ready: Promise<void> = Promise.resolve(void 0);
  isActive: boolean = true;
  disposed: ISignal<this, void> = new Signal(this);
  isDisposed: boolean = false;
  constructor(serverSettings: ServerConnection.ISettings) {
    this.serverSettings = serverSettings;
  }
  refreshSpecs(): Promise<void> {
    return new Promise(() => {});
  }
  dispose(): void {}
}

export class SessionManagerLess implements ISessionManager {
  runningChanged: ISignal<this, ISessionModel[]> = new Signal(this);
  connectionFailure: ISignal<ISessionManager, ServerConnection.NetworkError> = new Signal(this);
  serverSettings?: ServerConnection.ISettings | undefined;
  isReady: boolean = true;
  isDisposed: boolean = false;
  ready: Promise<void> = Promise.resolve(void 0);
  constructor(serverSettings: ServerConnection.ISettings) {
    this.serverSettings = serverSettings;
  }
  running(): IterableIterator<ISessionModel> {
    return [].values();
  }
  startNew(createOptions: ISessionOptions, connectOptions?: Omit<ISessionConnection.IOptions, 'serverSettings' | 'model' | 'connectToKernel'> | undefined): Promise<ISessionConnection> {
    return new Promise(() => {});
  }
  findById(id: string): Promise<ISessionModel | undefined> {
    return new Promise(() => {});
  }
  findByPath(path: string): Promise<ISessionModel | undefined> {
    return new Promise(() => {});
  }
  connectTo(options: Omit<ISessionConnection.IOptions, 'serverSettings' | 'connectToKernel'>): ISessionConnection {
    return "" as any;
  }
  shutdown(id: string): Promise<void> {
    return new Promise(() => {});
  }
  shutdownAll(): Promise<void> {
    return new Promise(() => {});
  }
  refreshRunning(): Promise<void> {
    return new Promise(() => {});
  }
  stopIfNeeded(path: string): Promise<void> {
    return new Promise(() => {});
  }
  dispose(): void {}
}

export class BuilderManagerLess {
  serverSettings: ServerConnection.ISettings;
  constructor(serverSettings: ServerConnection.ISettings) {
    this.serverSettings = serverSettings;
  }
  get isAvailable(): boolean {
    return true
  }
  get shouldCheck(): boolean {
    return false;
  }
  getStatus(): Promise<BuildManager.IStatus> {
    return new Promise(() => {});
  }
  build(): Promise<void> {
    return new Promise(() => {});
  }
  cancel(): Promise<void> {
    return new Promise(() => {});
  }
}

export class SettingManagerLess extends SettingManager implements Setting.IManager {
  serverSettings: ServerConnection.ISettings;
  constructor(serverSettings: ServerConnection.ISettings) {
    super({ serverSettings });
    this.serverSettings = serverSettings;
  }
  fetch(id: string): Promise<ISettingRegistry.IPlugin> {
    /*
    const PLUGIN: ISettingRegistry.IPlugin = {
      id,
      data: {
        composite: {},
        user: {},
      },
      raw: '',
      schema: {
        type: 'object',
      },
      version: '',
    };
    return new Promise<ISettingRegistry.IPlugin>((resolve) => resolve(PLUGIN));
    */
    return super.fetch(id);
  }
  list(query?: 'ids' | undefined): Promise<{ ids: string[]; values: ISettingRegistry.IPlugin[]; }> {
    /*
    const PLUGIN: ISettingRegistry.IPlugin = {
      id: 'id',
      data: {
        composite: {},
        user: {},
      },
      raw: '',
      schema: {
        type: 'object',
      },
      version: '',
    };
    return new Promise<{ ids: string[]; values: ISettingRegistry.IPlugin[]; }>((resolve) => resolve({
      ids: [PLUGIN.id],
      values: [PLUGIN],
    }));
    */
    return super.list(query);
  }
  save(id: string, raw: string): Promise<void> {
//    return super.save(id, raw);
    return new Promise(() => {});
  }
  remove(id: string): Promise<any> {
//    return super.remove(id);
    return new Promise(() => {});
  }
}

export class UserManagerLess implements User.IManager {
  userChanged: ISignal<this, User.IUser> = new Signal(this);
  identity: User.IIdentity | null = null;
  permissions: ReadonlyJSONObject | null = null;
  connectionFailure: ISignal<IManager, ServerConnection.NetworkError> = new Signal(this);
  isReady: boolean = true;
  ready: Promise<void> = Promise.resolve(void 0);
  isActive: boolean = true;
  disposed: ISignal<this, void> = new Signal(this);
  isDisposed: boolean = false;
  serverSettings: ServerConnection.ISettings;
  constructor(serverSettings: ServerConnection.ISettings) {
    this.serverSettings = serverSettings;
  }
  refreshUser(): Promise<void> {
    return new Promise(() => {});
  }
  dispose(): void {}
}

export class EventsManagerLess implements Event.IManager {
  stream: Event.Stream = null as any;
  isDisposed: boolean = false;
  serverSettings: ServerConnection.ISettings;
  constructor(serverSettings: ServerConnection.ISettings) {
    this.serverSettings = serverSettings;
  }
  emit(event: Event.Request): Promise<void> {
    return new Promise(() => {});
  }
  dispose(): void {}
}

export class WorkspaceManagerLess extends WorkspaceManager implements Workspace.IManager {
  serverSettings: ServerConnection.ISettings;
  constructor(serverSettings: ServerConnection.ISettings) {
    super({ serverSettings });
    this.serverSettings = serverSettings;
  }
  fetch(id: string): Promise<Workspace.IWorkspace> {
//    return new Promise(() => {});
//    return super.fetch(id);
    return new Promise<Workspace.IWorkspace>((resolve) => resolve(WORKSPACE));
}
  list(): Promise<{ ids: string[]; values: Workspace.IWorkspace[]; }> {
//    return new Promise(() => {});
//    return super.list()
    const w = {
      ids: ["1"],
      values: [WORKSPACE],
    }
    return new Promise<{ ids: string[]; values: Workspace.IWorkspace[]; }>((resolve) => resolve(w));
  }
  remove(id: string): Promise<void> {
//    return new Promise(() => {});
    return super.remove(id);
  }
  save(id: string, workspace: Workspace.IWorkspace): Promise<void> {
//    return new Promise(() => {});
    return super.save(id, workspace);
  }
}

export class NbConvertManagerLess {
  serverSettings: ServerConnection.ISettings;
  protected _requestingFormats: PromiseDelegate<NbConvertManager.IExportFormats> | null = null;
  protected _exportFormats: NbConvertManager.IExportFormats | null = null;
  constructor(serverSettings: ServerConnection.ISettings) {
    this.serverSettings = serverSettings;
  }
  protected fetchExportFormats(): Promise<NbConvertManager.IExportFormats> {
    return new Promise(() => {});
  }
  protected getExportFormats(force?: boolean | undefined): Promise<NbConvertManager.IExportFormats> {
    return new Promise(() => {});
  }
}

export class ServiceManagerLess implements ServiceManager.IManager {
  __NAME__ = "LessServiceManager";
  isReady: boolean = true;
  ready: Promise<void> = Promise.resolve(void 0);
  isDisposed: boolean = false;
  serverSettings: ServerConnection.ISettings;
  connectionFailure: ISignal<this, Error> = new Signal(this);
  builder: Builder.IManager;
  contents: Contents.IManager;
  events: Event.IManager;
  sessions: ISessionManager;
  kernels: IKernelManager;
  kernelspecs: IKernelspecManager;
  settings: Setting.IManager;
  terminals: ITerminaManager;
  user: User.IManager;
  workspaces: Workspace.IManager;
  nbconvert: NbConvert.IManager;
  constructor(serverSettings?: ServerConnection.ISettings) {
    this.serverSettings = serverSettings ?? ServerConnection.makeSettings({
      baseUrl: 'https://oss.datalayer.run/api/jupyter-server',
      wsUrl: 'wss://oss.datalayer.run/api/jupyter-server',
      token: '60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6',
    });
    this.contents = new ContentsManagerLess(this.serverSettings);
    this.kernels = new KernelManagerLess(this.serverSettings);
    this.kernelspecs = new KernelspecManagerLess(this.serverSettings);
    this.sessions = new SessionManagerLess(this.serverSettings);
    this.settings = new SettingManagerLess(this.serverSettings);
    this.terminals = new TerminalManagerLess(this.serverSettings);
    this.user = new UserManagerLess(this.serverSettings)
    this.builder = new BuilderManagerLess(this.serverSettings) as Builder.IManager;
    this.events = new EventsManagerLess(this.serverSettings);
    this.workspaces = new WorkspaceManagerLess(this.serverSettings);
    this.nbconvert = new NbConvertManagerLess(this.serverSettings) as unknown as NbConvert.IManager;
  }
  dispose(): void {}
  get_name = () => {
    return this.__NAME__;
  }
}

export default ServiceManagerLess;

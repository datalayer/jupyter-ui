/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/*
 * Copyright (c) 2021-2024 Datalayer, Inc.
 *
 * Datalayer License
 */

import { Builder, Contents, Event, IManager, NbConvert, NbConvertManager, ServerConnection, ServiceManager, Setting, User, Workspace } from '@jupyterlab/services';
import { BuildManager } from '@jupyterlab/services/lib/builder';
import { IKernelConnection, IManager as IKernelManager, IModel } from '@jupyterlab/services/lib/kernel/kernel';
import { IManager as IKernelspecManager, ISpecModels} from '@jupyterlab/services/lib/kernelspec/kernelspec';
import { IModel as ISessionModel, ISessionConnection, IManager as ISessionManager, ISessionOptions } from '@jupyterlab/services/lib/session/session';
import { IModel as ITerminalModel, IManager as ITerminaManager, ITerminal, ITerminalConnection } from '@jupyterlab/services/lib/terminal/terminal';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { PromiseDelegate, ReadonlyJSONObject } from '@lumino/coreutils';
import { ISignal, Signal } from '@lumino/signaling';

export class TerminalManagerMock implements ITerminaManager {
  runningChanged: ISignal<ITerminaManager, ITerminalModel[]> = new Signal(this);
  connectionFailure: ISignal<ITerminaManager, ServerConnection.NetworkError> = new Signal(this);
  isReady: boolean = true;
  ready: Promise<void> = Promise.resolve(void 0);
  serverSettings: ServerConnection.ISettings;
  isActive: boolean = false;
  disposed: ISignal<this, void> = new Signal(this);
  isDisposed: boolean = false;
  constructor(serverSettings: ServerConnection.ISettings) {
    this.serverSettings = serverSettings;
  }
  isAvailable(): boolean {
    throw new Error('Method not implemented.');
  }
  running(): IterableIterator<ISessionModel> {
    throw new Error('Method not implemented.');
  }
  startNew(options?: ITerminal.IOptions | undefined): Promise<ITerminalConnection> {
    throw new Error('Method not implemented.');
  }
  connectTo(options: Omit<ITerminalConnection.IOptions, 'serverSettings'>): ITerminalConnection {
    throw new Error('Method not implemented.');
  }
  shutdown(name: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  shutdownAll(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  refreshRunning(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  dispose(): void {
    throw new Error('Method not implemented.');
  }
}

export class ContentsManagerMock implements Contents.IManager {
  fileChanged: ISignal<Contents.IManager, Contents.IChangedArgs> = new Signal(this);
  isDisposed: boolean = false;
  serverSettings: ServerConnection.ISettings;
  constructor(serverSettings: ServerConnection.ISettings) {
    this.serverSettings = serverSettings;
  }
  addDrive(drive: Contents.IDrive): void {
    throw new Error('Method not implemented.');
  }
  localPath(path: string): string {
    throw new Error('Method not implemented.');
  }
  normalize(path: string): string {
    throw new Error('Method not implemented.');
  }
  resolvePath(root: string, path: string): string {
    throw new Error('Method not implemented.');
  }
  driveName(path: string): string {
    throw new Error('Method not implemented.');
  }
  getSharedModelFactory(path: string): Contents.ISharedFactory | null {
    throw new Error('Method not implemented.');
  }
  get(path: string, options?: Contents.IFetchOptions | undefined): Promise<Contents.IModel> {
    throw new Error('Method not implemented.');
  }
  getDownloadUrl(path: string): Promise<string> {
    throw new Error('Method not implemented.');
  }
  newUntitled(options?: Contents.ICreateOptions | undefined): Promise<Contents.IModel> {
    throw new Error('Method not implemented.');
  }
  delete(path: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  rename(path: string, newPath: string): Promise<Contents.IModel> {
    throw new Error('Method not implemented.');
  }
  save(path: string, options?: Partial<Contents.IModel> | undefined): Promise<Contents.IModel> {
    throw new Error('Method not implemented.');
  }
  copy(path: string, toDir: string): Promise<Contents.IModel> {
    throw new Error('Method not implemented.');
  }
  createCheckpoint(path: string): Promise<Contents.ICheckpointModel> {
    throw new Error('Method not implemented.');
  }
  listCheckpoints(path: string): Promise<Contents.ICheckpointModel[]> {
    throw new Error('Method not implemented.');
  }
  restoreCheckpoint(path: string, checkpointID: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  deleteCheckpoint(path: string, checkpointID: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  dispose(): void {
    throw new Error('Method not implemented.');
  }

}

export class KernelsManagerMock implements IKernelManager {
  runningChanged: ISignal<IKernelManager, IModel[]> = new Signal(this);
  connectionFailure: ISignal<IKernelManager, ServerConnection.NetworkError> = new Signal(this);
  isReady: boolean = true;
  ready: Promise<void> = Promise.resolve(void 0);
  serverSettings: ServerConnection.ISettings;
  isActive: boolean = false;
  disposed: ISignal<this, void> = new Signal(this);
  isDisposed: boolean = false;
  constructor(serverSettings: ServerConnection.ISettings) {
    this.serverSettings = serverSettings;
  }
  running(): IterableIterator<IModel> {
    throw new Error('Method not implemented.');
  }
  refreshRunning(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  startNew(createOptions?: Partial<Pick<IModel, 'name'>> | undefined, connectOptions?: Omit<IKernelConnection.IOptions, 'serverSettings' | 'model'> | undefined): Promise<IKernelConnection> {
    throw new Error('Method not implemented.');
  }
  findById(id: string): Promise<IModel | undefined> {
    throw new Error('Method not implemented.');
  }
  connectTo(options: IKernelConnection.IOptions): IKernelConnection {
    throw new Error('Method not implemented.');
  }
  shutdown(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  shutdownAll(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  dispose(): void {
    throw new Error('Method not implemented.');
  }
}

export class KernelspecManagerMock implements IKernelspecManager {
  specsChanged: ISignal<IKernelspecManager, ISpecModels> = new Signal(this);
  specs: ISpecModels | null = null;
  connectionFailure: ISignal<IManager, ServerConnection.NetworkError> = new Signal(this);
  serverSettings: ServerConnection.ISettings;
  isReady: boolean = true;
  ready: Promise<void> = Promise.resolve(void 0);
  isActive: boolean = false;
  disposed: ISignal<this, void> = new Signal(this);
  isDisposed: boolean = false;
  constructor(serverSettings: ServerConnection.ISettings) {
    this.serverSettings = serverSettings;
  }
  refreshSpecs(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  dispose(): void {
    throw new Error('Method not implemented.');
  }
}

export class SessionManagerMock implements ISessionManager {
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
    throw new Error('Method not implemented.');
  }
  startNew(createOptions: ISessionOptions, connectOptions?: Omit<ISessionConnection.IOptions, 'serverSettings' | 'model' | 'connectToKernel'> | undefined): Promise<ISessionConnection> {
    throw new Error('Method not implemented.');
  }
  findById(id: string): Promise<ISessionModel | undefined> {
    throw new Error('Method not implemented.');
  }
  findByPath(path: string): Promise<ISessionModel | undefined> {
    throw new Error('Method not implemented.');
  }
  connectTo(options: Omit<ISessionConnection.IOptions, 'serverSettings' | 'connectToKernel'>): ISessionConnection {
    throw new Error('Method not implemented.');
  }
  shutdown(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  shutdownAll(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  refreshRunning(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  stopIfNeeded(path: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  dispose(): void {
    throw new Error('Method not implemented.');
  }
}

export class BuilderManagerMock {
  serverSettings: ServerConnection.ISettings;
  constructor(serverSettings: ServerConnection.ISettings) {
    this.serverSettings = serverSettings;
  }
  get isAvailable(): boolean {
    throw new Error('Method not implemented.');
  }
  get shouldCheck(): boolean {
    throw new Error('Method not implemented.');
  }
  getStatus(): Promise<BuildManager.IStatus> {
    throw new Error('Method not implemented.');
  }
  build(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  cancel(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

export class SettingManagerMock implements Setting.IManager {
  serverSettings: ServerConnection.ISettings;
  constructor(serverSettings: ServerConnection.ISettings) {
    this.serverSettings = serverSettings;
  }
  fetch(id: string): Promise<ISettingRegistry.IPlugin> {
    throw new Error('Method not implemented.');
  }
  list(query?: 'ids' | undefined): Promise<{ ids: string[]; values: ISettingRegistry.IPlugin[]; }> {
    throw new Error('Method not implemented.');
  }
  save(id: string, raw: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  remove(id: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
}

export class UserManagerMock implements User.IManager {
  userChanged: ISignal<this, User.IUser> = new Signal(this);
  identity: User.IIdentity | null = null;
  permissions: ReadonlyJSONObject | null = null;
  connectionFailure: ISignal<IManager, ServerConnection.NetworkError> = new Signal(this);
  isReady: boolean = true;
  ready: Promise<void> = Promise.resolve(void 0);
  isActive: boolean = false;
  disposed: ISignal<this, void> = new Signal(this);
  isDisposed: boolean = false;
  serverSettings: ServerConnection.ISettings;
  constructor(serverSettings: ServerConnection.ISettings) {
    this.serverSettings = serverSettings;
  }
  refreshUser(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  dispose(): void {
    throw new Error('Method not implemented.');
  }
}

export class EventsManagerMock implements Event.IManager {
  stream: Event.Stream = null as any;
  isDisposed: boolean = false;
  serverSettings: ServerConnection.ISettings;
  constructor(serverSettings: ServerConnection.ISettings) {
    this.serverSettings = serverSettings;
  }
  emit(event: Event.Request): Promise<void> {
    throw new Error('Method not implemented.');
  }
  dispose(): void {
    throw new Error('Method not implemented.');
  }
}

export class WorkspaceManagerMock implements Workspace.IManager {
  serverSettings: ServerConnection.ISettings;
  constructor(serverSettings: ServerConnection.ISettings) {
    this.serverSettings = serverSettings;
  }
  fetch(id: string): Promise<Workspace.IWorkspace> {
    throw new Error('Method not implemented.');
  }
  list(): Promise<{ ids: string[]; values: Workspace.IWorkspace[]; }> {
    throw new Error('Method not implemented.');
  }
  remove(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  save(id: string, workspace: Workspace.IWorkspace): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

export class NbConvertManagerMock {
  serverSettings: ServerConnection.ISettings;
  protected _requestingFormats: PromiseDelegate<NbConvertManager.IExportFormats> | null = null;
  protected _exportFormats: NbConvertManager.IExportFormats | null = null;
  constructor(serverSettings: ServerConnection.ISettings) {
    this.serverSettings = serverSettings;
  }
  protected fetchExportFormats(): Promise<NbConvertManager.IExportFormats> {
    throw new Error('Method not implemented.');
  }
  protected getExportFormats(force?: boolean | undefined): Promise<NbConvertManager.IExportFormats> {
    throw new Error('Method not implemented.');
  }
}

export class JupyterServiceManagerMock implements ServiceManager.IManager {
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
  constructor(serverSettings: ServerConnection.ISettings = ServerConnection.makeSettings()) {
    this.serverSettings = serverSettings;
    this.terminals = new TerminalManagerMock(serverSettings);
    this.builder = new BuilderManagerMock(serverSettings) as Builder.IManager;
    this.contents = new ContentsManagerMock(serverSettings);
    this.events = new EventsManagerMock(serverSettings);
    this.sessions = new SessionManagerMock(serverSettings);
    this.kernels = new KernelsManagerMock(serverSettings);
    this.kernelspecs = new KernelspecManagerMock(serverSettings);
    this.settings = new SettingManagerMock(serverSettings)
    this.user = new UserManagerMock(serverSettings)
    this.workspaces = new WorkspaceManagerMock(serverSettings);
    this.nbconvert = new NbConvertManagerMock(serverSettings) as unknown as NbConvert.IManager;
  }
  dispose(): void {}
}

export default JupyterServiceManagerMock;

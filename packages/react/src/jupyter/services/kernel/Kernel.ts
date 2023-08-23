import { Kernel as JupyterKernel, ServerConnection, KernelManager, SessionManager, KernelMessage, KernelSpecManager } from '@jupyterlab/services';
import { ISessionConnection } from '@jupyterlab/services/lib/session/session';
import { ConnectionStatus } from '@jupyterlab/services/lib/kernel/kernel';
import { UUID } from '@lumino/coreutils';

export type IKernelProps = {
  kernelManager: KernelManager;
  kernelName: string;
  serverSettings: ServerConnection.ISettings;
  kernelModel?: JupyterKernel.IModel;
}

export class Kernel {
  private _kernelSpecManager: KernelSpecManager;
  private _kernelManager: KernelManager;
  private _sessionManager: SessionManager;
  private _kernelName: string;
  private _kernelConnection: JupyterKernel.IKernelConnection | null;
  private _session: ISessionConnection;
  private _path: string;
  private _clientId: string;
  private _id: string;
  private _sessionId: string;
  private _info: KernelMessage.IInfoReply;
  private _connectionStatus: ConnectionStatus;
  private _readyResolve: () => void;
  private _ready: Promise<void>;

  public constructor(props: IKernelProps) {
    const { kernelManager, kernelName, kernelModel, serverSettings } = props;
    this._kernelSpecManager = new KernelSpecManager({serverSettings});
    this._kernelManager = kernelManager;
    this._kernelName = kernelName;
    this.initReady = this.initReady.bind(this);
    this.initReady();
    this.requestJupyterKernel(kernelModel);
  }

  private initReady() {
    this._ready = new Promise((resolve, reject) => {
      this._readyResolve = resolve;
    });
  }

  private async requestJupyterKernel(kernelModel?: JupyterKernel.IModel): Promise<void> {
    await this._kernelManager.ready;
    this._sessionManager = new SessionManager({
      kernelManager: this._kernelManager,
      serverSettings: this._kernelManager.serverSettings, // Important, do not remove this.
      standby: 'never',
    });
    await this._sessionManager.ready;
    if (kernelModel) {
      console.log('Reusing a pre-existing kernel model.')
      const model = this._sessionManager.running().next().value;
      this._session = this._sessionManager.connectTo({model});
    }
    else {
      this._path = "kernel-" + UUID.uuid4();;
      this._session = await this._sessionManager.startNew(
        {
          name: this._path,
          path: this._path,
          type: this._kernelName,
          kernel: {
            name: this._kernelName,
          },
        },
        {
          kernelConnectionOptions: {
            handleComms: true,
          }
        }
      );
    }
    this._kernelConnection = this._session.kernel;
    const checkConnectionStatus = () => {
      if (this._connectionStatus === 'connected') {
        this._clientId = this._session.kernel!.clientId;
        this._id = this._session.kernel!.id;
        this._readyResolve();
      }
    }
    if (this._kernelConnection) {
      this._sessionId = this._session.id;
      this._connectionStatus = this._kernelConnection.connectionStatus;
      checkConnectionStatus()
      this._kernelConnection.connectionStatusChanged.connect((_, connectionStatus) => {
//        this.initReady();
        this._connectionStatus = connectionStatus;
        checkConnectionStatus()
      });
      this._kernelConnection.info.then((info) => {
        this._info = info
        console.log(`The default Kernel is ready`, this.toString());
      });
    }
  }

  get ready(): Promise<void> {
    return this._ready;
  }

  get clientId(): string {
    return this._clientId;
  }

  get id(): string {
    return this._id;
  }

  get sessionId(): string {
    return this._sessionId;
  }

  get info(): KernelMessage.IInfoReply {
    return this._info;
  }

  get session(): ISessionConnection {
    return this._session;
  }

  get kernelManager(): KernelManager {
    return this._kernelManager;
  }

  get kerneSpeclManager(): KernelSpecManager {
    return this._kernelSpecManager;
  }

  get sessionManager(): SessionManager {
    return this._sessionManager;
  }

  get path(): string {
    return this._path;
  }

  public get connection(): JupyterKernel.IKernelConnection | null {
    return this._kernelConnection;
  }

  public toString() {
    return `id:${this.id} client_id:${this.clientId} session_id:${this.sessionId} path:${this._path} kernelInfo:${this.info}`;
  }

  public shutdown() {
    this._session.kernel?.shutdown();
    this.connection?.dispose();
  }

}

export default Kernel;

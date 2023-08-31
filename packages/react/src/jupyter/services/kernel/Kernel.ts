import { find } from '@lumino/algorithm';
import { UUID } from '@lumino/coreutils';
import { Kernel as JupyterKernel, ServerConnection, KernelManager, SessionManager, KernelMessage, KernelSpecManager } from '@jupyterlab/services';
import { ISessionConnection } from '@jupyterlab/services/lib/session/session';
import { ConnectionStatus } from '@jupyterlab/services/lib/kernel/kernel';
import { getCookie } from '../../../utils/Utils';

const JUPYTER_REACT_PATH_COOKIE_NAME = "jupyter-react-kernel-path";

export class Kernel {
  private _clientId: string;
  private _connectionStatus: ConnectionStatus;
  private _id: string;
  private _info: KernelMessage.IInfoReply;
  private _kernelConnection: JupyterKernel.IKernelConnection | null;
  private _kernelManager: KernelManager;
  private _kernelName: string;
  private _kernelType: string;
  private _kernelSpecName: string;
  private _kernelSpecManager: KernelSpecManager;
  private _path: string;
  private _readyResolve: () => void;
  private _session: ISessionConnection;
  private _sessionId: string;
  private _sessionManager: SessionManager;
  private _ready: Promise<void>;

  public constructor(props: Kernel.IKernelProps) {
    const { kernelManager, kernelName, kernelType, kernelSpecName, kernelModel, serverSettings } = props;
    this._kernelSpecManager = new KernelSpecManager({ serverSettings });
    this._kernelManager = kernelManager;
    this._kernelName = kernelName;
    this._kernelType = kernelType;
    this._kernelSpecName = kernelSpecName;
    this.initReady = this.initReady.bind(this);
    this.initReady();
    this.requestKernel(kernelModel);
  }

  private initReady() {
    this._ready = new Promise((resolve, _) => {
      this._readyResolve = resolve;
    });
  }

  private async requestKernel(kernelModel?: JupyterKernel.IModel): Promise<void> {
    await this._kernelManager.ready;
    this._sessionManager = new SessionManager({
      kernelManager: this._kernelManager,
      serverSettings: this._kernelManager.serverSettings, // Important, do not remove this.
      standby: 'never',
    });
    await this._sessionManager.ready;
    if (kernelModel) {
      console.log('Reusing a pre-existing kernel model.')
      await this._sessionManager.refreshRunning();
      const model = find(this._sessionManager.running(), (item) => {
        return item.path === this._path;
      });
      if (model) {
        this._session = this._sessionManager.connectTo({ model });
      }
    }
    else {
      let path = getCookie(JUPYTER_REACT_PATH_COOKIE_NAME);
      if (!path) {
        path = "kernel-" + UUID.uuid4();
        document.cookie = JUPYTER_REACT_PATH_COOKIE_NAME + "=" + path;
      }
      this._path = path;
      this._session = await this._sessionManager.startNew(
        {
          name: this._kernelName,
          path: this._path,
          type: this._kernelType,
          kernel: {
            name: this._kernelSpecName,
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
    const updateConnectionStatus = () => {
      if (this._connectionStatus === 'connected') {
        this._clientId = this._session.kernel!.clientId;
        this._id = this._session.kernel!.id;
        this._readyResolve();
      }
    }
    if (this._kernelConnection) {
      this._sessionId = this._session.id;
      this._connectionStatus = this._kernelConnection.connectionStatus;
      updateConnectionStatus()
      this._kernelConnection.connectionStatusChanged.connect((_, connectionStatus) => {
//        this.initReady();
        this._connectionStatus = connectionStatus;
        updateConnectionStatus();
      });
      this._kernelConnection.info.then((info) => {
        this._info = info;
        console.log(`The default Kernel is ready`, this.toJSON());
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

  get kernelSpecManager(): KernelSpecManager {
    return this._kernelSpecManager;
  }

  get sessionManager(): SessionManager {
    return this._sessionManager;
  }

  get path(): string {
    return this._path;
  }

  get connection(): JupyterKernel.IKernelConnection | null {
    return this._kernelConnection;
  }

  toJSON() {
    return {
      path: this._path,
      id: this.id,
      clientId: this.clientId,
      sessionId: this.sessionId,
      kernelInfo: this.info,
    }
  }

  toString() {
    return `id:${this.id} - client_id:${this.clientId} - session_id:${this.sessionId} - path:${this._path}`;
  }

  shutdown() {
    this._session.kernel?.shutdown();
    this.connection?.dispose();
  }

}

export namespace Kernel {

  export type IKernelProps = {
    kernelManager: KernelManager;
    kernelName: string;
    kernelSpecName: string;
    kernelType: 'notebook' | 'file';
    serverSettings: ServerConnection.ISettings;
    kernelModel?: JupyterKernel.IModel;
  }
}

export default Kernel;

import { ServerConnection, Kernel as JupyterKernel, KernelManager, SessionManager } from '@jupyterlab/services';
import { UUID } from '@lumino/coreutils';

export type IKernelProps = {
  baseUrl?: string;
  wsUrl?: string;
  kernelType?: string;
  eventName?: string;
}
/*
const headers = new Headers({
//  'Cookie': 'Test',
  'X-Datalayer': 'Datalayer',
});
*/
class Kernel {
  private _kernelPromise: Promise<JupyterKernel.IKernelConnection>;
  private _serverSettings: ServerConnection.ISettings;
  private _kernelType: string;
  private _eventName: string;
//  private _useStorage: boolean;
//  private _storageKey: string;
//  private _storageExpire: number;

  public constructor(options: IKernelProps = {}) {
    this._serverSettings  = ServerConnection.makeSettings({
      baseUrl: options.baseUrl || (location.protocol + '//' + location.host + "/api/jupyter"),
      wsUrl: options.wsUrl || (location.protocol.replace('http', 'ws') + '//' + location.host + "/api/jupyter"),
      appendToken: true,
      init: {
        credentials: "include",
        mode: 'cors',
//        headers: headers,
      }
    });
    this._kernelType = options.kernelType || 'python3';
    this._eventName = options.eventName || 'dla-jupyter-output';
//    this._useStorage = options.useStorage == undefined ? true : options.useStorage;
//    this._storageKey = options.storageKey || 'dla-jupyter-output';
//    this._storageExpire = options.storageExpire || 60;
  }

  public getJupyterKernel(): Promise<JupyterKernel.IKernelConnection> {
    if (this._kernelPromise) {
      return this._kernelPromise;
    }
    /*
    if (this._useStorage && typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(this._storageKey);
      if (stored) {
        const { settings, timestamp } = JSON.parse(stored);
        if (timestamp && new Date().getTime() < timestamp) {
          this._kernelPromise = this.requestKernel(settings);
          return this._kernelPromise;
        }
        window.localStorage.removeItem(this._storageKey);
      }
    }
    */
    this._kernelPromise = this.requestKernel();
    return this._kernelPromise;
  }

  private async requestKernel(): Promise<JupyterKernel.IKernelConnection> {
    /*
    if (this._useStorage && typeof window !== 'undefined') {
      const timestamp = new Date().getTime() + this._storageExpire * 60 * 1000;
      const json = JSON.stringify({this._serverSettings, timestamp});
      window.localStorage.setItem(this._storageKey, json);
    }
    */
    const kernelManager = new KernelManager({
      serverSettings: this._serverSettings,
      standby: 'never',
    });
    const sessionManager = new SessionManager({
      serverSettings: this._serverSettings,
      kernelManager,
      standby: 'never',
    });
    await sessionManager.ready;
    const kernelId = UUID.uuid4();
    const session = await sessionManager.startNew({
      path: kernelId,
      name: kernelId,
      type: this._kernelType,
    });
    await session.kernel!.info;
    this.event('ready', session.kernel!.info);
    return session.kernel!;
  }

  private event(status: string, data: any) {
    const ev = new CustomEvent(this._eventName, {detail: {status, data}});
    document.dispatchEvent(ev);
  }

}

export default Kernel;

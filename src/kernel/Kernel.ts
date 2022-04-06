import {
  ServerConnection, Kernel as JupyterKernel,
  KernelManager, SessionManager
} from '@jupyterlab/services';
import { UUID } from '@lumino/coreutils';

export type IKernelProps = {
  baseUrl?: string;
  wsUrl?: string;
  kernelType?: string;
}
/*
const headers = new Headers({
  'X-Datalayer': 'Datalayer',
});
*/
export class Kernel {
  private _serverSettings: ServerConnection.ISettings;
  private _kernelType: string;
  private _kernel: Promise<JupyterKernel.IKernelConnection>;

  public constructor(options: IKernelProps = {}) {
    this._serverSettings  = ServerConnection.makeSettings({
      baseUrl: options.baseUrl || (location.protocol + '//' + location.host + "/api/jupyter"),
      wsUrl: options.wsUrl || (location.protocol.replace('http', 'ws') + '//' + location.host + "/api/jupyter"),
      appendToken: true,
      init: {
        credentials: 'include',
        mode: 'cors',
//        headers: headers,
      }
    });
    this._kernelType = options.kernelType || 'python3';
    this._kernel = this.requestKernel();
  }

  public getJupyterKernel(): Promise<JupyterKernel.IKernelConnection> {
    return this._kernel;
  }

  private async requestKernel(): Promise<JupyterKernel.IKernelConnection> {
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
    return session.kernel!;
  }

}

export default Kernel;

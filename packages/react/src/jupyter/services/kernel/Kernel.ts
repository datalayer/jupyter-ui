import { Kernel as JupyterKernel, KernelManager, SessionManager, KernelMessage } from '@jupyterlab/services';
import { ISessionConnection } from '@jupyterlab/services/lib/session/session';
import { UUID } from '@lumino/coreutils';

export type IKernelProps = {
  kernelManager: KernelManager;
  kernelName: string;
}

export class Kernel {
  private _kernelManager: KernelManager;
  private _kernelName: string;
  private _jupyterKernel: Promise<JupyterKernel.IKernelConnection>;
  private _session: ISessionConnection;
  private _id: string;
  private _info: KernelMessage.IInfoReply;

  public constructor(props: IKernelProps) {
    this._kernelManager = props.kernelManager;
    this._kernelName = props.kernelName;
    this._jupyterKernel = this.requestJupyterKernel(); // Request the effective Jupyter Kernel.
  }

  private async requestJupyterKernel(): Promise<JupyterKernel.IKernelConnection> {
    await this._kernelManager.ready;
    const sessionManager = new SessionManager({
      kernelManager: this._kernelManager,
      serverSettings: this._kernelManager.serverSettings, // Important, do not remove this.
      standby: 'never',
    });
    await sessionManager.ready;
    const randomName = UUID.uuid4() + ".ipynb";
    this._session = await sessionManager.startNew({
      path: randomName,
      name: randomName,
      type: 'notebook',
      kernel: {
        name: this._kernelName,
      },
    });
    this._info = await this._session.kernel!.info;
    this._id = this._session.kernel!.id;
    return this._session.kernel!;
  }

  get id(): string {
    return this._id;
  }

  get info(): KernelMessage.IInfoReply {
    return this._info;
  }

  get session(): ISessionConnection {
    return this._session;
  }

  public getJupyterKernel(): Promise<JupyterKernel.IKernelConnection> {
    return this._jupyterKernel;
  }

  public shutdown() {
    this._session.kernel?.shutdown();
    this.getJupyterKernel().then(k => k.dispose());
  }

}

export default Kernel;

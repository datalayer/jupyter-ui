import { ServiceManager } from '@jupyterlab/services';

export class Services {
  private _serviceManager: ServiceManager;

  public constructor(services: ServiceManager) {
    this._serviceManager = services;
  }
  
  public kernelspecs() {
    return this._serviceManager.kernelspecs;
  }

  public contents() {
    return this._serviceManager.contents;
  }

  public nbconvert() {
    return this._serviceManager.nbconvert;
  }

  public sessions() {
    return this._serviceManager.sessions;
  }

  public settings() {
    return this._serviceManager.settings;
  }

  public terminals() {
    return this._serviceManager.terminals;
  }

  public workspaces() {
    return this._serviceManager.workspaces;
  }

  public builder() {
    return this._serviceManager.builder;
  }

  public serverSettings() {
    return this._serviceManager.serverSettings;
  }

  public refreshKernelspecs() {
    return this.kernelspecs().refreshSpecs();
  }

  public getKernelspecs() {
    return this.kernelspecs().specs;
  }

}

export default Services;

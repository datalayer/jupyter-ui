import { ServiceManager } from '@jupyterlab/services';

export class Services {
  private _services: ServiceManager;

  public constructor(services: ServiceManager) {
    this._services = services;
  }
  
  public kernelspecs() {
    return this._services.kernelspecs;
  }

  public contents() {
    return this._services.contents;
  }

  public nbconvert() {
    return this._services.nbconvert;
  }

  public sessions() {
    return this._services.sessions;
  }

  public settings() {
    return this._services.settings;
  }

  public terminals() {
    return this._services.terminals;
  }

  public workspaces() {
    return this._services.workspaces;
  }

  public builder() {
    return this._services.builder;
  }

  public serverSettings() {
    return this._services.serverSettings;
  }

  public refreshKernelspecs() {
    return this.kernelspecs().refreshSpecs();
  }

  public getKernelspecs() {
    return this.kernelspecs().specs;
  }

}

export default Services;

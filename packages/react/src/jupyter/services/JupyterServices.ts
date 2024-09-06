/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { ServiceManager } from '@jupyterlab/services';
import { IManager as IKernelspecManager} from '@jupyterlab/services/lib/kernelspec/kernelspec';
import { IManager as ISessionManager } from '@jupyterlab/services/lib/session/session';
import { IManager as ITerminaManager } from '@jupyterlab/services/lib/terminal/terminal';

export class JupyterServices {
  private _serviceManager: ServiceManager.IManager;

  public constructor(services: ServiceManager.IManager) {
    this._serviceManager = services;
  }

  public kernelspecs(): IKernelspecManager {
    return this._serviceManager.kernelspecs;
  }

  public contents() {
    return this._serviceManager.contents;
  }

  public nbconvert() {
    return this._serviceManager.nbconvert;
  }

  public sessions(): ISessionManager {
    return this._serviceManager.sessions;
  }

  public settings() {
    return this._serviceManager.settings;
  }

  public terminals(): ITerminaManager {
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

export default JupyterServices;

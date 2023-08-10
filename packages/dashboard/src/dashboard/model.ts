import { PartialJSONObject } from '@lumino/coreutils';
import { Signal } from '@lumino/signaling';
import { PathExt } from '@jupyterlab/coreutils';
import { DocumentRegistry, DocumentModel } from '@jupyterlab/docregistry';
import { INotebookTracker } from '@jupyterlab/notebook';
import { ContentsManager, Contents } from '@jupyterlab/services';
import { IModelDB, IObservableJSON, ObservableJSON } from '@jupyterlab/observables';
import { IDashboardContent, IDashboardMetadata, DASHBOARD_VERSION, IOutputInfo } from './content';
import { WidgetStore } from './widgetStore';
import { Dashboard, } from './dashboard';
import { getPathFromNotebookId, getNotebookById } from './utils';
import { DashboardWidget } from './widget';
import { YFile } from '@jupyter/ydoc';

/**
 * The definition of a model object for a dashboard widget.
 */
export interface IDashboardModel extends DocumentRegistry.IModel {
  /**
   * The widget store for the dashboard.
   */
  readonly widgetStore: WidgetStore;

  /**
   * The notebook tracker for the dashboard.
   */
  readonly notebookTracker: INotebookTracker;

  /**
   * The contents manager for the dashboard.
   */
  readonly contentsManager: ContentsManager;

  /**
   * The metadata associated with the dashboard.
   */
  metadata: IObservableJSON;

  /**
   * A signal emitted when the dashboard finishes deserializing from a file.
   */
  loaded: Signal<this, void>;

  /**
   * The display mode of the dashboard.
   */
  mode: Dashboard.Mode;

  /**
   * The name of the dashboard.
   */
  name: string;

  /**
   * The width of the dashboard in pixels.
   */
  width: number;

  /**
   * The height of the dashboard in pixels.
   */
  height: number;

  /**
   * The scroll mode of the dashboard.
   */
  scrollMode: Dashboard.ScrollMode;

  /**
   * The current path associated with the model.
   */
  path: string;
}

/**
 * An implementation of a dashboard Model.
 */
export class DashboardModel extends DocumentModel implements IDashboardModel {
  /**
   * Construct a new dashboard model.
   */
  constructor(options: DashboardModel.IOptions) {
    super(options);

    const notebookTracker = (this.notebookTracker = options.notebookTracker);

    if (options.widgetStore !== undefined) {
      this.widgetStore = options.widgetStore;
      this._restore = true;
    } else {
      this.widgetStore = new WidgetStore({ id: 0, notebookTracker });
    }

    this.contentsManager = options.contentsManager || new ContentsManager();
  }

  /**
   * Deserialize the model from JSON.
   */
  async fromJSON(value: PartialJSONObject): Promise<void> {
    // A widgetStore has been supplied and the dashboard is ready to be populated.
    if (this._restore) {
      this._loaded.emit(void 0);
    }

    const outputs: WidgetStore.WidgetInfo[] = [];

    for (const [_path, notebookId] of Object.entries((value as any).paths)) {
      const path = PathExt.resolve(PathExt.dirname(this.path), _path);
      if (!getNotebookById(notebookId as string, this.notebookTracker)) {
        await this.contentsManager
          .get(path)
          .then(async model => {
            // no-op for now. Open notebook in future.
          })
          .catch(error => {
            throw new Error(`Error reading notebook ${notebookId} at ${path}`);
          });
      }
    }

    for (const [notebookId, notebookOutputs] of Object.entries((value as any).outputs)) {
      for (const outputInfo of (notebookOutputs as any)) {
        const info: WidgetStore.WidgetInfo = {
          ...outputInfo,
          notebookId,
          widgetId: DashboardWidget.createDashboardWidgetId()
        };
        outputs.push(info);
      }
    }

    this._metadata.clear();
    const metadata = value.metadata;
    for (const [key, value] of Object.entries(metadata as any)) {
      this._setMetadataProperty(key, value);
    }

    this.widgetStore.clear();
    outputs.forEach(output => {
      this.widgetStore.addWidget(output);
    });

    this._loaded.emit(void 0);
  }

  /**
   * Serialize the model to JSON.
   */
  toJSON(): PartialJSONObject {
    const notebookTracker = this.notebookTracker;

    // Get all widgets that haven't been removed.
    const records = this.widgetStore.getWidgets();

    const metadata: IDashboardMetadata = {
      name: this.name,
      dashboardHeight: this.height,
      dashboardWidth: this.width
    };

    const file: IDashboardContent = {
      metadata,
      version: DASHBOARD_VERSION,
      outputs: {},
      paths: {}
    };

    for (let record of records) {
      const notebookId = record.notebookId;
      const _path = getPathFromNotebookId(notebookId, notebookTracker);

      if (_path === undefined) {
        throw new Error(
          `Notebook path for notebook with id ${notebookId} not found`
        );
      }

      const path = PathExt.relative(PathExt.dirname(this.path), _path);

      if (file.paths[path] !== undefined && file.paths[path] !== notebookId) {
        throw new Error(`Conflicting paths for same notebook id ${notebookId}`);
      }

      file.paths[path] = notebookId;

      if (file.outputs[notebookId] === undefined) {
        file.outputs[notebookId] = [];
      }

      const outputInfo: IOutputInfo = {
        cellId: record.cellId,
        pos: record.pos
      };

      file.outputs[notebookId].push(outputInfo);
    };

    return file;
  }

  /**
   * Serialize the model to a string.
   */
  toString(): string {
    return JSON.stringify(this.toJSON(), undefined, 2);
  }

  /**
   * Deserialize the model from a string.
   */
  async fromString(value: string): Promise<void> {
    if (!value) {
      this._loaded.emit(void 0);
      return;
    }
    const json = JSON.parse(value);
    return this.fromJSON(json);
  }

  initialize(): void {
    // no-op
  }

  /**
   * The display mode of the dashboard.
   */
  get mode(): Dashboard.Mode {
    return this._mode;
  }
  set mode(newValue: Dashboard.Mode) {
    const oldValue = this._mode;
    if (oldValue === newValue) {
      return;
    }
    this._mode = newValue;
    this.triggerStateChange({ name: 'mode', oldValue, newValue });
  }

  /**
   * The metadata associated with the dashboard;
   */
  get metadata(): IObservableJSON {
    return this._metadata;
  }

  /**
   * The name of the dashboard.
   *
   * ### Development notes
   * This may be redundant with the filename and could be removed.
   */
  get name(): string {
    return this.metadata.get('name') as string;
  }
  set name(newValue: string) {
    this._setMetadataProperty('name', newValue);
  }

  /**
   * The width of the dashboard in pixels.
   */
  get width(): number {
    return +(this.metadata.get('dashboardWidth') || 0);
  }
  set width(newValue: number) {
    this._setMetadataProperty('dashboardWidth', newValue);
  }

  /**
   * The height of the dashboard in pixels.
   */
  get height(): number {
    return +(this.metadata.get('dashboardHeight') || 0);
  }
  set height(newValue: number) {
    this._setMetadataProperty('dashboardHeight', newValue);
  }

  /**
   * Sets a key in the metadata and emits the change as a signal.
   *
   * @param key - the key to change in the metadata.
   *
   * @param newValue - the new value to set the key to.
   *
   * ### Notes
   * No signal is emitted if newValue is the same as the old value.
   */
  protected _setMetadataProperty(key: string, newValue: any): void {
    const oldValue = this.metadata.get(key);
    if (oldValue === newValue) {
      return;
    }
    this.metadata.set(key, newValue);
    this.triggerStateChange({ name: key, oldValue, newValue });
  }

  /**
   * A signal emitted when the dashboard is done being deserialized.
   */
  get loaded(): Signal<this, void> {
    return this._loaded;
  }

  /**
   * The scroll mode of the dashboard.
   */
  get scrollMode(): Dashboard.ScrollMode {
    return this._scrollMode;
  }
  set scrollMode(newValue: Dashboard.ScrollMode) {
    this._scrollMode = newValue;
  }

  /**
   * The current path associated with the model.
   */
  get path(): string {
    return this._path;
  }
  set path(newPath: string) {
    this._path = newPath;
  }

  /**
   * The widget store for the dashboard.
   */
  readonly widgetStore: WidgetStore;

  /**
   * The notebook tracker for the dashboard.
   */
  readonly notebookTracker: INotebookTracker;

  /**
   * The contents manager for the dashboard.
   */
  readonly contentsManager: ContentsManager;

  protected _metadata: IObservableJSON = new ObservableJSON();
  protected _loaded = new Signal<this, void>(this);
  private _mode: Dashboard.Mode = 'grid-edit';
  private _scrollMode: Dashboard.ScrollMode = 'constrained';
  private _path: string = '';
  private _restore = false;
}

/**
 * The namespace for the dashboard model.
 */
export namespace DashboardModel {
  export interface IOptions {
    notebookTracker: INotebookTracker;

    languagePreference?: string;

    modelDB?: IModelDB;

    widgetStore?: WidgetStore;

    contentsManager?: ContentsManager;
  }
}

/**
 * A factory class for dashboard models.
 */
export class DashboardModelFactory
  implements DocumentRegistry.IModelFactory<IDashboardModel> {
  /**
   * Construct a new dashboard model factory.
   */
  constructor(options: DashboardModelFactory.IOptions) {
    this._notebookTracker = options.notebookTracker;
  }

  /**
   * Whether the model factory is disposed.
   */
  get isDisposed(): boolean {
    return this._disposed;
  }

  /**
   * Dispose of the resources held by the model factory.
   */
  dispose(): void {
    this._disposed = true;
  }

  /**
   * The format of the file.
   */
  get fileFormat(): Contents.FileFormat {
    return 'text';
  }

  /**
   * The name of the model.
   */
  get name(): string {
    return 'dashboard';
  }

  /**
   * The content type of the file.
   */
  get contentType(): Contents.ContentType {
    return 'file';
  }

  /**
   * Get the preferred kernel langauge given a path (currently a no-op).
   */
  preferredLanguage(path: string): string {
    return '';
  }

  /**
   * Create a new model for a given path.
   */
  createNew(options: DocumentRegistry.IModelOptions<YFile>): DashboardModel {
    const notebookTracker = this._notebookTracker;
    const contentsManager = new ContentsManager();
    const model = new DashboardModel({
      notebookTracker,
      contentsManager
    });
    return model;
  }

  private _disposed = false;
  private _notebookTracker: INotebookTracker;
}

/**
 * A namespace for the dashboard model factory.
 */
export namespace DashboardModelFactory {
  export interface IOptions {
    notebookTracker: INotebookTracker;
  }
}

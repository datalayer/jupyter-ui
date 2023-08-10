import { Cell } from '@jupyterlab/cells';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { Dashboard } from './dashboard';
import DashboardWidget from './widget';
import { getNotebookById, getCellById } from './utils';
import { IDashboardChange, DashboardLayout } from './layout';

export const WIDGETS = new Map<string, WidgetInfo>();

/**
 * Alias for widget schema type.
 */
export type WidgetSchema = WidgetStore.WidgetSchema;

/**
 * Alias for dashboard schema type.
 */
export type DashboardSchema = WidgetStore.DashboardSchema;

/**
 * Alias for widget position type.
 */
export type WidgetPosition = WidgetStore.WidgetPosition;

/**
 * Alias for widget info type.
 */
export type WidgetInfo = WidgetStore.WidgetInfo;

/**
 * A Litestore wrapper to work with DashboardWidget metadata.
 */
export class WidgetStore {
  /**
   * Construct a new WidgetStore.
   *
   * @param options - the options for creating the WidgetStore.
   */
  constructor(options: WidgetStore.IOptions) {
    this._notebookTracker = options.notebookTracker;
  }

  /**
   * Start listening for changes to a dashboard and automatically
   * reflect them in the datastore.
   */
  connectDashboard(dashboard: Dashboard): void {
    const layout = dashboard.layout as DashboardLayout;
    layout.changed.connect((layout, changes) =>
      this._handleChanges(layout, changes)
    );
  }

  /**
   * Stop listening for changes to a dashboard.
   */
  disconnectDashboard(dashboard: Dashboard): void {
    const layout = dashboard.layout as DashboardLayout;
    layout.changed.disconnect((layout, changes) =>
      this._handleChanges(layout, changes)
    );
  }

  /**
   * Handle change signals from a connected dashboard.
   */
  private _handleChanges(
    layout: DashboardLayout,
    changes: IDashboardChange[]
  ): void {
    (layout.parent as Dashboard).model.dirty = true;

    for (const change of changes) {
      const { widgetId, pos, ignore } = change;

      if (ignore) {
        continue;
      }

      switch (change.type) {
        case 'add':
          this.addWidget(change as WidgetStore.WidgetInfo);
          break;
        case 'move':
          this.moveWidget(widgetId, pos as WidgetPosition);
          break;
        case 'remove':
          this.deleteWidget(widgetId);
          break;
        default:
          console.warn(`invalid IDashboardChange type '${change.type}'`);
          break;
      }
    }

  }

  /**
   * Adds a dashboard widget to the widgetStore.
   *
   * @param info - the information to add to the widgetStore.
   */
  addWidget(info: WidgetStore.WidgetInfo): void {
    WIDGETS.set(info.widgetId, info);
  }

  /**
   * Updates the position of a widget already in the widgetStore.
   *
   * @param widget - the widget to update.
   *
   * @param pos - the new widget position.
   *
   * @returns whether the update was successful.
   *
   * ### Notes
   * The update will be unsuccesful if the widget isn't in the store or was
   * previously removed.
   */
  moveWidget(widgetId: string, pos: WidgetStore.WidgetPosition): boolean {
    const oldRecord = WIDGETS.get(widgetId);
    if (oldRecord === undefined || oldRecord.removed) {
      return false;
    }
    oldRecord.pos = pos;
    return true;
  }

  /**
   * Mark a widget as removed.
   *
   * @param widget - widget to delete.
   *
   * @returns whether the deletion was successful.
   */
  deleteWidget(widgetId: string): boolean {
    const oldRecord = WIDGETS.get(widgetId);
    if (oldRecord === undefined) {
      return false;
    }
    WIDGETS.delete(widgetId);
    return true;
  }

  /**
   * Retrieves a dashboard widget's info.
   *
   * @param widgetId - id to retrieve info for.
   *
   * @returns the widget's info, or undefined if it's not in the store.
   */
  getWidget(widgetId: string): WidgetStore.WidgetInfo | undefined {
    const record = WIDGETS.get(widgetId);
    if (record === undefined) {
      return undefined;
    }
    return record as WidgetStore.WidgetInfo;
  }

  getWidgets(): IterableIterator<WidgetInfo> {
    return WIDGETS.values();
  }

  /**
   * Gets a cell by id using the instances' notebook tracker.
   */
  getCellById(id: string): Cell {
    return getCellById(id, this._notebookTracker)!;
  }

  /**
   * Gets a notebook by id using the instances' notebook tracker.
   */
  getNotebookById(id: string): NotebookPanel {
    return getNotebookById(id, this._notebookTracker)!;
  }

  /**
   * Remove all widget entries from the store.
   */
  clear(): void {
    WIDGETS.clear();
  }

  createWidget(
    options: WidgetStore.WidgetInfo,
    fit?: boolean
  ): DashboardWidget {
    return DashboardWidget.createWidget(options, this._notebookTracker, fit);
  }

  private _notebookTracker: INotebookTracker;
}

export namespace WidgetStore {

  export type WidgetSchema = {
    id: 'widgets',
    fields: {
      widgetId: string,
      cellId: string,
      notebookId: string,
      pos: WidgetPosition,
      removed: boolean,
    }
  };

  export type DashboardSchema = {
    id: 'dashboard',
    fields: {
      name: string,
      width: number,
      height: number,
    }
  };;

  export type WidgetInfo = {
    /**
     * The widget ID.
     */
    widgetId: string;

    /**
     * The cell ID the widget is created from.
     */
    cellId: string;

    /**
     * The notebook ID the widget is created from.
     */
    notebookId: string;

    /**
     * The location/size of the widget.
     */
    pos: WidgetPosition;

    /**
     * Whether the widget has been removed.
     */
    removed?: boolean;
  };

  export type WidgetPosition = {
    /**
     * Left edge of the widget.
     */
    left: number;

    /**
     * Top edge of the widget.
     */
    top: number;

    /**
     * Width of the widget.
     */
    width: number;

    /**
     * Height of the widget.
     */
    height: number;
  };

  /**
   * An options object for initializing a widgetStore.
   */
  export interface IOptions {
    /**
     * The unique id of the widgetStore.
     */
    id: number;

    /**
     * Initialize the state to a previously serialized one.
     */
    restoreState?: string;

    /**
     * The notbook tracker used by Jupyterlab.
     */
    notebookTracker: INotebookTracker;
  }
}

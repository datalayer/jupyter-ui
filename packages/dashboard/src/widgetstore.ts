import { filter } from '@lumino/algorithm';
import { Litestore } from './litestore';
import { Datastore, Fields, Record, RegisterField } from '@lumino/datastore';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { Cell } from '@jupyterlab/cells';
import { getNotebookById, getCellById } from './utils';
import { IDashboardChange, DashboardLayout } from './layout';
import { Dashboard } from './dashboard';

import DashboardWidget from './widget';

/**
 * Alias for widget schema type.
 */
export type WidgetSchema = Widgetstore.WidgetSchema;

/**
 * Alias for dashboard schema type.
 */
export type DashboardSchema = Widgetstore.DashboardSchema;

/**
 * Alias for widget position type.
 */
export type WidgetPosition = Widgetstore.WidgetPosition;

/**
 * Alias for widget info type.
 */
export type WidgetInfo = Widgetstore.WidgetInfo;

/**
 * A Litestore wrapper to work with DashboardWidget metadata.
 */
export class Widgetstore extends Litestore {
  /**
   * Construct a new Widgetstore.
   *
   * @param options - the options for creating the Widgetstore.
   */
  constructor(options: Widgetstore.IOptions) {
    super({ ...options, schemas: Widgetstore.schemas });
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

    this.startBatch();

    for (const change of changes) {
      const { widgetId, pos, ignore } = change;

      if (ignore) {
        continue;
      }

      switch (change.type) {
        case 'add':
          this.addWidget(change as Widgetstore.WidgetInfo);
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

    this.endBatch();
  }

  /**
   * Adds a dashboard widget to the widgetstore.
   *
   * @param info - the information to add to the widgetstore.
   */
  addWidget(info: Widgetstore.WidgetInfo): void {
    if (!this._inBatch) {
      this.beginTransaction();
    }

    const { widgetId, pos, cellId, notebookId } = info;

    this.updateRecord(
      {
        schema: Widgetstore.WIDGET_SCHEMA,
        record: info.widgetId
      },
      {
        widgetId,
        pos,
        cellId,
        notebookId,
        removed: false
      }
    );

    if (!this._inBatch) {
      this.endTransaction();
    }
  }

  /**
   * Updates the position of a widget already in the widgetstore.
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
  moveWidget(widgetId: string, pos: Widgetstore.WidgetPosition): boolean {
    if (!this._inBatch) {
      this.beginTransaction();
    }

    const recordLoc = {
      schema: Widgetstore.WIDGET_SCHEMA,
      record: widgetId
    };

    const oldRecord = this.getRecord(recordLoc);

    if (oldRecord === undefined || oldRecord.removed) {
      return false;
    }

    this.updateRecord(recordLoc, { pos });

    if (!this._inBatch) {
      this.endTransaction();
    }

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
    if (!this._inBatch) {
      this.beginTransaction();
    }

    const recordLoc = {
      schema: Widgetstore.WIDGET_SCHEMA,
      record: widgetId
    };

    const oldRecord = this.getRecord(recordLoc);

    if (oldRecord === undefined) {
      return false;
    }

    this.updateRecord(recordLoc, { removed: true });

    if (!this._inBatch) {
      this.endTransaction();
    }

    return true;
  }

  /**
   * Retrieves a dashboard widget's info.
   *
   * @param widgetId - id to retrieve info for.
   *
   * @returns the widget's info, or undefined if it's not in the store.
   */
  getWidget(widgetId: string): Widgetstore.WidgetInfo | undefined {
    const record = this.getRecord({
      schema: Widgetstore.WIDGET_SCHEMA,
      record: widgetId
    });
    if (record === undefined) {
      return undefined;
    }
    return record as Widgetstore.WidgetInfo;
  }

  getWidgets(): IIterator<Record<WidgetSchema>> {
    const table = this.get(Widgetstore.WIDGET_SCHEMA);
    return filter(table, record => record.widgetId && !record.removed);
  }

  /**
   * Gets a cell by id using the instances' notebook tracker.
   */
  getCellById(id: string): Cell {
    return getCellById(id, this._notebookTracker);
  }

  /**
   * Gets a notebook by id using the instances' notebook tracker.
   */
  getNotebookById(id: string): NotebookPanel {
    return getNotebookById(id, this._notebookTracker);
  }

  /**
   * Starts a batch transfer. Functions modifying widgets won't start or end
   * a new transaction.
   */
  startBatch(): void {
    if (this._inBatch) {
      return;
    }
    this._inBatch = true;
    this.beginTransaction();
  }

  /**
   * Ends a batch transfer. Functions modifying widgets will start/end transactions.
   */
  endBatch(): void {
    if (!this._inBatch) {
      return;
    }
    this._inBatch = false;
    this.endTransaction();
  }

  /**
   * Remove all widget entries from the store.
   */
  clear(): void {
    this.updateTable({ schema: Widgetstore.WIDGET_SCHEMA }, {});
  }

  createWidget(
    options: Widgetstore.WidgetInfo,
    fit?: boolean
  ): DashboardWidget {
    return DashboardWidget.createWidget(options, this._notebookTracker, fit);
  }

  private _notebookTracker: INotebookTracker;
  private _inBatch = false;
}

export namespace Widgetstore {
  /**
   * Main schema for storing info about DashboardWidgets.
   */
  export const WIDGET_SCHEMA = {
    id: 'widgets',
    fields: {
      widgetId: Fields.String(),
      cellId: Fields.String(),
      notebookId: Fields.String(),
      pos: new RegisterField<WidgetPosition>({
        value: {
          left: 0,
          top: 0,
          width: 0,
          height: 0
        }
      }),
      removed: Fields.Boolean()
    }
  };

  /**
   * Schema for storing dashboard metadata.
   */
  export const DASHBOARD_SCHEMA = {
    id: 'dashboard',
    fields: {
      name: Fields.String(),
      width: Fields.Number(),
      height: Fields.Number()
    }
  };

  export const schemas = [DASHBOARD_SCHEMA, WIDGET_SCHEMA];

  export type WidgetSchema = typeof WIDGET_SCHEMA;

  export type DashboardSchema = typeof DASHBOARD_SCHEMA;

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
   * An options object for initializing a widgetstore.
   */
  export interface IOptions {
    /**
     * The unique id of the widgetstore.
     */
    id: number;

    /**
     * Initialize the state to a previously serialized one.
     */
    restoreState?: string;

    /**
     * An optional transaction id factory to override the default.
     */
    transactionIdFactory?: Datastore.TransactionIdFactory;

    /**
     * The notbook tracker used by Jupyterlab.
     */
    notebookTracker: INotebookTracker;
  }
}

import { Widget, Layout, LayoutItem } from '@lumino/widgets';

import { Record } from '@lumino/datastore';

import { IIterator, map, each, filter, toArray } from '@lumino/algorithm';

import { MessageLoop, Message } from '@lumino/messaging';

import { DashboardWidget } from './widget';

import { Widgetstore, WidgetSchema, WidgetPosition } from './widgetstore';

import { WidgetTracker } from '@jupyterlab/apputils';

import { Dashboard } from './dashboard';

import { Signal } from '@lumino/signaling';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import { IChangedArgs } from '@jupyterlab/coreutils';

/**
 * The class name added to the dashboard canvas.
 */
const CANVAS_CLASS = 'pr-Canvas';

/**
 * The class name added to a dashboard in tiled mode.
 */
const TILED_LAYOUT_CLASS = 'pr-TiledLayout';

/**
 * The class name added to a dashboard in free mode.
 */
const FREE_LAYOUT_CLASS = 'pr-FreeLayout';

/**
 * A layout for dashboards.
 */
export class DashboardLayout extends Layout {
  /**
   * Construct a dashboard layout.
   */
  constructor(options: DashboardLayout.IOptions) {
    super(options);

    const { widgetstore, outputTracker, width, height, mode, model } = options;

    this._items = new Map<string, LayoutItem>();
    this._widgetstore = widgetstore;
    this._outputTracker = outputTracker;

    this._width = width || 0;
    this._height = height || 0;

    this._canvas = DashboardLayout.makeCanvas(this._width, this._height);

    if (mode === 'free-edit') {
      this._canvas.classList.add(FREE_LAYOUT_CLASS);
    } else if (mode === 'grid-edit') {
      this._canvas.classList.add(TILED_LAYOUT_CLASS);
    }

    this._mode = mode;

    model.stateChanged.connect(this._handleModelChange, this);
  }

  /**
   * Handles signals emitted by the underlying model.
   */
  private _handleModelChange(
    _sender: DocumentRegistry.IModel,
    change: IChangedArgs<any>
  ): void {
    const { name, newValue } = change;
    switch (name) {
      case 'dashboardWidth':
        this.width = newValue;
        break;
      case 'dashboardHeight':
        this.height = newValue;
        break;
      case 'mode':
        this.setMode(newValue);
        break;
      default:
        break;
    }
  }

  /**
   * The canvas for the dashboard.
   */
  get canvas(): HTMLCanvasElement {
    return this._canvas;
  }

  /**
   * Perform initilization that requires a parent.
   */
  init(): void {
    super.init();
    each(this, widget => this.attachWidget(widget));
    this.parent.node.appendChild(this._canvas);
  }

  /**
   * Dispose of resources held by the layout.
   */
  dispose(): void {
    this._items.forEach(item => item.dispose());
    this._outputTracker = null;
    this._widgetstore = null;
    super.dispose();
  }

  /**
   * Handle `after-attach` messages for the layout.
   */
  onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this._dashboard = this.parent as Dashboard;
    if (this.mode === 'grid-edit') {
      this.setTileSize(this.tileSize);
    }
  }

  /**
   * Create an iterator over the widgets in the layout.
   *
   * @returns a new iterator over the widgets in the layout.
   */
  iter(): IIterator<Widget> {
    // Is there a lazy way to iterate through the map?
    const arr = Array.from(this._items.values());
    return map(arr, item => item.widget);
  }

  signalChange(change?: IDashboardChange): void {
    if (!this._signalChanges) {
      return;
    }
    if (change) {
      this._changes.push(change);
    }
    if (!this.inBatch) {
      this._changed.emit(this._changes);
      this._changes = [];
    }
  }

  /**
   * Attach a widget to the parent's DOM node.
   *
   * @param widget - The widget to attach to the parent.
   */
  protected attachWidget(widget: Widget): void {
    // Set widget's parent.
    widget.parent = this.parent;

    // Send a `'before-attach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeAttach);
    }

    // Add the widget's node to the parent.
    this.parent!.node.appendChild(widget.node);

    // Send an `'after-attach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.AfterAttach);
    }

    // Post a fit request for the parent widget.
    this.parent!.fit();
  }

  /**
   * Detach a widget from the parent's DOM node.
   *
   * @param widget - The widget to detach from the parent.
   */
  protected detachWidget(_index: number, widget: Widget): void {
    // Send a `'before-detach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeDetach);
    }

    // Remove the widget's node from the parent.
    this.parent!.node.removeChild(widget.node);

    // Send an `'after-detach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.AfterDetach);
    }

    widget.parent = null;

    // Post a fit request for the parent widget.
    this.parent!.fit();
  }

  /**
   * Add a widget to the layout.
   *
   * @param widget - the widget to add.
   *
   * @param _pos - the desired size/position of the added widget.
   */
  addWidget(widget: DashboardWidget, _pos: Widgetstore.WidgetPosition): void {
    this.startBatch();
    this._addWidget(widget, _pos);
  }

  /**
   * A helper function to add a widget to the layout.
   *
   * @param widget - the widget to add.
   *
   * @param _pos - the desired size/position of the added widget.
   *
   * ### Notes
   * This method is called recursively to handle overlapping widgets and
   * shoudn't be called directly. If you want to add a widget, use the
   * .addWidget() method instead.
   */
  _addWidget(widget: DashboardWidget, _pos: Widgetstore.WidgetPosition): void {
    // Add the widget to the layout.
    const item = new LayoutItem(widget);
    this._items.set(widget.id, item);

    // Attach the widget to the parent.
    if (this.parent) {
      if (this._dashboard !== undefined) {
        widget.mode = this._dashboard.model.mode;
      } else {
        widget.mode = 'present';
      }
      this.attachWidget(widget);

      const { id, notebookId, cellId } = widget;

      const ignore = !this._signalChanges;

      widget.ready.connect(() => {
        this._updateWidget(widget, widget.pos, false);
        this.fixOverlaps(widget);
        this._outputTracker.add(widget);

        const change: IDashboardChange = {
          type: 'add',
          pos: widget.pos,
          widgetId: id,
          notebookId,
          cellId,
          ignore
        };

        this.signalChange(change);
        this.endBatch();
      });
    }
  }

  /**
   * Move or resize a widget in the layout.
   *
   * @param widget - the widget to update.
   *
   * @param pos - the new position/size for the widget.
   *
   * @returns - whether the update was successful.
   */
  updateWidget(
    widget: DashboardWidget,
    pos: Widgetstore.WidgetPosition
  ): boolean {
    const wasInBatch = this.inBatch;
    if (!wasInBatch) {
      this.startBatch();
    }

    const success = this._updateWidgetHelper(widget, pos);

    if (!wasInBatch) {
      this.endBatch();
    }
    return success;
  }

  /**
   * A helper function to move or resize a widget in the layout.
   *
   * @param widget - the widget to update.
   *
   * @param pos - the new position/size for the widget.
   *
   * @param fixOverlaps - whether overlaps should be automatically resolved.
   *
   * @returns - whether the update was successful.
   *
   * ### Notes
   * This is a helper function for the .updateWidget() method and should not
   * be called directly. Use .updateWidget() if you want to move or resize a
   * widget.
   */
  private _updateWidgetHelper(
    widget: DashboardWidget,
    pos: Widgetstore.WidgetPosition,
    fixOverlaps = true
  ): boolean {
    const success = this._updateWidget(widget, pos, fixOverlaps);
    if (success) {
      const change: IDashboardChange = {
        type: 'move',
        widgetId: widget.id,
        pos: widget.pos
      };
      this.signalChange(change);
    }
    return success;
  }

  /**
   * A helper function to move or resize a widget in the layout.
   *
   * @param widget - the widget to update.
   *
   * @param pos - the new position/size for the widget.
   *
   * @param fixOverlaps - whether overlaps should be automatically resolved.
   *
   * @returns - whether the update was successful.
   *
   * ### Notes
   * This function is called recursively to handle overlapping widgets and
   * shouldn't be called directly. If you want to update a widget, use
   * .updateWidget() instead.
   */
  private _updateWidget(
    widget: DashboardWidget,
    pos: Widgetstore.WidgetPosition,
    fixOverlaps = true
  ): boolean {
    // Get the item from the map.
    const item = this._items.get(widget.id);

    // If the item doesn't exist, return.
    if (item === undefined) {
      return false;
    }

    let { left, top, width, height } = pos;

    // Constrain the widget to the dashboard dimensions.
    if (this._width !== 0 && left + width > this._width) {
      left = this._width - width;
    }
    if (this._height !== 0 && top + height > this._height) {
      top = this._height - height;
    }

    // Prevent clipping on the top or left edge.
    left = Math.max(left, 0);
    top = Math.max(top, 0);

    // Snap to grid if in grid mode.
    if (widget.mode === 'grid-edit') {
      left = Private.mround(left, this._tileSize);
      top = Private.mround(top, this._tileSize);
      width = Math.max(Private.mround(width, this._tileSize), this._tileSize);
      height = Math.max(Private.mround(height, this._tileSize), this._tileSize);
      // Change width/height now to force grid changes if they're small.
      item.update(0, 0, 0, 0);
    }

    this.clearCanvas();

    item.update(left, top, width, height);

    if (fixOverlaps) {
      this.fixOverlaps(widget);
    }

    return true;
  }

  /**
   * Remove a widget from the layout.
   *
   * @param widget - the widget to remove.
   *
   * ### Notes
   * This is basically the same as deleteWidget but fulfills the type
   * signature requirements of the extended class.
   */
  removeWidget(widget: DashboardWidget): void {
    void this.deleteWidget(widget);
  }

  /**
   * Remove a widget from the layout.
   *
   * @param widget - the widget to remove.
   */
  deleteWidget(widget: DashboardWidget): boolean {
    // Look up the widget in the _items map.
    const item = this._items.get(widget.id);

    // Bail if it's not there.
    if (item === undefined) {
      return false;
    }

    const change: IDashboardChange = {
      type: 'remove',
      widgetId: widget.id
    };

    // Remove the item from the map.
    this._items.delete(widget.id);

    // Detach the widget from the parent.
    if (this.parent) {
      this.detachWidget(-1, widget);
    }

    this.clearCanvas();

    // Dispose the layout item.
    item.dispose();

    this.signalChange(change);

    return true;
  }

  /**
   * Adds a dashboard widget's information to the widgetstore.
   *
   * @param info - the information to add to the widgetstore.
   */
  updateWidgetInfo(info: Widgetstore.WidgetInfo): void {
    this._widgetstore.addWidget(info);
  }

  /**
   * Mark a widget as deleted in the widgetstore.
   *
   * @param widget - the widget to mark as deleted.
   */
  deleteWidgetInfo(widget: DashboardWidget): void {
    this._widgetstore.deleteWidget(widget.id);
  }

  /**
   * Update a widgetstore entry for a widget given that widget.
   *
   * @param widget - the widget to update from.
   */
  updateInfoFromWidget(widget: DashboardWidget): void {
    this.updateWidgetInfo(widget.info);
  }

  /**
   * Update the layout from a widgetstore record.
   *
   * @param record - the record to update from.
   */
  private _updateLayoutFromRecord(record: Record<WidgetSchema>): void {
    const item = this._items.get(record.$id);
    const pos = record.pos;

    if (record.widgetId === '') {
      // Widget has already been removed; ignore.
      if (item === undefined) {
        return;
      }

      // Widget is empty; remove.
      this.deleteWidget(item.widget as DashboardWidget);
    } else if (item === undefined) {
      // Widget has already been removed; ignore.
      if (record.removed) {
        return;
      } else {
        // Widget is newly added or undeleted; add.
        const newWidget = this._widgetstore.createWidget(
          record as Widgetstore.WidgetInfo
        );
        this.addWidget(newWidget, pos);
      }
    } else {
      // Widget was just removed; delete.
      if (record.removed) {
        this.deleteWidget(item.widget as DashboardWidget);
      }

      // Widget was moved or resized; update.
      this.updateWidget(item.widget as DashboardWidget, pos);
    }
  }

  /**
   * Updates the layout based on the state of the datastore.
   */
  updateLayoutFromWidgetstore(): void {
    this._signalChanges = false;
    const records = this._widgetstore.get(Widgetstore.WIDGET_SCHEMA);
    each(records, record => {
      this._updateLayoutFromRecord(record);
    });
    this._signalChanges = true;
  }

  /**
   * Undo the last change to the layout.
   */
  undo(): void {
    this._widgetstore.undo();
    this.updateLayoutFromWidgetstore();
  }

  /**
   * Redo the last change to the layout.
   */
  redo(): void {
    this._widgetstore.redo();
    this.updateLayoutFromWidgetstore();
  }

  /**
   * Gets an iterator of widgets overlapping a point.
   *
   * @param left - the distance from the point to the left edge of the dashboard.
   *
   * @param top - the distance from the point to the top edge of the dashboard.
   *
   * @returns - an iterator containing widgets at the point.
   */
  widgetsAtPoint(
    left: number,
    top: number
  ): IIterator<DashboardWidget.Overlap> {
    const pos = {
      left,
      top,
      width: 0,
      height: 0
    };
    return this._widgetsInSelection(pos);
  }

  /**
   * Gets an iterator of widgets overlapping a selection
   *
   * @param pos - an object containing the left, top, width, and height
   * of the selection.
   *
   * @returns - an iterator containing widgets in that selection.
   */
  private _widgetsInSelection(
    pos: WidgetPosition
  ): IIterator<DashboardWidget.Overlap> {
    const relations = map(this, _widget => {
      const widget = _widget as DashboardWidget;
      return widget.overlaps(pos);
    });
    const overlaps = filter(
      relations,
      relation => relation.type !== 'none' && !relation.widget.locked
    );
    return overlaps;
  }

  /**
   * Resolve an overlap between two widgets.
   *
   * @param pos - the dimensions/position of the widget being overlapped.
   *
   * @param overlap - an object containing the overlapping widget and its position
   * relative to the underlying widget.
   */
  private _handleOverlap(
    pos: Widgetstore.WidgetPosition,
    overlap: DashboardWidget.Overlap
  ): void {
    const { left, top, width, height } = pos;
    const { widget, type } = overlap;

    const newPos = widget.pos;
    let adjust;

    switch (type) {
      case 'up':
        newPos.top = top - newPos.height;
        break;
      case 'down':
        newPos.top = top + height;
        break;
      case 'left':
        newPos.left = left - newPos.width;
        break;
      case 'right':
        newPos.left = left + width;
        break;
    }

    if (newPos.left < 0) {
      adjust = Math.abs(newPos.left);
      newPos.left = 0;
      this._expandCanvas(type, adjust);
    }
    if (newPos.top < 0) {
      adjust = Math.abs(newPos.top);
      newPos.top = 0;
      this._expandCanvas(type, adjust);
    }
    const heightDiff = newPos.top + newPos.height - this.height;
    if (heightDiff > 0) {
      this._expandCanvas(type, heightDiff);
    }
    const widthDiff = newPos.left + newPos.width - this.width;
    if (widthDiff > 0) {
      this._expandCanvas(type, widthDiff);
    }

    this._updateWidget(widget, newPos);
  }

  /**
   * Resolves overlaps between several widgets.
   *
   * @param overlaps - an iterator containing information about widget overlaps.
   *
   * @param pos - the dimensions/position of the widget being overlapped.
   */
  handleOverlaps(
    overlaps: IIterator<DashboardWidget.Overlap>,
    pos: Widgetstore.WidgetPosition
  ): void {
    each(overlaps, overlap => void this._handleOverlap(pos, overlap));
  }

  /**
   * Moves all widgets overlapping a selected widget.
   *
   * @param widget - the widget being overlapped.
   */
  fixOverlaps(widget: DashboardWidget): void {
    const overlaps = filter(
      this._widgetsInSelection(widget.pos),
      overlap => overlap.widget !== widget
    );

    widget.locked = true;
    this.handleOverlaps(overlaps, widget.pos);
    widget.locked = false;
  }

  /**
   * Increase the width/height of the dashboard canvas and automatically move
   * its widgets to accommodate the increase if necessary.
   *
   * @param direction - the direction to expand the canvas (left, right, up, down)
   *
   * @param amount - the number of pixels to expand the canvas.
   */
  private _expandCanvas(
    direction: DashboardWidget.Direction,
    amount: number
  ): void {
    const model = (this.parent as Dashboard).model;
    const widgets = toArray(this);

    switch (direction) {
      case 'left':
        model.height += amount;
        each(widgets, _widget => {
          const widget = _widget as DashboardWidget;
          const pos = widget.pos;
          pos.left += amount;
          this._updateWidgetHelper(widget, pos);
        });
        break;
      case 'right':
        model.width += amount;
        break;
      case 'up':
        model.height += amount;
        each(widgets, _widget => {
          const widget = _widget as DashboardWidget;
          const pos = widget.pos;
          pos.top += amount;
          this._updateWidgetHelper(widget, pos);
        });
        break;
      case 'down':
        model.height += amount;
        break;
    }
  }

  /**
   * The width of the dashboard in pixels.
   */
  get width(): number {
    return this._width;
  }
  set width(newWidth: number) {
    if (newWidth < 0) {
      newWidth = 0;
    }
    this._width = newWidth;
    this._canvas.width = newWidth;
  }

  /**
   * The height of the dashboard in pixels.
   */
  get height(): number {
    return this._height;
  }
  set height(newHeight: number) {
    if (newHeight < 0) {
      newHeight = 0;
    }
    this._height = newHeight;
    this._canvas.height = newHeight;
  }

  /**
   * Set the dashboard display mode.
   *
   * @param newMode - the new mode (present, free, or tile).
   */
  setMode(newMode: Dashboard.Mode): void {
    this._mode = newMode;
    this.clearCanvas();
    each(this, _widget => {
      const widget = _widget as DashboardWidget;
      widget.mode = newMode;
    });
    switch (newMode) {
      case 'present':
        this.canvas.style.backgroundPosition = null;
        this.canvas.style.backgroundSize = null;
        this._canvas.classList.remove(FREE_LAYOUT_CLASS);
        this._canvas.classList.remove(TILED_LAYOUT_CLASS);
        break;
      case 'free-edit':
        this.canvas.style.backgroundPosition = null;
        this.canvas.style.backgroundSize = null;
        this._canvas.classList.remove(TILED_LAYOUT_CLASS);
        this._canvas.classList.add(FREE_LAYOUT_CLASS);
        break;
      case 'grid-edit':
        this.setTileSize(this._tileSize);
        this._canvas.classList.remove(FREE_LAYOUT_CLASS);
        this.canvas.classList.add(TILED_LAYOUT_CLASS);
        break;
    }
  }

  /**
   * The display mode for the dashboard (present, free, or tile).
   */
  get mode(): Dashboard.Mode {
    return this._mode;
  }

  /**
   * Start a batch of widget updates.
   */
  startBatch(): void {
    this._inBatch = true;
  }

  /**
   * End a batch of widget updates.
   *
   * ### Notes
   * If startBatch() was called before endBatch(), this will signal all
   * of the batched updates.
   */
  endBatch(): void {
    const wasInBatch = this.inBatch;
    this._inBatch = false;
    if (wasInBatch) {
      this.signalChange();
    }
  }

  /**
   * Whether the layout is in a batch of widget updates.
   */
  get inBatch(): boolean {
    return this._inBatch;
  }

  /**
   * Creates a dashboard widget from a widgetinfo object.
   *
   * @param info - info to create widget from.
   *
   * @param fit - whether to fit the widget to content when it's created.
   *
   * @returns - the created widget.
   *
   * @throws - an error if a notebook or cell isn't found from the ids in the
   * widgetinfo object.
   */
  createWidget(info: Widgetstore.WidgetInfo, fit?: boolean): DashboardWidget {
    return this._widgetstore.createWidget(info, fit);
  }

  /**
   * A signal emitted when the layout changes.
   */
  get changed(): Signal<this, IDashboardChange[]> {
    return this._changed;
  }

  /**
   * Clear the layout's canvas.
   *
   * @returns a 2D context for the canvas.
   */
  clearCanvas(): CanvasRenderingContext2D {
    const canvas = this.canvas;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    return context;
  }

  /**
   * Draw a rectangle on the canvas.
   *
   * @param pos - the location and size of the rectangle.
   *
   * @param color - the color of the rectangle.
   */
  drawDropZone(pos: Widgetstore.WidgetPosition, color: string): void {
    const context = this.clearCanvas();

    context.setLineDash([5]);
    context.strokeStyle = color;
    context.fillStyle = `${color}66`;

    let { left, top, width, height } = pos;

    if (this.mode === 'grid-edit') {
      width = Math.max(Private.mround(width, this._tileSize), this._tileSize);
      height = Math.max(Private.mround(height, this._tileSize), this._tileSize);
      left = Private.mround(left, this._tileSize);
      top = Private.mround(top, this._tileSize);
    }

    context.strokeRect(left, top, width, height);
    context.fillRect(left, top, width, height);
  }

  /**
   * Sets the size of a single tile in tile layout model.
   *
   * @param s - the new tile size in pixels.
   */
  setTileSize(s: number): void {
    this._tileSize = s;
    // const backgroundPosition = `0 0, 0 ${s}px, ${s}px -${s}px, -${s}px 0px`;

    // this.canvas.style.backgroundPosition = backgroundPosition;
    this.canvas.style.backgroundSize = `${s}px ${s}px`;
    this.parent.update();

    this.startBatch();
    each(this, _widget => {
      const widget = _widget as DashboardWidget;
      this.updateWidget(widget, widget.pos);
    });
    this.endBatch();
  }

  /**
   * The size of a single tile layout tile in pixels.
   */
  get tileSize(): number {
    return this._tileSize;
  }

  /**
   * Reduces the dimensions of the dashboard to the minimum required to
   * contain all the widgets ("trims" excess dashboard to the right and
   * bottom of the content).
   */
  trimDashboard(): void {
    const model = (this.parent as Dashboard).model;
    let maxWidth = 0;
    let maxHeight = 0;

    each(this, _widget => {
      const widget = _widget as DashboardWidget;
      const { left, top, width, height } = widget.pos;

      if (left + width > maxWidth) {
        maxWidth = left + width;
      }
      if (top + height > maxHeight) {
        maxHeight = top + height;
      }
    });

    if (maxWidth) {
      model.width = maxWidth;
    }
    if (maxHeight) {
      model.height = maxHeight;
    }
  }

  // Map from widget ids to LayoutItems
  private _items: Map<string, LayoutItem>;
  // Datastore widgets are rendered from / saved to.
  private _widgetstore: Widgetstore | undefined;
  // Output tracker to add new widgets to.
  private _outputTracker: WidgetTracker<DashboardWidget>;
  // Dummy canvas element to set dimensions of dashboard.
  private _canvas: HTMLCanvasElement;
  // Dashboard width (zero if unconstrained).
  private _width: number;
  // Dashboard height (zero if unconstrained).
  private _height: number;
  // Mode (either interactive or edit);
  private _mode: Dashboard.Mode;
  // Parent dashboard.
  private _dashboard: Dashboard;
  // Size of a single tile in tiled layout in pixels.
  private _tileSize = DashboardLayout.DEFAULT_TILE_SIZE;
  // Changed signal
  private _changed = new Signal<this, IDashboardChange[]>(this);
  // An array of changes emitted when a single change or a batch finishes.
  private _changes: IDashboardChange[] = [];
  // Whether the layout is currently in a batch of changes.
  private _inBatch = false;
  // Whether the layout should emit the array of changes after a change or
  // batch finishes.
  private _signalChanges = true;
}

/**
 * The namespace for the `DashboardLayout` class statics.
 */
export namespace DashboardLayout {
  /**
   * An options object for initializing a Dashboard layout.
   */

  export interface IOptions extends Layout.IOptions {
    /**
     * The tracker to handle deleting and widget focus.
     */
    outputTracker: WidgetTracker<DashboardWidget>;

    /**
     * The widgetstore to update from.
     */
    widgetstore: Widgetstore;

    /**
     * The static width of the dashboard area.
     */
    width?: number;

    /**
     * The static height of the dashboard area.
     */
    height?: number;

    /**
     * The layout mode (either interactive or edit).
     */
    mode: Dashboard.Mode;

    /**
     * The dashboard model (used for updating metadata).
     */
    model: DocumentRegistry.IModel;
  }

  /**
   * Create a widget to put in the canvas of a layout to set the length/width.
   *
   * @param x - width.
   *
   * @param y - height.
   */
  export function makeCanvas(x: number, y: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = x;
    canvas.height = y;
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.position = 'absolute';
    canvas.classList.add(CANVAS_CLASS);
    return canvas;
  }

  /**
   * The default size of a single tile in tiled layout.
   */
  export const DEFAULT_TILE_SIZE = 32;
}

/**
 * A type for dashboard changes emitted by the changed signal.
 */
export type DashboardChangeType = 'add' | 'remove' | 'move';

/**
 * An interface describing a change that occurs to the dashboard.
 */
export interface IDashboardChange {
  type: DashboardChangeType;

  widgetId: string;

  pos?: {
    left?: number;
    top?: number;
    width?: number;
    height?: number;
  };

  notebookId?: string;

  cellId?: string;

  ignore?: boolean;
}

/**
 * A namespace for private functionality
 */
namespace Private {
  /**
   * Rounds `num` to the nearest integer multiple of `roundTo`.
   */
  export function mround(num: number, roundTo: number): number {
    return roundTo * Math.round(num / roundTo);
  }
}

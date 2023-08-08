import { NotebookPanel, INotebookTracker } from '@jupyterlab/notebook';
import { CodeCell, MarkdownCell } from '@jupyterlab/cells';
import { Widget } from '@lumino/widgets';
import { MessageLoop } from '@lumino/messaging';
import { UUID, MimeData } from '@lumino/coreutils';
import { ArrayExt } from '@lumino/algorithm';
import { Message } from '@lumino/messaging';
import { Drag } from './drag';
import { Dashboard } from './dashboard';
import { getNotebookId, getCellId, getNotebookById, getCellById } from './utils';
import { Signal, ISignal } from '@lumino/signaling';
import { Widgetstore, WidgetPosition } from './widgetstore';
import { DashboardLayout } from './layout';

/**
 * The class name added to dashboard outputs
 */
const DASHBOARD_WIDGET_CLASS = 'pr-DashboardWidget';

/**
 * The class name for the widget drag mime.
 */
const DASHBOARD_WIDGET_MIME = 'pr-DashboardWidgetMine';

/**
 * The class name added to the children of dashboard outputs.
 */
const DASHBOARD_WIDGET_CHILD_CLASS = 'pr-DashboardWidgetChild';

/**
 * The class name added to editable dashboard outputs.
 */
const EDITABLE_WIDGET_CLASS = 'pr-EditableWidget';

/**
 * The class name added to markdown dashboard outputs.
 */
const MARKDOWN_OUTPUT_CLASS = 'pr-MarkdownOutput';

/**
 * The class name added to dashboard widget drag images.
 */
const DRAG_IMAGE_CLASS = 'pr-DragImage';

/**
 * Widget to wrap delete/move/etc functionality of widgets in a dashboard (future).
 */
export class DashboardWidget extends Widget {
  constructor(options: DashboardWidget.IOptions) {
    super();

    const { notebook, cell, cellId, notebookId, fit } = options;

    this._notebook = notebook || null;
    this._cell = cell || null;
    this.id = DashboardWidget.createDashboardWidgetId();

    // Makes widget focusable.
    this.node.setAttribute('tabindex', '-1');

    const _cellId = getCellId(cell);
    const _notebookId = getNotebookId(notebook);

    if (_notebookId === undefined) {
      this.node.style.background = 'red';
      if (notebookId === undefined) {
        console.warn('DashboardWidget has no notebook or notebookId');
      }
      this._notebookId = notebookId;
    } else if (_cellId === undefined) {
      this.node.style.background = 'yellow';
      if (cellId === undefined) {
        console.warn('DashboardWidget has no cell or cellId');
      }
      this._cellId = cellId;
    } else {
      if (notebookId && _notebookId !== notebookId) {
        console.warn(`DashboardWidget notebookId ('${notebookId}') and id of
                      notebook ('${_notebookId}') don't match. 
                      Using ${_notebookId}.`);
      }
      if (cellId && _cellId !== cellId) {
        console.warn(`DashboardWidget cellId ('${cellId}') and id of cell
                      ('${_cellId}') don't match. Using ${_cellId}.`);
      }

      this._cellId = _cellId;
      this._notebookId = _notebookId;

      void this._notebook.context.ready.then(() => {
        let clone: Widget;
        const cellType = cell.model.type;
        const container = document.createElement('div');
        let cloneNode: HTMLElement;
        let nodes: HTMLCollectionOf<Element>;
        let node: HTMLElement;

        switch (cellType) {
          case 'markdown':
            cloneNode = (cell as MarkdownCell).clone().node;
            nodes = cloneNode.getElementsByClassName('jp-MarkdownOutput');
            node = nodes[0] as HTMLElement;
            node.style.paddingRight = '0';
            clone = new Widget({ node });
            container.classList.add(MARKDOWN_OUTPUT_CLASS);
            break;
          case 'code':
            clone = (cell as CodeCell).cloneOutputArea();
            break;
          default:
            throw new Error('Cell is not a code or markdown cell.');
        }

        // Make widget invisible until it's properly loaded/sized.
        this.node.style.opacity = '0';

        container.classList.add(DASHBOARD_WIDGET_CHILD_CLASS);

        // Fake an attach in order to render LaTeX properly.
        // Note: This is not how you should use Lumino widgets.
        if (this.parent) {
          if (this.parent!.isAttached) {
            MessageLoop.sendMessage(clone, Widget.Msg.BeforeAttach);
            container.appendChild(clone.node);
            this.node.appendChild(container);
            if (this.parent!.isAttached) {
              MessageLoop.sendMessage(clone, Widget.Msg.AfterAttach);
            }
          }
        }

        this._content = clone;

        const done = (): void => {
          if (fit) {
            this.fitContent();
          }
          // Make widget visible again.
          this.node.style.opacity = null;
          // Emit the ready signal.
          this._ready.emit(undefined);
        };

        // Wait a moment then fit content. This allows all components to load
        // and for their width/height to adjust before fitting.
        setTimeout(done.bind(this), 2);
      });
    }

    const resizerTopLeft = DashboardWidget.createResizer('top-left');
    const resizerTopRight = DashboardWidget.createResizer('top-right');
    const resizerBottomLeft = DashboardWidget.createResizer('bottom-left');
    const resizerBottomRight = DashboardWidget.createResizer('bottom-right');
    this.node.appendChild(resizerTopLeft);
    this.node.appendChild(resizerTopRight);
    this.node.appendChild(resizerBottomLeft);
    this.node.appendChild(resizerBottomRight);

    this.addClass(DASHBOARD_WIDGET_CLASS);
    this.addClass(EDITABLE_WIDGET_CLASS);
  }

  /**
   * Create click listeners on attach
   */
  onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.node.addEventListener('click', this);
    this.node.addEventListener('contextmenu', this);
    this.node.addEventListener('mousedown', this);
    this.node.addEventListener('dblclick', this);
    this.node.addEventListener('keydown', this);
  }

  /**
   * Remove click listeners on detach
   */
  onBeforeDetach(msg: Message): void {
    super.onBeforeDetach(msg);
    this.node.removeEventListener('click', this);
    this.node.removeEventListener('contextmenu', this);
    this.node.removeEventListener('mousedown', this);
    this.node.removeEventListener('dblclick', this);
    this.node.removeEventListener('keydown', this);
  }

  handleEvent(event: Event): void {
    // Just do the default behavior in present mode.
    if (this._mode === 'present') {
      return;
    }

    switch (event.type) {
      case 'keydown':
        this._evtKeyDown(event as KeyboardEvent);
        break;
      case 'mousedown':
        this._evtMouseDown(event as MouseEvent);
        break;
      case 'mouseup':
        this._evtMouseUp(event as MouseEvent);
        break;
      case 'mousemove':
        this._evtMouseMove(event as MouseEvent);
        break;
      case 'click':
      case 'contextmenu':
        // Focuses on clicked output and blurs all others
        // Is there a more efficient way to blur other outputs?
        Array.from(document.getElementsByClassName(DASHBOARD_WIDGET_CLASS)).map(
          blur
        );
        this.node.focus();
        break;
      case 'dblclick':
        this._evtDblClick(event as MouseEvent);
        break;
    }
  }

  /**
   * Handle the `'keydown'` event for the widget.
   */
  private _evtKeyDown(event: KeyboardEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const pos = this.pos;
    const oldPos = { ...pos };

    const bumpDistance = event.altKey ? 1 : DashboardWidget.BUMP_DISTANCE;

    switch (event.keyCode) {
      // Left arrow key
      case 37:
        pos.left -= bumpDistance;
        break;
      // Up arrow key
      case 38:
        pos.top -= bumpDistance;
        break;
      // Right arrow key
      case 39:
        pos.left += bumpDistance;
        break;
      // Down arrow key
      case 40:
        pos.top += bumpDistance;
        break;
    }

    if (pos !== oldPos) {
      (this.parent as Dashboard).updateWidget(this, pos);
    }
  }

  /**
   * Handle the `'dblclick'` event for the widget. Currently a no-op.
   */
  private _evtDblClick(event: MouseEvent): void {
    // Do nothing if it's not a left mouse press.
    if (event.button !== 0) {
      return;
    }

    // Do nothing if any modifier keys are pressed.
    if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
      return;
    }

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Handle `mousedown` events for the widget.
   */
  private _evtMouseDown(event: MouseEvent): void {
    const { button, shiftKey, target } = event;

    // We only handle main or secondary button actions.
    if (
      !(button === 0 || button === 2) ||
      // Shift right-click gives the browser default behavior.
      (shiftKey && button === 2)
    ) {
      return;
    }

    event.preventDefault();

    window.addEventListener('mouseup', this);
    window.addEventListener('mousemove', this);

    // this.node.style.opacity = '0.6';

    const elem = target as HTMLElement;
    // Set mode to resize if the mousedown happened on a resizer.
    if (elem.classList.contains('pr-Resizer')) {
      this._mouseMode = 'resize';
      if (elem.classList.contains('pr-ResizerTopRight')) {
        this._selectedResizer = 'top-right';
      } else if (elem.classList.contains('pr-ResizerTopLeft')) {
        this._selectedResizer = 'top-left';
      } else if (elem.classList.contains('pr-ResizerBottomLeft')) {
        this._selectedResizer = 'bottom-left';
      } else {
        this._selectedResizer = 'bottom-right';
      }
    } else {
      this._mouseMode = 'drag';
    }

    const cell = this.cell;

    const rect = this.node.getBoundingClientRect();

    const { width, height, top, left } = this.pos;

    this._clickData = {
      pressX: event.clientX,
      pressY: event.clientY,
      cell,
      origWidth: width,
      origHeight: height,
      origLeft: left,
      origTop: top,
      target: this.node.cloneNode(true) as HTMLElement,
      widgetX: rect.left,
      widgetY: rect.top
    };
  }

  /**
   * Handle `mousemove` events for the widget.
   */
  private _evtMouseMove(event: MouseEvent): void {
    switch (this._mouseMode) {
      case 'drag':
        this._dragMouseMove(event);
        break;
      case 'resize':
        this._resizeMouseMove(event);
        break;
      default:
        break;
    }
  }

  /**
   * Handle `mousemove` events when the widget mouseMode is `drag`.
   */
  private _dragMouseMove(event: MouseEvent): void {
    const data = this._clickData;
    const { clientX, clientY } = event;

    if (
      data &&
      Private.shouldStartDrag(data.pressX, data.pressY, clientX, clientY)
    ) {
      void this._startDrag(data.target, clientX, clientY);
    }
  }

  /**
   * Handle `mousemove` events when the widget mouseMode is `resize`.
   */
  private _resizeMouseMove(event: MouseEvent): void {
    const {
      pressX,
      pressY,
      origWidth,
      origHeight,
      origLeft,
      origTop
    } = this._clickData;

    const deltaX = event.clientX - pressX;
    const deltaY = event.clientY - pressY;

    let { width, height, top, left } = this.pos;

    switch (this._selectedResizer) {
      case 'bottom-right':
        width = Math.max(origWidth + deltaX, DashboardWidget.MIN_WIDTH);
        height = Math.max(origHeight + deltaY, DashboardWidget.MIN_HEIGHT);
        break;
      case 'bottom-left':
        width = Math.max(origWidth - deltaX, DashboardWidget.MIN_WIDTH);
        height = Math.max(origHeight + deltaY, DashboardWidget.MIN_HEIGHT);
        left = origLeft + deltaX;
        break;
      case 'top-right':
        width = Math.max(origWidth + deltaX, DashboardWidget.MIN_WIDTH);
        height = Math.max(origHeight - deltaY, DashboardWidget.MIN_HEIGHT);
        top = origTop + deltaY;
        break;
      case 'top-left':
        width = Math.max(origWidth - deltaX, DashboardWidget.MIN_WIDTH);
        height = Math.max(origHeight - deltaY, DashboardWidget.MIN_HEIGHT);
        top = origTop + deltaY;
        left = origLeft + deltaX;
        break;
    }

    this.pos = { width, height, top, left };

    if (this.mode === 'grid-edit') {
      (this.parent.layout as DashboardLayout).drawDropZone(this.pos, '#2b98f0');
    }
    if (this.mode === 'free-edit' && this._fitToContent && !event.altKey) {
      this.fitContent();
    }
  }

  /**
   * Fit widget width/height to the width/height of the underlying content.
   */
  fitContent(): void {
    const element = this._content.node.firstChild as HTMLElement;
    // Pixels are added to prevent weird wrapping issues. Kind of a hack.
    this.pos = {
      width: element.clientWidth + 3,
      height: element.clientHeight + 2,
      left: undefined,
      top: undefined
    };
  }

  /**
   * Determines whether the widget contains the point (left, top).
   *
   * ### Notes
   * Both `left` and `top` are relative to the dashboard.
   */
  containsPoint(left: number, top: number): boolean {
    const pos = {
      left,
      top,
      width: 0,
      height: 0
    };
    const overlap = this.overlaps(pos);
    return overlap.type !== 'none';
  }

  /**
   * Determines whether the widget overlaps an area.
   *
   * @param _pos - the position and size of the test area.
   *
   * @returns - an object containing the type of overlap and this widget.
   */
  overlaps(_pos: Widgetstore.WidgetPosition): DashboardWidget.Overlap {
    const { left, top, width, height } = _pos;
    const pos = this.pos;
    const w = 0.5 * (width + pos.width);
    const h = 0.5 * (height + pos.height);
    const dx = left + 0.5 * width - (pos.left + 0.5 * pos.width);
    const dy = top + 0.5 * height - (pos.top + 0.5 * pos.height);
    let type: DashboardWidget.Direction = 'none';

    if (Math.abs(dx) < w && Math.abs(dy) < h) {
      if (top > pos.top + pos.height / 2) {
        type = 'up';
      } else {
        type = 'down';
      }
    }

    return { type, widget: this };
  }

  /**
   * Start a drag event
   */
  private _startDrag(
    target: HTMLElement,
    clientX: number,
    clientY: number
  ): Promise<void> {
    const dragImage = target;

    dragImage.classList.add(DRAG_IMAGE_CLASS);

    this.node.style.opacity = '0';
    this.node.style.pointerEvents = 'none';

    this._drag = new Drag({
      mimeData: new MimeData(),
      dragImage,
      proposedAction: 'move',
      supportedActions: 'copy-move',
      source: this,
      dragAdjustX: this._clickData.widgetX,
      dragAdjustY: this._clickData.widgetY
    });

    this._drag.mimeData.setData(DASHBOARD_WIDGET_MIME, this);

    document.removeEventListener('mousemove', this, true);
    document.removeEventListener('mouseup', this, true);

    return this._drag.start(clientX, clientY).then(() => {
      if (this.isDisposed) {
        return;
      }
      this.node.style.opacity = null;
      this.node.style.pointerEvents = 'auto';
      this._drag = null;
      this._clickData = null;
    });
  }

  /**
   * Handle `mouseUp` events for the widget.
   */
  private _evtMouseUp(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();

    this.node.style.opacity = null;

    if (this._mouseMode === 'resize' && this.parent !== undefined) {
      const pos = this.pos;
      (this.parent as Dashboard).updateWidget(this, pos);
    }

    this._mouseMode = 'none';
    (this.parent.layout as DashboardLayout).clearCanvas();
    window.removeEventListener('mouseup', this);
    window.removeEventListener('mousemove', this);
  }

  /**
   * The widget's position on its dashboard.
   *
   * ### Notes
   * When setting the widget pos, fields that you don't want to modify
   * can be set as `undefined`.
   */
  get pos(): WidgetPosition {
    return {
      left: parseInt(this.node.style.left, 10),
      top: parseInt(this.node.style.top, 10),
      width: parseInt(this.node.style.width, 10),
      height: parseInt(this.node.style.height, 10)
    };
  }
  set pos(newPos: WidgetPosition) {
    const style = this.node.style;
    for (const [key, value] of Object.entries(newPos)) {
      if (value !== undefined) {
        style.setProperty(key, `${value}px`);
      }
    }
  }

  /**
   * Information sufficient to reconstruct the widget.
   */
  get info(): Widgetstore.WidgetInfo {
    const pos = this.pos;
    return {
      pos,
      widgetId: this.id,
      cellId: this.cellId,
      notebookId: this.notebookId,
      removed: false
    };
  }

  /**
   * The id of the cell the widget is generated from.
   */
  get cellId(): string {
    return this._cellId || getCellId(this._cell);
  }

  /**
   * The id of the notebook the widget is generated from.
   */
  get notebookId(): string {
    return this._notebookId || getNotebookId(this._notebook);
  }

  /**
   * Whether to constrain widget dimensions to the underlying content.
   */
  get fitToContent(): boolean {
    return this._fitToContent;
  }
  set fitToContent(newState: boolean) {
    this._fitToContent = newState;
  }

  /**
   * The cell the widget is generated from.
   */
  get cell(): CodeCell | MarkdownCell {
    return this._cell;
  }

  /**
   * The notebook the widget is generated from.
   */
  get notebook(): NotebookPanel {
    return this._notebook;
  }

  /**
   * The index of the cell in the notebook.
   */
  get index(): number {
    return this._cell
      ? ArrayExt.findFirstIndex(
          this._notebook.content.widgets,
          c => c === this._cell
        )
      : this._index;
  }

  /**
   * The path of the notebook for the cloned output area.
   */
  get path(): string {
    return this._notebook.context.path;
  }

  /**
   * The widget's display mode.
   */
  get mode(): Dashboard.Mode {
    return this._mode;
  }
  set mode(newMode: Dashboard.Mode) {
    this._mode = newMode;
    if (newMode === 'present') {
      this.removeClass(EDITABLE_WIDGET_CLASS);
    } else {
      this.addClass(EDITABLE_WIDGET_CLASS);
    }
    if (newMode === 'grid-edit') {
      if (this.parent) {
        (this.parent as Dashboard).updateWidget(this, this.pos);
      }
    }
  }

  /**
   * A signal emitted once the widget's content is added.
   */
  get ready(): ISignal<this, void> {
    return this._ready;
  }

  /**
   * Whether the widget can be moved during a resize.
   */
  get locked(): boolean {
    return this._locked;
  }
  set locked(newState: boolean) {
    this._locked = newState;
  }

  /**
   * The content of the widget.
   */
  get content(): Widget {
    return this._content;
  }
  set content(newContent: Widget) {
    this._content.dispose();
    this._content = newContent;
  }

  private _notebook: NotebookPanel;
  private _notebookId: string;
  private _index: number;
  private _cell: CodeCell | MarkdownCell | null = null;
  private _cellId: string;
  private _ready = new Signal<this, void>(this);
  private _fitToContent = false;
  private _mouseMode: DashboardWidget.MouseMode = 'none';
  private _mode: Dashboard.Mode = 'grid-edit';
  private _drag: Drag | null = null;
  private _clickData: {
    pressX: number;
    pressY: number;
    origWidth: number;
    origHeight: number;
    origLeft: number;
    origTop: number;
    target: HTMLElement;
    cell: CodeCell | MarkdownCell;
    widgetX: number;
    widgetY: number;
  } | null = null;
  private _locked = false;
  private _content: Widget;
  private _selectedResizer: DashboardWidget.ResizerCorner;
}

/**
 * Namespace for DashboardWidget options and constants.
 */
export namespace DashboardWidget {
  export interface IOptions {
    /**
     * The notebook associated with the cloned output area.
     */
    notebook: NotebookPanel;

    /**
     * The cell for which to clone the output area.
     */
    cell?: CodeCell | MarkdownCell;

    /**
     * If the cell is not available, provide the index
     * of the cell for when the notebook is loaded.
     */
    index?: number;

    /**
     * An optional cell id used for placeholder widgets.
     */
    cellId?: string;

    /**
     * An optional notebook id used for placeholder widgets.
     */
    notebookId?: string;

    /**
     * Whether to fit the widget to content when created.
     */
    fit?: boolean;
  }

  /**
   * A type for desccribing the direction of an overlap.
   */
  export type Direction = 'left' | 'right' | 'up' | 'down' | 'none';

  /**
   * A type for describing an overlap between two widgets.
   */
  export type Overlap = {
    widget: DashboardWidget;
    type: Direction;
  };

  /**
   * Create a unique widget id.
   */
  export function createDashboardWidgetId(): string {
    return `DashboardWidget-${UUID.uuid4()}`;
  }

  /**
   * A type for describing the corner for a widget resizer.
   */
  export type ResizerCorner =
    | 'top-left'
    | 'bottom-left'
    | 'top-right'
    | 'bottom-right';

  /**
   * Create a resizer element for a dashboard widget.
   */
  export function createResizer(corner: ResizerCorner): HTMLElement {
    const resizer = document.createElement('div');
    resizer.classList.add('pr-Resizer');

    switch (corner) {
      case 'top-left':
        resizer.classList.add('pr-ResizerTopLeft');
        break;
      case 'top-right':
        resizer.classList.add('pr-ResizerTopRight');
        break;
      case 'bottom-left':
        resizer.classList.add('pr-ResizerBottomLeft');
        break;
      case 'bottom-right':
        resizer.classList.add('pr-ResizerBottomRight');
        break;
      default:
        resizer.classList.add('pr-ResizerBottomRight');
        break;
    }

    return resizer;
  }

  /**
   * Create a dashboard widget based on a WidgetInfo object.
   *
   * @param options - the options used to create the widget.
   *
   * @param notebookTracker - a notebook tracker used to locate a
   * notebook/cell for the widget given a notebook/cell id.
   *
   * @param fit - whether to fit the new widget to its content.
   *
   * @returns - a new dashboard widget.
   */
  export function createWidget(
    options: Widgetstore.WidgetInfo,
    notebookTracker: INotebookTracker,
    fit = false
  ): DashboardWidget {
    const { notebookId, cellId, pos, widgetId } = options;

    const notebook = getNotebookById(notebookId, notebookTracker);

    let cell: CodeCell | MarkdownCell | undefined;
    const _cell = getCellById(cellId, notebookTracker);

    if (_cell === undefined) {
      cell = undefined;
    } else if (_cell.model.type === 'code') {
      cell = _cell as CodeCell;
    } else if (_cell.model.type === 'markdown') {
      cell = _cell as MarkdownCell;
    } else {
      throw new Error('cell is not a code or markdown cell');
    }

    const widget = new DashboardWidget({
      notebookId,
      cellId,
      notebook,
      cell,
      fit
    });

    widget.pos = pos;
    widget.id = widgetId;

    return widget;
  }

  /**
   * A type to describe the different kinds of mouseMoves that can occur
   * on a widget.
   */
  export type MouseMode = 'drag' | 'resize' | 'none';

  /**
   * Default width of added widgets.
   */
  export const DEFAULT_WIDTH = 500;

  /**
   * Default height of added widgets.
   */
  export const DEFAULT_HEIGHT = 500;

  /**
   * Minimum width of added widgets.
   */
  export const MIN_WIDTH = 10;

  /**
   * Minimum height of added widgets.
   */
  export const MIN_HEIGHT = 10;

  /**
   * How many pixels to adjust a widget by using the arrow keys.
   */
  export const BUMP_DISTANCE = 10;
}

/**
 * A namespace for private functionality.
 */
namespace Private {
  const DRAG_THRESHOLD = 5;

  /**
   * Detect if a drag event should be started. This is down if the
   * mouse is moved beyond a certain distance (DRAG_THRESHOLD).
   *
   * @param prevX - X Coordinate of the mouse pointer during the mousedown event
   *
   * @param prevY - Y Coordinate of the mouse pointer during the mousedown event
   *
   * @param nextX - Current X Coordinate of the mouse pointer
   *
   * @param nextY - Current Y Coordinate of the mouse pointer
   */
  export function shouldStartDrag(
    prevX: number,
    prevY: number,
    nextX: number,
    nextY: number
  ): boolean {
    const dx = Math.abs(nextX - prevX);
    const dy = Math.abs(nextY - prevY);
    return dx >= DRAG_THRESHOLD || dy >= DRAG_THRESHOLD;
  }
}

export default DashboardWidget;

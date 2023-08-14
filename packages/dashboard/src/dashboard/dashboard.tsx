import React from 'react';
import { CommandRegistry } from '@lumino/commands';
import { Token } from '@lumino/coreutils';
import { Widget } from '@lumino/widgets';
import { Message } from '@lumino/messaging';
import { IDragEvent } from '@lumino/dragdrop';
import { UUID } from '@lumino/coreutils';
import { DocumentWidget, DocumentRegistry, ABCWidgetFactory, IDocumentWidget } from '@jupyterlab/docregistry';
import { NotebookPanel } from '@jupyterlab/notebook';
import { CodeCell, MarkdownCell, Cell } from '@jupyterlab/cells';
import { map, toArray, each } from '@lumino/algorithm';
import { WidgetTracker, CommandToolbarButton, IWidgetTracker, Toolbar, ReactWidget } from '@jupyterlab/apputils';
import { HTMLSelect } from '@jupyterlab/ui-components';
import { DashboardLayout } from './layout';
import { DashboardWidget } from './widget';
import { WidgetPosition, WidgetStore } from './widgetStore';
import { addCellId, addNotebookId, getNotebookById, getCellId, updateMetadata } from './utils';
import { IDashboardModel, DashboardModel } from './model';
import { CommandIDs } from './commands';

// HTML element classes

export const DASHBOARD_CLASS = 'dsh-JupyterDashboard';

export const DROP_TARGET_CLASS = 'dsh-DropTarget';

export const TOOLBAR_MODE_SWITCHER_CLASS = 'dsh-ToolbarModeSwitcher';

export const TOOLBAR_SELECT_CLASS = 'dsh-ToolbarSelector';

export const TOOLBAR_CLASS = 'dsh-DashboardToolbar';

export const IDashboardTracker = new Token<IDashboardTracker>(
  'jupyterlab_interactive_dashboard_editor'
);

export type IDashboardTracker = IWidgetTracker<Dashboard>;

export class DashboardTracker extends WidgetTracker<Dashboard> {}

/**
 * Main content widget for the Dashboard widget.
 */
export class Dashboard extends Widget {
  constructor(options: Dashboard.IOptions) {
    super(options);

    this.id = UUID.uuid4();

    const { outputTracker, model } = options;
    this._model = model;
    this._context = options.context!;
    const { widgetStore, mode } = model;

    this.layout = new DashboardLayout({
      widgetStore,
      outputTracker,
      model,
      mode,
      width: options.dashboardWidth || Dashboard.DEFAULT_WIDTH,
      height: options.dashboardHeight || Dashboard.DEFAULT_HEIGHT
    });

    widgetStore.connectDashboard(this);

    this._model.loaded.connect(this.updateLayoutFromWidgetStore, this);

    this.addClass(DASHBOARD_CLASS);
  }

  /**
   * Create click listeners on attach
   */
  onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.node.addEventListener('lm-dragenter', this, true);
    this.node.addEventListener('lm-dragleave', this, true);
    this.node.addEventListener('lm-dragover', this, true);
    this.node.addEventListener('lm-drop', this, true);
    this.node.addEventListener('lm-dragend', this, true);
    this.node.addEventListener('scroll', this);
  }

  /**
   * Remove click listeners on detach
   */
  onBeforeDetach(msg: Message): void {
    super.onBeforeDetach(msg);
    this.node.removeEventListener('lm-dragenter', this, true);
    this.node.removeEventListener('lm-dragleave', this, true);
    this.node.removeEventListener('lm-dragover', this, true);
    this.node.removeEventListener('lm-drop', this, true);
    this.node.removeEventListener('scroll', this);
  }

  /**
   * Handle the `'lm-dragenter'` event for the widget.
   */
  private _evtDragEnter(event: IDragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Handle the `'lm-dragleave'` event for the widget.
   */
  private _evtDragLeave(event: IDragEvent): void {
    this.removeClass(DROP_TARGET_CLASS);
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Handle the `'lm-dragover'` event for the widget.
   */
  private _evtDragOver(event: IDragEvent): void {
    this.addClass(DROP_TARGET_CLASS);
    event.dropAction = 'copy';
    const source = event.source as DashboardWidget;
    const pos = source?.pos;
    if (pos && source.mode === 'grid-edit') {
      pos.left = event.offsetX + this.node.scrollLeft;
      pos.top = event.offsetY + this.node.scrollTop;
      (this.layout as DashboardLayout).drawDropZone(pos, '#2b98f0');
    }
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Handle the `'lm-drop'` event for the widget.
   */
  private _evtDrop(event: IDragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const left = event.offsetX + this.node.scrollLeft;
    const top = event.offsetY + this.node.scrollTop;

    if (event.proposedAction === 'move') {
      const widget = event.source as DashboardWidget;
      const oldDashboard = widget.parent as Dashboard;
      const width = widget.node.offsetWidth;
      const height = widget.node.offsetHeight;
      const pos = { left, top, width, height };

      if (oldDashboard === this) {
        // dragging in same dashboard.ono
        this.updateWidget(widget, pos);
      } else {
        // dragging between dashboards
        const info: WidgetStore.WidgetInfo = {
          widgetId: DashboardWidget.createDashboardWidgetId(),
          notebookId: widget.notebookId,
          cellId: widget.cellId,
          pos,
          removed: false
        };

        const newWidget = this.createWidget(info);
        this.addWidget(newWidget, pos);
        oldDashboard.deleteWidget(widget);
      }

      // dragging from notebook -> dashboard.
    } else if (event.proposedAction === 'copy') {
      const notebook = event.source.parent as NotebookPanel;
      let cell: Cell;
      if (event.source.activeCell instanceof MarkdownCell) {
        cell = notebook.content.activeCell as MarkdownCell;
      } else {
        cell = notebook.content.activeCell as CodeCell;
      }

      const info: WidgetStore.WidgetInfo = {
        widgetId: DashboardWidget.createDashboardWidgetId(),
        notebookId: addNotebookId(notebook),
        cellId: addCellId(cell),
        pos: {
          left,
          top,
          width: DashboardWidget.DEFAULT_WIDTH,
          height: DashboardWidget.DEFAULT_HEIGHT
        },
        removed: false
      };

      const newWidget = this.createWidget(info, true);
      this.addWidget(newWidget, info.pos);
    } else {
      return;
    }

    this.removeClass(DROP_TARGET_CLASS);
  }

  handleEvent(event: Event): void {
    switch (event.type) {
      case 'scroll':
        this._evtScroll(event);
        break;
      case 'lm-dragenter':
        this._evtDragEnter(event as IDragEvent);
        break;
      case 'lm-dragleave':
        this._evtDragLeave(event as IDragEvent);
        break;
      case 'lm-dragover':
        this._evtDragOver(event as IDragEvent);
        break;
      case 'lm-drop':
        this._evtDrop(event as IDragEvent);
        break;
    }
  }

  private _evtScroll(_event: Event): void {
    const model = this.model;

    if (model.scrollMode !== 'infinite') {
      return;
    }

    const elem = this.node;
    const rightEdge = elem.offsetWidth + elem.scrollLeft;
    const bottomEdge = elem.offsetHeight + elem.scrollTop;

    if (rightEdge >= model.width && rightEdge > this._oldRightEdge) {
      model.width += 200;
    }
    if (bottomEdge >= model.height && bottomEdge > this._oldBottomEdge) {
      model.height += 200;
    }

    this._oldBottomEdge = bottomEdge;
    this._oldRightEdge = rightEdge;
  }

  /**
   * Add a widget to the layout.
   *
   * @param widget - the widget to add.
   */
  addWidget(widget: DashboardWidget, pos: WidgetStore.WidgetPosition): void {
    (this.layout as DashboardLayout).addWidget(widget, pos);
  }

  updateWidget(
    widget: DashboardWidget,
    pos: WidgetStore.WidgetPosition
  ): boolean {
    return (this.layout as DashboardLayout).updateWidget(widget, pos);
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
    (this.layout as DashboardLayout).removeWidget(widget);
  }

  /**
   * Remove a widget from the layout.
   *
   * @param widget - the widget to remove.
   *
   */
  deleteWidget(widget: DashboardWidget): boolean {
    return (this.layout as DashboardLayout).deleteWidget(widget);
  }

  /**
   * Adds a dashboard widget's information to the widgetStore.
   *
   * @param info - the information to add to the widgetStore.
   */
  updateWidgetInfo(info: WidgetStore.WidgetInfo): void {
    (this.layout as DashboardLayout).updateWidgetInfo(info);
  }

  /**
   * Mark a widget as deleted in the widgetStore.
   *
   * @param widget - the widget to mark as deleted.
   */
  deleteWidgetInfo(widget: DashboardWidget): void {
    (this.layout as DashboardLayout).deleteWidgetInfo(widget);
  }

  /**
   * Update a widgetStore entry for a widget given that widget.
   *
   * @param widget - the widget to update from.
   */
  updateInfoFromWidget(widget: DashboardWidget): void {
    (this.layout as DashboardLayout).updateInfoFromWidget(widget);
  }

  /**
   * Updates the layout based on the state of the datastore.
   */
  updateLayoutFromWidgetStore(): void {
    (this.layout as DashboardLayout).updateLayoutFromWidgetStore();
  }

  /**
   * Undo the last change to the layout.
   */
  undo(): void {
    (this.layout as DashboardLayout).undo();
  }

  /**
   * Redo the last change to the layout.
   */
  redo(): void {
    (this.layout as DashboardLayout).redo();
  }

  createWidget(info: WidgetStore.WidgetInfo, fit?: boolean): DashboardWidget {
    return (this.layout as DashboardLayout).createWidget(info, fit);
  }

  saveToNotebookMetadata(): void {
    // Get a list of all notebookIds used in the dashboard.
    const widgets = Array.from(this.model.widgetStore.getWidgets());

    const notebookIds = toArray(map(widgets, record => record.notebookId));

    if (!notebookIds.every(v => v === notebookIds[0])) {
      throw new Error(
        'Only single notebook dashboards can be saved to metadata.'
      );
    }

    const notebookId = notebookIds[0];
    const notebookTracker = this.model.notebookTracker;
    const notebook = getNotebookById(notebookId, notebookTracker);

    updateMetadata(notebook!, { hasDashboard: true });

    const cells = notebook!.content.widgets;

    const widgetMap = new Map<string, WidgetPosition>(
      widgets.map(widget => [widget.cellId, widget.pos])
    );

    each(cells, cell => {
      const cellId = getCellId(cell);
      const pos = widgetMap.get(cellId!);
      if (pos != null) {
        updateMetadata(cell, { pos, hidden: false });
      } else {
        updateMetadata(cell, { hidden: true });
      }
    });

    notebook?.context.save();
  }

  get model(): IDashboardModel {
    return this._model;
  }

  get context(): DocumentRegistry.IContext<DocumentRegistry.IModel> {
    return this._context;
  }

  private _model: IDashboardModel;
  private _context: DocumentRegistry.IContext<DocumentRegistry.IModel>;
  private _oldRightEdge = 0;
  private _oldBottomEdge = 0;
}

/**
 * Namespace for DashboardArea options.
 */
export namespace Dashboard {
  export type Mode = 'free-edit' | 'present' | 'grid-edit';

  export type ScrollMode = 'infinite' | 'constrained';

  export const DEFAULT_WIDTH = 1920;

  export const DEFAULT_HEIGHT = 1080;

  export interface IOptions extends Widget.IOptions {
    /**
     * Tracker for child widgets.
     */
    outputTracker: WidgetTracker<DashboardWidget>;

    /**
     * Dashboard name.
     */
    name?: string;

    store?: WidgetStore;

    dashboardWidth?: number;

    dashboardHeight?: number;

    model: IDashboardModel;

    context?: DocumentRegistry.IContext<DocumentRegistry.IModel>;
  }
}

export class DashboardDocument extends DocumentWidget<Dashboard> {
  constructor(options: DashboardDocument.IOptions) {
    let { content, reveal } = options;
    const { context, commandRegistry } = options;
    const model = context.model as DashboardModel;
    model.path = context.path;
    content = content || new Dashboard({ ...options, model, context });
    reveal = Promise.all([reveal, context.ready]);
    super({
      ...options,
      content: content as Dashboard,
      reveal
    });

    // Build the toolbar

    this.toolbar.addClass(TOOLBAR_CLASS);

    const commands = commandRegistry;
    const { save, undo, redo, cut, copy, paste } = CommandIDs;

    const args = { toolbar: true, dashboardId: content.id };

    const makeToolbarButton = (
      id: string,
      tooltip: string
    ): CommandToolbarButton => {
      const button = new CommandToolbarButton({ args, commands, id });
      button.node.title = tooltip;
      return button;
    };

    const saveButton = makeToolbarButton(save, 'Save');
    const undoButton = makeToolbarButton(undo, 'Undo');
    const redoButton = makeToolbarButton(redo, 'Redo');
    const cutButton = makeToolbarButton(cut, 'Cut the selected outputs');
    const copyButton = makeToolbarButton(copy, 'Copy the selected outputs');
    const pasteButton = makeToolbarButton(
      paste,
      'Paste outputs from the clipboard'
    );

    this.toolbar.addItem(save, saveButton);
    this.toolbar.addItem(undo, undoButton);
    this.toolbar.addItem(redo, redoButton);
    this.toolbar.addItem(cut, cutButton);
    this.toolbar.addItem(copy, copyButton);
    this.toolbar.addItem(paste, pasteButton);
    this.toolbar.addItem('spacer', Toolbar.createSpacerItem());
    this.toolbar.addItem(
      'switchMode',
      new DashboardDocument.DashboardModeSwitcher(content as Dashboard)
    );
  }
}

export namespace DashboardDocument {
  export interface IOptions extends DocumentWidget.IOptionsOptionalContent {
    /**
     * Tracker for child widgets.
     */
    outputTracker: WidgetTracker<DashboardWidget>;

    /**
     * Command registry for building the toolbar.
     */
    commandRegistry: CommandRegistry;

    /**
     * Dashboard name.
     */
    name?: string;

    /**
     * Optional widgetStore to restore from.
     */
    store?: WidgetStore;

    /**
     * Dashboard canvas width (default is 1280).
     */
    dashboardWidth?: number;

    /**
     * Dashboard canvas height (default is 720).
     */
    dashboardHeight?: number;
  }

  export class DashboardModeSwitcher extends ReactWidget {
    constructor(dashboard: Dashboard) {
      super();
      this.addClass(TOOLBAR_MODE_SWITCHER_CLASS);
      this._dashboard = dashboard;

      if (dashboard.model) {
        this.update();
      }

      dashboard.model.stateChanged.connect((_sender, change) => {
        if (change.name === 'mode') {
          this.update();
        }
      }, this);
    }

    private _handleChange(
      that: DashboardModeSwitcher
    ): (event: React.ChangeEvent<HTMLSelectElement>) => void {
      return (event: React.ChangeEvent<HTMLSelectElement>): void => {
        that.dashboard.model.mode = event.target.value as Dashboard.Mode;
      };
    }

    render(): JSX.Element {
      const value = this._dashboard.model.mode;
      return (
        <HTMLSelect
          className={TOOLBAR_SELECT_CLASS}
          onChange={this._handleChange(this)}
          value={value}
          aria-label={'Mode'}
        >
          <option value="present">Present</option>
          {/* <option value="free-edit">Free Layout</option> */}
          <option value="grid-edit">Edit</option>
        </HTMLSelect>
      );
    }

    get dashboard(): Dashboard {
      return this._dashboard;
    }

    private _dashboard: Dashboard;
  }
}

export class DashboardDocumentFactory extends ABCWidgetFactory<DashboardDocument> {
  constructor(options: DashboardDocumentFactory.IOptions) {
    super(options);
    this._commandRegistry = options.commandRegistry;
    this._outputTracker = options.outputTracker;
  }

  createNewWidget(context: DocumentRegistry.Context): DashboardDocument {
    return new DashboardDocument({
      context,
      commandRegistry: this._commandRegistry,
      outputTracker: this._outputTracker
    });
  }

  private _commandRegistry: CommandRegistry;
  private _outputTracker: WidgetTracker<DashboardWidget>;
}

export namespace DashboardDocumentFactory {
  export interface IOptions
    extends DocumentRegistry.IWidgetFactoryOptions<IDocumentWidget> {
    commandRegistry: CommandRegistry;
    outputTracker: WidgetTracker<DashboardWidget>;
  }
}

/**
 * CURRENTLY UNUSED
 *
 * Opens a visual HTMLElement in fullscreen.
 *
 * @param node- the element to open in fullscreen.
 */
export function openfullscreen(node: HTMLElement): void {
  // Trigger fullscreen
  const docElmWithBrowsersFullScreenFunctions = node as HTMLElement & {
    mozRequestFullScreen(): Promise<void>;
    webkitRequestFullscreen(): Promise<void>;
    msRequestFullscreen(): Promise<void>;
  };

  if (docElmWithBrowsersFullScreenFunctions.requestFullscreen) {
    docElmWithBrowsersFullScreenFunctions.requestFullscreen();
  } else if (docElmWithBrowsersFullScreenFunctions.mozRequestFullScreen) {
    /* Firefox */
    docElmWithBrowsersFullScreenFunctions.mozRequestFullScreen();
  } else if (docElmWithBrowsersFullScreenFunctions.webkitRequestFullscreen) {
    /* Chrome, Safari and Opera */
    docElmWithBrowsersFullScreenFunctions.webkitRequestFullscreen();
  } else if (docElmWithBrowsersFullScreenFunctions.msRequestFullscreen) {
    /* IE/Edge */
    docElmWithBrowsersFullScreenFunctions.msRequestFullscreen();
  }

}

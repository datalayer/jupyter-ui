/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { PromiseDelegate } from '@lumino/coreutils';
import { IDisposable } from '@lumino/disposable';
import { Panel, Widget as LuminoWidget } from '@lumino/widgets';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { DOMWidgetModel } from '@jupyter-widgets/base';
import { LabWidgetManager } from './manager';

/**
 * A renderer for widgets.
 */
export class WidgetLabRenderer
  extends Panel
  implements IRenderMime.IRenderer, IDisposable
{
  constructor(
    options: IRenderMime.IRendererOptions,
    manager?: LabWidgetManager
  ) {
    super();
    this.mimeType = options.mimeType;
    if (manager) {
      this.manager = manager;
    }
  }

  /**
   * The widget manager.
   */
  set manager(value: LabWidgetManager) {
    value.restored.connect(this._rerender, this);
    this._manager.resolve(value);
  }

  async renderModel(model: IRenderMime.IMimeModel): Promise<void> {
    const source: any = model.data[this.mimeType];

    // Let's be optimistic, and hope the widget state will come later.
    this.node.textContent = 'Loading widget...';

    const manager = await this._manager.promise;
    // If there is no model id, the view was removed, so hide the node.
    if (source.model_id === '') {
      this.hide();
      return Promise.resolve();
    }

    let wModel: DOMWidgetModel;
    try {
      // Presume we have a DOMWidgetModel. Should we check for sure?
      wModel = (await manager.get_model(source.model_id)) as DOMWidgetModel;
    } catch (err) {
      if (manager.restoredStatus) {
        // The manager has been restored, so this error won't be going away.
        //        this.node.textContent = 'Error displaying widget: model not found';
        this.node.textContent =
          'Please run the cell to display the IPyWidgets.';
        this.addClass('jupyter-widgets');
        console.error(err);
        return;
      }

      // Store the model for a possible rerender
      this._rerenderMimeModel = model;
      return;
    }

    // Successful getting the model, so we don't need to try to rerender.
    this._rerenderMimeModel = null;

    let widget: LuminoWidget;
    try {
      widget = (await manager.create_view(wModel)).luminoWidget;
    } catch (err) {
      this.node.textContent = 'Error displaying widget';
      this.addClass('jupyter-widgets');
      console.error(err);
      return;
    }

    // Clear any previous loading message.
    this.node.textContent = '';
    this.addWidget(widget);

    // When the widget is disposed, hide this container and make sure we
    // change the output model to reflect the view was closed.
    widget.disposed.connect(() => {
      this.hide();
      source.model_id = '';
    });
  }

  /**
   * Dispose the resources held by the manager.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._manager = null!;
    super.dispose();
  }

  private _rerender(): void {
    if (this._rerenderMimeModel) {
      // Clear the error message
      this.node.textContent = '';
      this.removeClass('jupyter-widgets');
      // Attempt to rerender.
      this.renderModel(this._rerenderMimeModel);
    }
  }

  /**
   * The mimetype being rendered.
   */
  readonly mimeType: string;
  private _manager = new PromiseDelegate<LabWidgetManager>();
  private _rerenderMimeModel: IRenderMime.IMimeModel | null = null;
}

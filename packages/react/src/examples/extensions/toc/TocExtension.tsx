/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { NotebookPanel, NotebookToCFactory } from '@jupyterlab/notebook';
import {
  TableOfContents,
  TableOfContentsRegistry,
  TableOfContentsTracker,
} from '@jupyterlab/toc';
import { BoxPanel } from '@lumino/widgets';
import {
  NotebookExtension,
  INotebookExtensionProps,
  notebookStore2,
} from '../../../components';
import { JupyterLayoutFactory } from './JupyterLayoutFactory';

/**
 * A factory to layout ToC Panel
 */
export interface TocLayoutFactory {
  /** layout ToC Panel */
  layout(
    boxPanel: BoxPanel,
    notebookPanel: NotebookPanel,
    notebookId: string
  ): JSX.Element | null;
  /** set model to ToC Panel */
  setModel(model: TableOfContents.Model): void;
  /** dispose ToC Panel */
  dispose(): void;
}

export interface TocExtensionOptions {
  /** layout factory */
  factory?: TocLayoutFactory;
}

/** Table of Contents Extension */
export class TocExtension implements NotebookExtension {
  private _props: INotebookExtensionProps;
  private _tocRegistry: TableOfContentsRegistry;
  private _tocTracker: TableOfContentsTracker;
  private _layoutFactory: TocLayoutFactory;
  private _notebookPanel: NotebookPanel;

  constructor(options: TocExtensionOptions) {
    this._layoutFactory = options.factory ?? new JupyterLayoutFactory();
  }

  init(props: INotebookExtensionProps) {
    this._props = props;

    this._tocRegistry = new TableOfContentsRegistry();
    this._tocTracker = new TableOfContentsTracker();
  }

  createNew(notebookPanel: NotebookPanel) {
    this._notebookPanel = notebookPanel;
    const adapter = this._props.adapter;
    // create factory
    const tracker = adapter!['_tracker'];
    const rendermime = adapter!['_rendermime'];
    const nbTocFactory = new NotebookToCFactory(
      tracker!,
      rendermime!.markdownParser,
      rendermime!.sanitizer
    );
    this._tocRegistry.add(nbTocFactory);

    notebookPanel.context.ready.then(() => {
      // retrieve model
      let model = this._tocTracker?.get(notebookPanel);
      if (!model) {
        const configuration = { ...TableOfContents.defaultConfig };
        model =
          this._tocRegistry?.getModel(notebookPanel, configuration) ?? null;
        if (model) {
          this._tocTracker?.add(notebookPanel, model);
        }
        notebookPanel.disposed.connect(() => {
          model?.dispose();
        });
      }

      if (model) {
        notebookStore2
          .getState()
          .changeTocModel({ id: this._props.notebookId, tocModel: model });
        this._layoutFactory.setModel(model);
      }
    });

    notebookPanel.disposed.connect(() => {
      this._layoutFactory.dispose();
    });
  }

  get component(): JSX.Element | null {
    return this._layoutFactory.layout(
      this._props.adapter!.panel,
      this._notebookPanel,
      this._props.notebookId
    );
  }
}

export default TocExtension;

/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { VDomRenderer, Toolbar, ToolbarButton } from '@jupyterlab/apputils';
import { KernelMessage, Kernel } from '@jupyterlab/services';
import {
  caretDownIcon,
  caretRightIcon,
  closeIcon,
  jsonIcon,
} from '@jupyterlab/ui-components';
import { UUID } from '@lumino/coreutils';
import { Message as luminoMessage } from '@lumino/messaging';
import { Widget, BoxLayout } from '@lumino/widgets';
import {
  ObjectInspector,
  ObjectLabel,
  InspectorNodeParams,
} from 'react-inspector';
import { KernelSpyModel, ThreadIterator } from './model';

import './kernelinspector.css';

const theme = {
  BASE_FONT_FAMILY: 'var(--jp-code-font-family)',
  BASE_FONT_SIZE: 'var(--jp-code-font-size)',
  BASE_LINE_HEIGHT: 'var(--jp-code-line-height)',

  BASE_BACKGROUND_COLOR: 'var(--jp-layout-color0)',
  BASE_COLOR: 'var(--jp-content-font-color1)',

  OBJECT_NAME_COLOR: 'var(--jp-mirror-editor-attribute-color)',
  OBJECT_VALUE_NULL_COLOR: 'var(--jp-mirror-editor-builtin-color)',
  OBJECT_VALUE_UNDEFINED_COLOR: 'var(--jp-mirror-editor-builtin-color)',
  OBJECT_VALUE_REGEXP_COLOR: 'var(--jp-mirror-editor-string-color)',
  OBJECT_VALUE_STRING_COLOR: 'var(--jp-mirror-editor-string-color)',
  OBJECT_VALUE_SYMBOL_COLOR: 'var(--jp-mirror-editor-operator-color)',
  OBJECT_VALUE_NUMBER_COLOR: 'var(--jp-mirror-editor-number-color)',
  OBJECT_VALUE_BOOLEAN_COLOR: 'var(--jp-mirror-editor-builtin-color))',
  OBJECT_VALUE_FUNCTION_KEYWORD_COLOR: 'var(--jp-mirror-editor-def-color))',

  ARROW_COLOR: 'var(--jp-content-font-color2)',
  ARROW_MARGIN_RIGHT: 3,
  ARROW_FONT_SIZE: 12,

  TREENODE_FONT_FAMILY: 'var(--jp-code-font-family)',
  TREENODE_FONT_SIZE: 'var(--jp-code-font-size)',
  TREENODE_LINE_HEIGHT: 'var(--jp-code-line-height)',
  TREENODE_PADDING_LEFT: 12,
};

function msgNodeRenderer(args: InspectorNodeParams) {
  const { name, depth, isNonenumerable, data } = args;
  if (depth !== 0) {
    return (
      <ObjectLabel
        key={'node-label'}
        name={name}
        data={data}
        isNonenumerable={isNonenumerable}
      />
    );
  }
  const msg = (data as unknown) as KernelMessage.IMessage;
  return <span key={'node-label'}>{msg.header.msg_id}</span>;
}

function Message(props: Message.IProperties): React.ReactElement<any>[] {
  const msg = props.message;
  const msgId = msg.header.msg_id;
  const threadStateClass = props.collapsed ? 'jp-mod-collapsed' : '';
  const collapserIcon = props.hasChildren
    ? props.collapsed
      ? caretRightIcon
      : caretDownIcon
    : null;
  const hasChildrenClass = props.hasChildren ? 'jp-mod-children' : '';
  const tabIndex = props.hasChildren ? 0 : -1;
  return [
    <div
      key={`threadnode-${msgId}`}
      className="dla-KernelInspector-threadnode"
      onClick={() => {
        props.onCollapse(props.message);
      }}
    >
      <div style={{ paddingLeft: 16 * props.depth }}>
        <button
          className={`dla-KernelInspector-threadcollapser ${threadStateClass} ${hasChildrenClass}`}
          tabIndex={tabIndex}
        >
          {collapserIcon && (
            <collapserIcon.react className={'kspy-collapser-icon'} />
          )}
        </button>
        <span className="dla-KernelInspector-threadlabel">
          {msg.channel}.{msg.header.msg_type}
        </span>
      </div>
    </div>,
    <div key={`message-${msgId}`} className="dla-KernelInspector-message">
      <ObjectInspector
        data={msg}
        theme={theme as any}
        nodeRenderer={msgNodeRenderer}
      />
    </div>,
  ];
}

namespace Message {
  export interface IProperties {
    message: KernelMessage.IMessage;
    depth: number;
    collapsed: boolean;
    hasChildren: boolean;
    onCollapse: (message: KernelMessage.IMessage) => void;
  }
}

/**
 * The main view for the kernel spy.
 */
export class MessageLogView extends VDomRenderer<KernelSpyModel> {
  constructor(model: KernelSpyModel) {
    super(model);
    this.id = `kernelspy-messagelog-${UUID.uuid4()}`;
    this.addClass('dla-KernelInspector-messagelog');
  }

  /**
   * Render the extension discovery view using the virtual DOM.
   */
  protected render(): React.ReactElement<any>[] {
    const model = this.model!;
    const elements: React.ReactElement<any>[] = [];

    elements.push(
      <span key="header-thread" className="dla-KernelInspector-logheader">
        Threads
      </span>,
      <span key="header-contents" className="dla-KernelInspector-logheader">
        Contents
      </span>,
      <span
        key="header-divider"
        className="dla-KernelInspector-logheader dla-KernelInspector-divider"
      />
    );

    const threads = new ThreadIterator(model.tree, this.collapsed);

    let first = true;
    for (const thread of threads) {
      if (thread) {
        const depth = model.depth(thread.args);
        if (depth === 0) {
          if (first) {
            first = false;
          } else {
            // Insert spacer between main threads
            elements.push(
              <span
                key={`'divider-${thread.args.msg.header.msg_id}`}
                className="dla-KernelInspector-divider"
              />
            );
          }
        }
        const collapsed = this.collapsed[thread.args.msg.header.msg_id];
        elements.push(
          ...Message({
            message: thread.args.msg,
            depth,
            collapsed,
            hasChildren: thread.hasChildren,
            onCollapse: message => {
              this.onCollapse(message);
            },
          })
        );
      }
    }
    return elements;
  }

  collapseAll() {
    for (const args of this.model!.log) {
      this.collapsed[args.msg.header.msg_id] = true;
    }
    this.update();
  }

  expandAll() {
    this.collapsed = {};
    this.update();
  }

  onCollapse(msg: KernelMessage.IMessage) {
    const id = msg.header.msg_id;
    this.collapsed[id] = !this.collapsed[id];
    this.update();
  }

  protected collapsed: { [key: string]: boolean } = {};
}

/**
 * The main view for the kernel spy.
 */
export class KernelSpyView extends Widget {
  constructor(kernel?: Kernel.IKernelConnection | null) {
    super();
    this._model = new KernelSpyModel(kernel);
    this.addClass('dla-KernelInspector-view');
    this.id = `kernelspy-${UUID.uuid4()}`;
    this.title.label = 'Kernel spy';
    this.title.closable = true;
    this.title.icon = jsonIcon;

    const layout = (this.layout = new BoxLayout());

    this._toolbar = new Toolbar();
    this._toolbar.addClass('dla-KernelInspector-toolbar');

    this._messagelog = new MessageLogView(this._model);

    layout.addWidget(this._toolbar);
    layout.addWidget(this._messagelog);

    BoxLayout.setStretch(this._toolbar, 0);
    BoxLayout.setStretch(this._messagelog, 1);

    this.collapseAllButton = new ToolbarButton({
      onClick: () => {
        this._messagelog.collapseAll();
      },
      className: 'dla-KernelInspector-collapseAll',
      icon: caretRightIcon,
      tooltip: 'Collapse all threads',
    });
    this._toolbar.addItem('collapse-all', this.collapseAllButton);

    this.expandAllButton = new ToolbarButton({
      onClick: () => {
        this._messagelog.expandAll();
      },
      className: 'dla-KernelInspector-expandAll',
      icon: caretDownIcon,
      tooltip: 'Expand all threads',
    });
    this._toolbar.addItem('expand-all', this.expandAllButton);

    this.clearAllButton = new ToolbarButton({
      onClick: () => {
        this._model.clear();
      },
      className: 'dla-KernelInspector-clearAll',
      icon: closeIcon,
      tooltip: 'Clear all threads',
    });
    this._toolbar.addItem('clear-all', this.clearAllButton);
  }

  /**
   * Handle `'activate-request'` messages.
   */
  protected onActivateRequest(msg: luminoMessage): void {
    if (!this.node.contains(document.activeElement)) {
      this.collapseAllButton.node.focus();
    }
  }

  get model(): KernelSpyModel {
    return this._model;
  }

  private _toolbar: Toolbar<Widget>;
  private _messagelog: MessageLogView;

  private _model: KernelSpyModel;

  protected clearAllButton: ToolbarButton;
  protected expandAllButton: ToolbarButton;
  protected collapseAllButton: ToolbarButton;
}

/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module spaceItem
 * @description Data models and interfaces for spaces and documents.
 * Defines the structure of items displayed in the spaces tree view.
 */

import * as vscode from 'vscode';
import * as path from 'path';

export enum ItemType {
  ROOT = 'root',
  SPACE = 'space',
  NOTEBOOK = 'notebook',
  DOCUMENT = 'document',
  FOLDER = 'folder',
  CELL = 'cell',
  LOADING = 'loading',
  ERROR = 'error',
}

export interface Space {
  uid: string;
  handle_s: string;
  variant_s?: string;
  name_t: string;
  description_t?: string;
  tags_ss?: string[];
  items?: Document[];
  members?: any[];
}

export interface Document {
  id: string;
  uid: string;
  type_s: string;
  name_t: string;
  description_t?: string;
  creator_uid?: string;
  creator_handle_s?: string;
  public_b?: boolean;

  // For notebooks
  notebook_name_s?: string;
  notebook_extension_s?: string;
  notebook_format_s?: string;

  // For documents
  document_name_s?: string;
  document_extension_s?: string;
  document_format_s?: string;

  // Common fields
  content_length_i?: number;
  content_type_s?: string;
  mime_type_s?: string;
  s3_path_s?: string;
  s3_url_s?: string;
  cdn_url_s?: string;
  creation_ts_dt?: string;
  last_update_ts_dt?: string;
}

export interface SpaceItemData {
  type: ItemType;
  space?: Space;
  document?: Document;
  error?: string;
  username?: string;
  githubLogin?: string;
  spaceName?: string;
}

export class SpaceItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly data: SpaceItemData,
    public readonly parent?: SpaceItem,
  ) {
    super(label, collapsibleState);
    this.tooltip = this.getTooltip();
    this.contextValue = data.type;
    this.iconPath = this.getIcon();
    this.command = this.getCommand();
  }

  private getTooltip(): string | undefined {
    switch (this.data.type) {
      case ItemType.ROOT:
        return `Datalayer Spaces${this.data.username ? ` - ${this.data.username}` : ''}`;
      case ItemType.SPACE:
        return this.data.space?.description_t || this.data.space?.name_t;
      case ItemType.NOTEBOOK:
      case ItemType.DOCUMENT:
        if (this.data.document) {
          const lastMod = this.data.document.last_update_ts_dt
            ? new Date(this.data.document.last_update_ts_dt).toLocaleString()
            : this.data.document.creation_ts_dt
              ? new Date(this.data.document.creation_ts_dt).toLocaleString()
              : 'Unknown';
          return `${this.data.document.name_t}\nLast modified: ${lastMod}`;
        }
        return this.label;
      case ItemType.ERROR:
        return this.data.error;
      default:
        return undefined;
    }
  }

  private getIcon(): vscode.ThemeIcon | undefined {
    switch (this.data.type) {
      case ItemType.ROOT:
        return new vscode.ThemeIcon('menu');
      case ItemType.SPACE:
        if (this.data.space?.variant_s === 'default') {
          return new vscode.ThemeIcon('library');
        }
        return new vscode.ThemeIcon('folder');
      case ItemType.NOTEBOOK:
        return new vscode.ThemeIcon('notebook');
      case ItemType.DOCUMENT:
        return this.getDocumentIcon();
      case ItemType.FOLDER:
        return new vscode.ThemeIcon('folder');
      case ItemType.CELL:
        return new vscode.ThemeIcon('code');
      case ItemType.LOADING:
        return new vscode.ThemeIcon('loading~spin');
      case ItemType.ERROR:
        return new vscode.ThemeIcon('error');
      default:
        return undefined;
    }
  }

  private getDocumentIcon(): vscode.ThemeIcon {
    if (!this.data.document) {
      return new vscode.ThemeIcon('file');
    }

    // Check the document type/extension
    const fileName = this.data.document.name_t || '';
    const docExtension = this.data.document.document_extension_s;
    const docFormat = this.data.document.document_format_s;

    // Check for lexical documents
    if (docExtension === 'lexical' || docFormat === 'lexical') {
      return new vscode.ThemeIcon('file-text');
    }

    const ext =
      path.extname(fileName).toLowerCase() ||
      (docExtension ? `.${docExtension}` : '');
    switch (ext) {
      case '.py':
        return new vscode.ThemeIcon('file-code');
      case '.ipynb':
        return new vscode.ThemeIcon('notebook');
      case '.md':
        return new vscode.ThemeIcon('markdown');
      case '.json':
        return new vscode.ThemeIcon('json');
      case '.csv':
        return new vscode.ThemeIcon('table');
      case '.txt':
      case '.lexical':
        return new vscode.ThemeIcon('file-text');
      case '.pdf':
        return new vscode.ThemeIcon('file-pdf');
      case '.png':
      case '.jpg':
      case '.jpeg':
      case '.gif':
      case '.svg':
        return new vscode.ThemeIcon('file-media');
      default:
        return new vscode.ThemeIcon('file');
    }
  }

  private getCommand(): vscode.Command | undefined {
    if (this.data.type === ItemType.NOTEBOOK && this.data.document) {
      return {
        command: 'datalayer.openDocument',
        title: 'Open Notebook',
        arguments: [this.data.document, this.data.spaceName],
      };
    } else if (this.data.type === ItemType.DOCUMENT && this.data.document) {
      return {
        command: 'datalayer.openDocument',
        title: 'Open Document',
        arguments: [this.data.document, this.data.spaceName],
      };
    } else if (this.data.type === ItemType.CELL && this.data.document) {
      return {
        command: 'datalayer.openDocument',
        title: 'Open Cell',
        arguments: [this.data.document, this.data.spaceName],
      };
    } else if (this.data.type === ItemType.ERROR) {
      return {
        command: 'datalayer.refreshSpaces',
        title: 'Retry',
      };
    }
    return undefined;
  }
}

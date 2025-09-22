/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module spaceItem
 * Data models and interfaces for spaces and documents.
 * Defines the structure of items displayed in the spaces tree view.
 */

import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Types of items that can appear in the spaces tree.
 * @enum {string}
 */
export enum ItemType {
  /** Root node of the tree */
  ROOT = 'root',
  /** Space container */
  SPACE = 'space',
  /** Jupyter notebook document */
  NOTEBOOK = 'notebook',
  /** Generic document */
  DOCUMENT = 'document',
  /** Folder container */
  FOLDER = 'folder',
  /** Notebook cell */
  CELL = 'cell',
  /** Loading indicator */
  LOADING = 'loading',
  /** Error state */
  ERROR = 'error',
}

/**
 * Represents a Datalayer space.
 * @interface Space
 */
export interface Space {
  /** Unique identifier */
  uid: string;
  /** Handle string identifier */
  handle_s: string;
  /** Space variant (e.g., 'default') */
  variant_s?: string;
  /** Space name */
  name_t: string;
  /** Space description */
  description_t?: string;
  /** Tags associated with the space */
  tags_ss?: string[];
  /** Documents contained in the space */
  items?: Document[];
  /** Space members */
  members?: any[];
}

/**
 * Represents a document in a Datalayer space.
 * @interface Document
 */
export interface Document {
  /** Document ID */
  id: string;
  /** Document UID */
  uid: string;
  /** Document type */
  type_s: string;
  /** Document name */
  name_t: string;
  /** Document description */
  description_t?: string;
  /** Creator's UID */
  creator_uid?: string;
  /** Creator's handle */
  creator_handle_s?: string;
  /** Whether the document is public */
  public_b?: boolean;

  // For notebooks
  /** Notebook file name */
  notebook_name_s?: string;
  /** Notebook file extension */
  notebook_extension_s?: string;
  /** Notebook format */
  notebook_format_s?: string;

  // For documents
  /** Document file name */
  document_name_s?: string;
  /** Document file extension */
  document_extension_s?: string;
  /** Document format */
  document_format_s?: string;

  // Common fields
  /** Content size in bytes */
  content_length_i?: number;
  /** Content MIME type */
  content_type_s?: string;
  /** MIME type */
  mime_type_s?: string;
  /** S3 storage path */
  s3_path_s?: string;
  /** S3 URL */
  s3_url_s?: string;
  /** CDN URL */
  cdn_url_s?: string;
  /** Creation timestamp */
  creation_ts_dt?: string;
  /** Last update timestamp */
  last_update_ts_dt?: string;
}

/**
 * Data associated with a space tree item.
 * @interface SpaceItemData
 */
export interface SpaceItemData {
  /** Type of the tree item */
  type: ItemType;
  /** Space data (for SPACE type) */
  space?: Space;
  /** Document data (for NOTEBOOK/DOCUMENT types) */
  document?: Document;
  /** Error message (for ERROR type) */
  error?: string;
  /** Username of the authenticated user */
  username?: string;
  /** GitHub login of the authenticated user */
  githubLogin?: string;
  /** Name of the containing space */
  spaceName?: string;
}

/**
 * Tree item representing a space or document in the explorer.
 * @class SpaceItem
 * @extends {vscode.TreeItem}
 */
export class SpaceItem extends vscode.TreeItem {
  /**
   * Creates a new SpaceItem.
   * @param {string} label - Display label
   * @param {vscode.TreeItemCollapsibleState} collapsibleState - Collapse state
   * @param {SpaceItemData} data - Associated data
   * @param {SpaceItem} [parent] - Parent item
   */
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

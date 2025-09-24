/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module spacesTreeProvider
 * Tree data provider for the Datalayer spaces view.
 * Displays user's spaces and documents in a hierarchical tree structure.
 */

import * as vscode from 'vscode';
import {
  SpaceItem,
  ItemType,
  SpaceItemData,
  Space,
  Document,
} from './spaceItem';
import { SpacerApiService } from './spacerApiService';
import { AuthService } from '../auth/authService';

/**
 * Tree data provider for the Datalayer Spaces view.
 */
export class SpacesTreeProvider implements vscode.TreeDataProvider<SpaceItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    SpaceItem | undefined | null | void
  > = new vscode.EventEmitter<SpaceItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    SpaceItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private authService: AuthService;
  private apiService: SpacerApiService;
  private spacesCache: Map<string, Space[]> = new Map();
  private itemsCache: Map<string, Document[]> = new Map();

  /**
   * Creates a new SpacesTreeProvider.
   * @param {vscode.ExtensionContext} context - Extension context
   */
  constructor(private context: vscode.ExtensionContext) {
    this.authService = AuthService.getInstance();
    this.apiService = SpacerApiService.getInstance();
  }

  /**
   * Refreshes the entire tree view.
   */
  refresh(): void {
    console.log('[SpacesTree] Refreshing tree...');
    this.spacesCache.clear();
    this.itemsCache.clear();
    this._onDidChangeTreeData.fire();
  }

  /**
   * Refreshes a specific space in the tree.
   * @param {string} spaceId - ID of the space to refresh
   */
  refreshSpace(spaceId: string): void {
    console.log(`[SpacesTree] Refreshing space: ${spaceId}`);
    // Clear both the items cache and spaces cache to ensure fresh data
    this.itemsCache.delete(spaceId);
    this.spacesCache.clear(); // Clear spaces cache to get fresh items data
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: SpaceItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: SpaceItem): Promise<SpaceItem[]> {
    const authState = this.authService.getAuthState();

    // Root level - check authentication
    if (!element) {
      if (!authState.isAuthenticated) {
        return [
          new SpaceItem(
            'Not logged in - Click to login',
            vscode.TreeItemCollapsibleState.None,
            {
              type: ItemType.ERROR,
              error: 'Click to login to Datalayer',
            },
          ),
        ];
      }

      // Get username or GitHub login for display
      const user = authState.user as any;
      const displayName = user?.githubLogin
        ? `@${user.githubLogin}`
        : user?.name || user?.email || 'User';

      return [
        new SpaceItem(
          `Datalayer (${displayName})`,
          vscode.TreeItemCollapsibleState.Expanded,
          {
            type: ItemType.ROOT,
            username: displayName,
            githubLogin: user?.githubLogin,
          },
        ),
      ];
    }

    // Handle different node types
    switch (element.data.type) {
      case ItemType.ROOT:
        return this.getSpaces();
      case ItemType.SPACE:
        if (element.data.space) {
          return this.getSpaceItems(element.data.space);
        }
        break;
      case ItemType.FOLDER:
        // For folders, we could implement subfolder logic here
        break;
    }

    return [];
  }

  private async getSpaces(): Promise<SpaceItem[]> {
    try {
      // Check cache first
      let spaces: Space[];
      if (this.spacesCache.has('user')) {
        spaces = this.spacesCache.get('user')!;
      } else {
        // Show loading state
        this._onDidChangeTreeData.fire();

        spaces = await this.apiService.getUserSpaces();
        this.spacesCache.set('user', spaces);
      }

      if (spaces.length === 0) {
        return [
          new SpaceItem(
            'No spaces found',
            vscode.TreeItemCollapsibleState.None,
            {
              type: ItemType.ERROR,
              error: 'No spaces available',
            },
          ),
        ];
      }

      // Sort spaces: default space first, then alphabetically
      spaces.sort((a, b) => {
        if (a.variant_s === 'default') {
          return -1;
        }
        if (b.variant_s === 'default') {
          return 1;
        }
        return (a.name_t || '').localeCompare(b.name_t || '');
      });

      return spaces.map(space => {
        console.log('[SpacesTree] Creating tree item for space:', space);
        const spaceName = space.name_t || 'Unnamed Space';
        const label =
          space.variant_s === 'default' ? `${spaceName} (Default)` : spaceName;
        return new SpaceItem(label, vscode.TreeItemCollapsibleState.Collapsed, {
          type: ItemType.SPACE,
          space: space,
        });
      });
    } catch (error) {
      console.error('[SpacesTree] Error fetching spaces:', error);
      return [
        new SpaceItem(
          'Failed to load spaces',
          vscode.TreeItemCollapsibleState.None,
          {
            type: ItemType.ERROR,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        ),
      ];
    }
  }

  private async getSpaceItems(space: Space): Promise<SpaceItem[]> {
    try {
      const spaceId = space.uid;

      if (!spaceId) {
        console.error(
          '[SpacesTree] No valid space ID found in space object:',
          space,
        );
        return [
          new SpaceItem(
            'Unable to load items - invalid space ID',
            vscode.TreeItemCollapsibleState.None,
            {
              type: ItemType.ERROR,
              error: 'Space ID is missing',
            },
          ),
        ];
      }

      console.log('[SpacesTree] Getting items for space ID:', spaceId);

      // The items are already included in the space response
      let items: Document[] = space.items || [];

      // If items array is not present, try fetching from API
      if (!space.items) {
        if (this.itemsCache.has(spaceId)) {
          items = this.itemsCache.get(spaceId)!;
        } else {
          console.log(
            '[SpacesTree] Items not in space object, fetching from API...',
          );
          items = await this.apiService.getSpaceItems(spaceId);
          this.itemsCache.set(spaceId, items);
        }
      } else {
        console.log(
          '[SpacesTree] Using items from space object:',
          items.length,
          'items found',
        );
      }

      if (items.length === 0) {
        return [
          new SpaceItem(
            'No items found',
            vscode.TreeItemCollapsibleState.None,
            {
              type: ItemType.ERROR,
              error: 'This space is empty',
            },
          ),
        ];
      }

      // Filter for notebooks, lexical documents, and cells only
      const notebooks = items.filter(
        item =>
          item.type_s === 'notebook' || item.notebook_extension_s === 'ipynb',
      );

      const lexicalDocuments = items.filter(
        item =>
          item.document_format_s === 'lexical' ||
          item.document_extension_s === 'lexical' ||
          (item.type_s === 'document' && item.document_format_s === 'lexical'),
      );

      const cells = items.filter(item => item.type_s === 'cell');

      const result: SpaceItem[] = [];

      // Add notebooks
      notebooks.forEach(notebook => {
        const notebookName =
          notebook.name_t || notebook.notebook_name_s || 'Untitled';
        // Add .ipynb extension if not already present
        const displayName = notebookName.endsWith('.ipynb')
          ? notebookName
          : `${notebookName}.ipynb`;
        result.push(
          new SpaceItem(displayName, vscode.TreeItemCollapsibleState.None, {
            type: ItemType.NOTEBOOK,
            document: notebook,
            spaceName: space.name_t || 'Unnamed Space',
          }),
        );
      });

      // Add lexical documents only
      lexicalDocuments.forEach(doc => {
        const docName = doc.name_t || doc.document_name_s || 'Untitled';
        // Add .lexical extension if not already present
        const displayName = docName.endsWith('.lexical')
          ? docName
          : `${docName}.lexical`;
        result.push(
          new SpaceItem(displayName, vscode.TreeItemCollapsibleState.None, {
            type: ItemType.DOCUMENT,
            document: doc,
            spaceName: space.name_t || 'Unnamed Space',
          }),
        );
      });

      // Add cells
      cells.forEach(cell => {
        const cellName = cell.name_t || 'Untitled Cell';
        result.push(
          new SpaceItem(cellName, vscode.TreeItemCollapsibleState.None, {
            type: ItemType.CELL,
            document: cell,
            spaceName: space.name_t || 'Unnamed Space',
          }),
        );
      });

      // If we filtered everything out, show a message
      if (result.length === 0 && items.length > 0) {
        return [
          new SpaceItem(
            'No notebooks, lexical documents, or cells found',
            vscode.TreeItemCollapsibleState.None,
            {
              type: ItemType.ERROR,
              error: 'This space contains other document types',
            },
          ),
        ];
      }

      return result;
    } catch (error) {
      console.error('[SpacesTree] Error fetching space items:', error);
      return [
        new SpaceItem(
          'Failed to load documents',
          vscode.TreeItemCollapsibleState.None,
          {
            type: ItemType.ERROR,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        ),
      ];
    }
  }

  getParent(element: SpaceItem): vscode.ProviderResult<SpaceItem> {
    return element.parent;
  }
}

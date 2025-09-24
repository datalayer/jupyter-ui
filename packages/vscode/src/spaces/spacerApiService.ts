/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module spacerApiService
 * API service for interacting with the Datalayer platform.
 * Manages spaces, documents, and notebooks.
 * Provides methods for CRUD operations on spaces and their content.
 */

import * as vscode from 'vscode';
import { AuthService } from '../auth/authService';
import { Space, Document } from './spaceItem';

/**
 * Response structure for spaces API.
 * @interface SpacesResponse
 */
export interface SpacesResponse {
  /** Whether the request was successful */
  success: boolean;
  /** Optional message from the API */
  message?: string;
  /** Array of spaces */
  data?: Space[];
}

/**
 * Response structure for space items API.
 * @interface SpaceItemsResponse
 */
export interface SpaceItemsResponse {
  /** Whether the request was successful */
  success: boolean;
  /** Optional message from the API */
  message?: string;
  /** Array of documents in the space */
  data?: Document[];
}

/**
 * Response structure for notebook API operations.
 * @interface NotebookResponse
 */
export interface NotebookResponse {
  /** Whether the request was successful */
  success: boolean;
  /** Optional message from the API */
  message?: string;
  /** Document data */
  data?: Document;
}

/**
 * API service for interacting with Datalayer spaces.
 * @class SpacerApiService
 */
export class SpacerApiService {
  private static instance: SpacerApiService;
  private authService: AuthService;

  private constructor() {
    this.authService = AuthService.getInstance();
  }

  /**
   * Gets the singleton instance of SpacerApiService.
   * @returns {SpacerApiService} The singleton instance
   */
  static getInstance(): SpacerApiService {
    if (!SpacerApiService.instance) {
      SpacerApiService.instance = new SpacerApiService();
    }
    return SpacerApiService.instance;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  private async fetchWithAuth(url: string, options?: any): Promise<Response> {
    try {
      // Don't set Content-Type if body is FormData
      const headers = { ...this.getAuthHeaders() };
      if (options?.body instanceof FormData) {
        delete headers['Content-Type']; // Let browser set it with boundary
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options?.headers,
        },
      });

      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }

      return response;
    } catch (error) {
      console.error(`[SpacerAPI] Request failed: ${url}`, error);
      throw error;
    }
  }

  /**
   * Get all spaces for the authenticated user
   */
  async getUserSpaces(): Promise<Space[]> {
    const serverUrl = this.authService.getServerUrl();
    const url = `${serverUrl}/api/spacer/v1/spaces/users/me`;

    console.log('[SpacerAPI] Fetching user spaces from:', url);

    try {
      const response = await this.fetchWithAuth(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          '[SpacerAPI] Failed to fetch spaces:',
          response.status,
          errorText,
        );
        throw new Error(`Failed to fetch spaces: ${response.status}`);
      }

      const data = (await response.json()) as any;
      console.log('[SpacerAPI] Spaces response:', data);
      console.log(
        '[SpacerAPI] Spaces array:',
        JSON.stringify(data.spaces, null, 2),
      );

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch spaces');
      }

      // The API returns 'spaces' property, not 'data'
      const spaces = data.spaces || [];

      // Log the first space to understand its structure
      if (spaces.length > 0) {
        console.log(
          '[SpacerAPI] First space structure:',
          JSON.stringify(spaces[0], null, 2),
        );
        console.log(
          '[SpacerAPI] Space keys:',
          Object.keys(spaces[0]).join(', '),
        );

        // Log each key and its value to find the ID field
        Object.keys(spaces[0]).forEach(key => {
          console.log(`[SpacerAPI] Space field "${key}":`, spaces[0][key]);
        });
      }

      return spaces;
    } catch (error) {
      console.error('[SpacerAPI] Error fetching spaces:', error);
      if (
        error instanceof Error &&
        error.message.includes('Not authenticated')
      ) {
        vscode.window
          .showErrorMessage('Please login to Datalayer to view spaces', 'Login')
          .then(selection => {
            if (selection === 'Login') {
              vscode.commands.executeCommand('datalayer.login');
            }
          });
      }
      throw error;
    }
  }

  /**
   * Get all items in a specific space
   */
  async getSpaceItems(spaceId: string): Promise<Document[]> {
    const serverUrl = this.authService.getServerUrl();
    const url = `${serverUrl}/api/spacer/v1/spaces/${spaceId}/items`;

    console.log('[SpacerAPI] Fetching space items from:', url);

    try {
      const response = await this.fetchWithAuth(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          '[SpacerAPI] Failed to fetch space items:',
          response.status,
          errorText,
        );
        throw new Error(`Failed to fetch space items: ${response.status}`);
      }

      const data = (await response.json()) as any;
      console.log('[SpacerAPI] Space items response:', data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch space items');
      }

      // Check for 'items' or 'data' property
      return data.items || data.data || [];
    } catch (error) {
      console.error('[SpacerAPI] Error fetching space items:', error);
      throw error;
    }
  }

  /**
   * Get items of a specific type in a space
   */
  async getSpaceItemsByType(
    spaceId: string,
    type: string,
  ): Promise<Document[]> {
    const serverUrl = this.authService.getServerUrl();
    const url = `${serverUrl}/api/spacer/v1/spaces/${spaceId}/items/types/${type}`;

    console.log('[SpacerAPI] Fetching space items by type from:', url);

    try {
      const response = await this.fetchWithAuth(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          '[SpacerAPI] Failed to fetch space items by type:',
          response.status,
          errorText,
        );
        throw new Error(`Failed to fetch space items: ${response.status}`);
      }

      const data = (await response.json()) as any;
      console.log('[SpacerAPI] Space items by type response:', data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch space items');
      }

      // Check for 'items' or 'data' property
      return data.items || data.data || [];
    } catch (error) {
      console.error('[SpacerAPI] Error fetching space items by type:', error);
      throw error;
    }
  }

  /**
   * Get notebook details
   */
  async getNotebookDetails(notebookId: string): Promise<Document | undefined> {
    const serverUrl = this.authService.getServerUrl();
    const url = `${serverUrl}/api/spacer/v1/notebooks/${notebookId}`;

    console.log('[SpacerAPI] Fetching notebook details from:', url);

    try {
      const response = await this.fetchWithAuth(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          '[SpacerAPI] Failed to fetch notebook:',
          response.status,
          errorText,
        );
        throw new Error(`Failed to fetch notebook: ${response.status}`);
      }

      const data = (await response.json()) as NotebookResponse;
      console.log('[SpacerAPI] Notebook details response:', data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch notebook');
      }

      return data.data;
    } catch (error) {
      console.error('[SpacerAPI] Error fetching notebook:', error);
      throw error;
    }
  }

  /**
   * Get notebook content from CDN URL or API
   */
  async getNotebookContent(document: Document): Promise<any> {
    // First try to use the CDN URL if available
    if (document.cdn_url_s) {
      console.log(
        '[SpacerAPI] Fetching notebook content from CDN:',
        document.cdn_url_s,
      );

      try {
        const response = await this.fetchWithAuth(document.cdn_url_s);

        if (!response.ok) {
          console.warn('[SpacerAPI] CDN fetch failed, falling back to API');
        } else {
          const data = await response.json();
          console.log(
            '[SpacerAPI] Notebook content fetched from CDN successfully',
          );
          return data;
        }
      } catch (error) {
        console.warn(
          '[SpacerAPI] CDN fetch error, falling back to API:',
          error,
        );
      }
    }

    // Fall back to API endpoint
    const serverUrl = this.authService.getServerUrl();
    const url = `${serverUrl}/api/spacer/v1/notebooks/${document.uid}/content`;

    console.log('[SpacerAPI] Fetching notebook content from API:', url);

    try {
      const response = await this.fetchWithAuth(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          '[SpacerAPI] Failed to fetch notebook content:',
          response.status,
          errorText,
        );
        throw new Error(`Failed to fetch notebook content: ${response.status}`);
      }

      const data = await response.json();
      console.log('[SpacerAPI] Notebook content fetched from API successfully');

      return data;
    } catch (error) {
      console.error('[SpacerAPI] Error fetching notebook content:', error);
      throw error;
    }
  }

  /**
   * Get document content from CDN URL or API
   */
  async getDocumentContent(document: Document): Promise<any> {
    // First try to use the CDN URL if available
    if (document.cdn_url_s) {
      console.log(
        '[SpacerAPI] Fetching document content from CDN:',
        document.cdn_url_s,
      );

      try {
        const response = await this.fetchWithAuth(document.cdn_url_s);

        if (!response.ok) {
          console.warn('[SpacerAPI] CDN fetch failed, falling back to API');
        } else {
          const contentType = response.headers.get('content-type') || '';

          // Check if it's JSON content
          if (contentType.includes('application/json')) {
            const data = await response.json();
            console.log(
              '[SpacerAPI] Document content fetched from CDN successfully',
            );
            return data;
          } else {
            // For text or other content types
            const text = await response.text();
            console.log(
              '[SpacerAPI] Document text content fetched from CDN successfully',
            );
            return text;
          }
        }
      } catch (error) {
        console.warn(
          '[SpacerAPI] CDN fetch error, falling back to API:',
          error,
        );
      }
    }

    // Fall back to API endpoint based on document type
    const serverUrl = this.authService.getServerUrl();
    const endpoint = document.type_s === 'notebook' ? 'notebooks' : 'documents';
    const url = `${serverUrl}/api/spacer/v1/${endpoint}/${document.uid}/content`;

    console.log('[SpacerAPI] Fetching document content from API:', url);

    try {
      const response = await this.fetchWithAuth(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          '[SpacerAPI] Failed to fetch document content:',
          response.status,
          errorText,
        );
        throw new Error(`Failed to fetch document content: ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        const data = await response.json();
        console.log(
          '[SpacerAPI] Document content fetched from API successfully',
        );
        return data;
      } else {
        const text = await response.text();
        console.log(
          '[SpacerAPI] Document text content fetched from API successfully',
        );
        return text;
      }
    } catch (error) {
      console.error('[SpacerAPI] Error fetching document content:', error);
      throw error;
    }
  }

  /**
   * Get collaboration session ID for lexical documents
   * For lexical documents, the document UID is used directly as the session ID
   * Note: This is different from notebooks which may have a separate session endpoint
   */
  async getLexicalCollaborationSessionId(documentId: string): Promise<{
    /** Whether the request was successful */
    success: boolean;
    /** Session ID for collaboration */
    sessionId?: string;
    /** Error message if failed */
    error?: string;
  }> {
    // For Lexical documents in Datalayer, the document UID IS the session ID
    console.log(
      `[SpacerAPI] Using document UID as lexical collaboration session ID: ${documentId}`,
    );

    return {
      success: true,
      sessionId: documentId,
    };
  }

  /**
   * Create a new notebook in a space
   */
  async createNotebook(
    spaceId: string,
    name: string,
    description?: string,
    notebookType: string = 'jupyter',
  ): Promise<Document | undefined> {
    const serverUrl = this.authService.getServerUrl();
    // Using the notebooks endpoint with spaceId parameter
    const url = `${serverUrl}/api/spacer/v1/notebooks`;

    console.log('[SpacerAPI] Creating notebook at:', url);

    try {
      // Create FormData for multipart/form-data request
      const formData = new FormData();
      formData.append('spaceId', spaceId); // Changed from space_uid to spaceId
      formData.append('name', name);
      formData.append('notebookType', 'jupyter'); // Required field - type of notebook
      formData.append('description', description || ''); // Required field - can be empty

      const response = await this.fetchWithAuth(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          '[SpacerAPI] Failed to create notebook:',
          response.status,
          errorText,
        );
        throw new Error(`Failed to create notebook: ${response.status}`);
      }

      const data = (await response.json()) as any;
      console.log('[SpacerAPI] Create notebook response:', data);

      if (data.success === false) {
        throw new Error(data.message || 'Failed to create notebook');
      }

      return data.notebook || data.data || data;
    } catch (error) {
      console.error('[SpacerAPI] Error creating notebook:', error);
      throw error;
    }
  }

  /**
   * Create a new space
   */
  async createSpace(
    name: string,
    description?: string,
    isPublic: boolean = false,
  ): Promise<Space | undefined> {
    const serverUrl = this.authService.getServerUrl();
    const url = `${serverUrl}/api/spacer/v1/spaces`;

    console.log('[SpacerAPI] Creating space at:', url);

    // Generate a handle from the name (lowercase with spaces as hyphens)
    const spaceHandle = name.toLowerCase().replace(/\s+/g, '-');

    try {
      // Spaces endpoint expects application/json
      const response = await this.fetchWithAuth(url, {
        method: 'POST',
        body: JSON.stringify({
          name: name,
          spaceHandle: spaceHandle,
          description: description || '',
          public: isPublic,
          variant: 'standard', // Required field - typically 'standard' for user-created spaces
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          '[SpacerAPI] Failed to create space:',
          response.status,
          errorText,
        );
        throw new Error(`Failed to create space: ${response.status}`);
      }

      const data = (await response.json()) as any;
      console.log('[SpacerAPI] Create space response:', data);

      if (data.success === false) {
        throw new Error(data.message || 'Failed to create space');
      }

      return data.space || data.data || data;
    } catch (error) {
      console.error('[SpacerAPI] Error creating space:', error);
      throw error;
    }
  }

  /**
   * Create a new lexical document in a space
   */
  async createLexicalDocument(
    spaceId: string,
    name: string,
    description?: string,
  ): Promise<Document | undefined> {
    const serverUrl = this.authService.getServerUrl();
    // Using the lexicals endpoint
    const url = `${serverUrl}/api/spacer/v1/lexicals`;

    console.log('[SpacerAPI] Creating lexical document at:', url);

    try {
      // Create FormData for multipart/form-data request
      const formData = new FormData();
      formData.append('spaceId', spaceId); // Changed from space_uid to spaceId
      formData.append('name', name);
      formData.append('documentType', 'lexical'); // Required field for lexical documents
      formData.append('description', description || ''); // Required field - can be empty

      const response = await this.fetchWithAuth(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          '[SpacerAPI] Failed to create lexical document:',
          response.status,
          errorText,
        );
        throw new Error(
          `Failed to create lexical document: ${response.status}`,
        );
      }

      const data = (await response.json()) as any;
      console.log('[SpacerAPI] Create lexical document response:', data);

      if (data.success === false) {
        throw new Error(data.message || 'Failed to create lexical document');
      }

      return data.lexical || data.document || data.data || data;
    } catch (error) {
      console.error('[SpacerAPI] Error creating lexical document:', error);
      throw error;
    }
  }

  /**
   * Update an item's name
   */
  async updateItemName(
    itemId: string,
    itemType: 'notebook' | 'document',
    newName: string,
    description?: string,
  ): Promise<boolean> {
    const serverUrl = this.authService.getServerUrl();
    // Use 'notebooks' for notebooks and 'lexicals' for lexical documents
    const endpoint = itemType === 'notebook' ? 'notebooks' : 'lexicals';
    const url = `${serverUrl}/api/spacer/v1/${endpoint}/${itemId}`;

    console.log('[SpacerAPI] Updating item name at:', url);

    try {
      // Use PUT method for updates
      const response = await this.fetchWithAuth(url, {
        method: 'PUT',
        body: JSON.stringify({
          name: newName,
          description: description || '', // API requires description field
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          '[SpacerAPI] Failed to update item name:',
          response.status,
          errorText,
        );
        throw new Error(`Failed to update item name: ${response.status}`);
      }

      const data = (await response.json()) as any;
      console.log('[SpacerAPI] Update item name response:', data);

      return data.success !== false;
    } catch (error) {
      console.error('[SpacerAPI] Error updating item name:', error);
      throw error;
    }
  }

  /**
   * Delete an item from a space
   */
  async deleteItem(itemId: string): Promise<boolean> {
    const serverUrl = this.authService.getServerUrl();
    // Use the spaces/items endpoint for deleting items
    const url = `${serverUrl}/api/spacer/v1/spaces/items/${itemId}`;

    console.log('[SpacerAPI] Deleting item at:', url);

    try {
      const response = await this.fetchWithAuth(url, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          '[SpacerAPI] Failed to delete item:',
          response.status,
          errorText,
        );
        throw new Error(`Failed to delete item: ${response.status}`);
      }

      // DELETE might return empty response
      if (
        response.headers.get('content-length') === '0' ||
        response.status === 204
      ) {
        return true;
      }

      const data = (await response.json()) as any;
      console.log('[SpacerAPI] Delete item response:', data);

      return data.success !== false;
    } catch (error) {
      console.error('[SpacerAPI] Error deleting item:', error);
      throw error;
    }
  }
}

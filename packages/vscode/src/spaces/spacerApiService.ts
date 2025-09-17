/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module spacerApiService
 * @description API service for interacting with the Datalayer platform.
 * Manages spaces, documents, and notebooks.
 * Provides methods for CRUD operations on spaces and their content.
 */

import * as vscode from 'vscode';
import { AuthService } from '../auth/authService';
import { Space, Document } from './spaceItem';

export interface SpacesResponse {
  success: boolean;
  message?: string;
  data?: Space[];
}

export interface SpaceItemsResponse {
  success: boolean;
  message?: string;
  data?: Document[];
}

export interface NotebookResponse {
  success: boolean;
  message?: string;
  data?: Document;
}

export class SpacerApiService {
  private static instance: SpacerApiService;
  private authService: AuthService;

  private constructor() {
    this.authService = AuthService.getInstance();
  }

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
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
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
   * Create a new notebook in a space
   */
  async createNotebook(
    spaceId: string,
    name: string,
    description?: string,
    notebookType: string = 'jupyter',
  ): Promise<Document | undefined> {
    const serverUrl = this.authService.getServerUrl();
    const url = `${serverUrl}/api/spacer/v1/notebooks`;

    console.log('[SpacerAPI] Creating notebook at:', url);

    try {
      const response = await this.fetchWithAuth(url, {
        method: 'POST',
        body: JSON.stringify({
          spaceId,
          name,
          description: description || '',
          notebookType,
        }),
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

      const data = (await response.json()) as NotebookResponse;
      console.log('[SpacerAPI] Create notebook response:', data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to create notebook');
      }

      return data.data;
    } catch (error) {
      console.error('[SpacerAPI] Error creating notebook:', error);
      throw error;
    }
  }
}

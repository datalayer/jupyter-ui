/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module spacerApiService
 * @description API service for interacting with the Datalayer platform.
 * Manages spaces, documents, notebooks, and runtime environments.
 * Provides methods for CRUD operations and runtime lifecycle management.
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

export interface RuntimeResponse {
  uid: string;
  given_name?: string;
  status?: string;
  pod_name?: string;
  ingress?: string; // The actual field name from API
  token?: string; // The actual field name from API
  credits_limit?: number;
  credits_used?: number;
  type?: string;
  environment_name?: string;
  environment_title?: string;
  burning_rate?: number;
  reservation_id?: string;
  started_at?: string;
  expired_at?: string;
}

export interface CreateRuntimeResponse {
  success: boolean;
  message?: string;
  runtime?: RuntimeResponse;
}

export interface ListRuntimesResponse {
  success: boolean;
  message?: string;
  runtimes?: RuntimeResponse[];
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

  /**
   * List all available runtimes for the user
   */
  async listRuntimes(): Promise<RuntimeResponse[]> {
    const serverUrl = this.authService.getServerUrl();
    const url = `${serverUrl}/api/runtimes/v1/runtimes`;

    console.log('[SpacerAPI] Fetching runtimes from:', url);

    try {
      const response = await this.fetchWithAuth(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          '[SpacerAPI] Failed to fetch runtimes:',
          response.status,
          errorText,
        );
        throw new Error(`Failed to fetch runtimes: ${response.status}`);
      }

      const data = (await response.json()) as any;
      console.log('[SpacerAPI] Runtimes response:', data);

      // The API returns runtimes in a wrapper object
      if (data.runtimes && Array.isArray(data.runtimes)) {
        return data.runtimes;
      }

      // Fallback: if it's already an array, return it
      if (Array.isArray(data)) {
        return data;
      }

      // No runtimes found
      return [];
    } catch (error) {
      console.error('[SpacerAPI] Error fetching runtimes:', error);
      throw error;
    }
  }

  /**
   * Create a new runtime
   */
  async createRuntime(
    creditsLimit: number = 10,
    type: 'notebook' | 'cell' = 'notebook',
    givenName?: string,
    environmentName?: string,
  ): Promise<RuntimeResponse | undefined> {
    const serverUrl = this.authService.getServerUrl();
    const url = `${serverUrl}/api/runtimes/v1/runtimes`;

    console.log('[SpacerAPI] Creating runtime at:', url);

    try {
      const body: any = {
        credits_limit: creditsLimit,
        type: type,
      };

      if (givenName) {
        body.given_name = givenName;
      }

      if (environmentName) {
        body.environment_name = environmentName;
      }

      const response = await this.fetchWithAuth(url, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          '[SpacerAPI] Failed to create runtime:',
          response.status,
          errorText,
        );
        throw new Error(`Failed to create runtime: ${response.status}`);
      }

      const data = (await response.json()) as any;
      console.log(
        '[SpacerAPI] Create runtime response:',
        JSON.stringify(data, null, 2),
      );

      // The API returns the runtime wrapped in an object
      if (data.success && data.runtime) {
        console.log(
          '[SpacerAPI] Extracted runtime:',
          JSON.stringify(data.runtime, null, 2),
        );
        return data.runtime as RuntimeResponse;
      }

      // Fallback if it's already the runtime object
      if (data.uid) {
        return data as RuntimeResponse;
      }

      console.error('[SpacerAPI] Unexpected runtime response structure:', data);
      return undefined;
    } catch (error) {
      console.error('[SpacerAPI] Error creating runtime:', error);
      throw error;
    }
  }

  /**
   * Get a specific runtime by pod name
   */
  async getRuntime(podName: string): Promise<RuntimeResponse | undefined> {
    const serverUrl = this.authService.getServerUrl();
    const url = `${serverUrl}/api/runtimes/v1/runtimes/${podName}`;

    console.log('[SpacerAPI] Fetching runtime from:', url);

    try {
      const response = await this.fetchWithAuth(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          '[SpacerAPI] Failed to fetch runtime:',
          response.status,
          errorText,
        );
        throw new Error(`Failed to fetch runtime: ${response.status}`);
      }

      const data = (await response.json()) as any;
      console.log(
        '[SpacerAPI] Raw runtime fetch response:',
        JSON.stringify(data, null, 2),
      );

      // The API returns the runtime as "kernel" when fetching a single runtime
      if (data.success && data.kernel) {
        console.log(
          '[SpacerAPI] Extracted kernel (runtime) from wrapper:',
          JSON.stringify(data.kernel, null, 2),
        );
        return data.kernel as RuntimeResponse;
      }

      console.warn('[SpacerAPI] Unexpected runtime response format:', data);
      return undefined;
    } catch (error) {
      console.error('[SpacerAPI] Error fetching runtime:', error);
      throw error;
    }
  }

  /**
   * Get or create a runtime for notebook execution
   */
  async ensureRuntime(): Promise<RuntimeResponse | undefined> {
    try {
      // Get configuration values
      const vscode = await import('vscode');
      const config = vscode.workspace.getConfiguration('datalayer.runtime');
      const creditsLimit = config.get<number>('creditsLimit', 10);
      const environmentName = config.get<string>(
        'environment',
        'python-cpu-env',
      );

      console.log('[SpacerAPI] Runtime configuration:', {
        creditsLimit,
        environmentName,
      });

      // First, check if there are existing runtimes
      const runtimes = await this.listRuntimes();

      // Look for an active runtime with the same environment
      const activeRuntime = runtimes.find(
        r =>
          (r.status === 'running' || r.status === 'ready') &&
          (!r.environment_name || r.environment_name === environmentName),
      );

      if (activeRuntime) {
        console.log(
          '[SpacerAPI] Using existing runtime:',
          activeRuntime.pod_name,
        );
        return activeRuntime;
      }

      // No active runtime found, create a new one with configuration
      console.log('[SpacerAPI] No active runtime found, creating new one...');
      console.log(
        `[SpacerAPI] Using environment: ${environmentName}, credits limit: ${creditsLimit}`,
      );

      const runtime = await this.createRuntime(
        creditsLimit,
        'notebook',
        'VSCode Notebook Runtime',
        environmentName,
      );

      if (runtime) {
        console.log('[SpacerAPI] Created new runtime:', runtime.pod_name);

        // Wait for runtime to initialize and get URL/token
        if (runtime.pod_name) {
          // Try to get updated runtime info with retries
          let retries = 0;
          const maxRetries = 5;
          const retryDelay = 3000; // 3 seconds between retries

          while (retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));

            try {
              const updatedRuntime = await this.getRuntime(runtime.pod_name);
              if (updatedRuntime?.ingress && updatedRuntime?.token) {
                console.log(
                  '[SpacerAPI] Runtime initialized with URL:',
                  updatedRuntime.ingress,
                );
                return updatedRuntime;
              }
              console.log(
                `[SpacerAPI] Runtime not ready yet, retry ${retries + 1}/${maxRetries}`,
              );
            } catch (error) {
              console.warn('[SpacerAPI] Error checking runtime status:', error);
            }

            retries++;
          }

          // Return the original runtime if we couldn't get updated info
          console.warn('[SpacerAPI] Runtime may not be fully initialized');
          return runtime;
        }
      }

      return runtime;
    } catch (error) {
      console.error('[SpacerAPI] Error ensuring runtime:', error);
      throw error;
    }
  }
}

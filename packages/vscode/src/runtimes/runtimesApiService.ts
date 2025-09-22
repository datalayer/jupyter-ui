/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module runtimesApiService
 * API service for managing Datalayer runtime environments.
 * Handles runtime creation, listing, monitoring, and lifecycle management.
 * Provides methods for interacting with the Datalayer runtimes API.
 */

import * as vscode from 'vscode';
import { AuthService } from '../auth/authService';

/**
 * Response structure for a Datalayer runtime.
 * @interface RuntimeResponse
 */
export interface RuntimeResponse {
  /** Unique identifier for the runtime */
  uid: string;
  /** User-provided name for the runtime */
  given_name?: string;
  /** Current status of the runtime (e.g., 'running', 'ready') */
  status?: string;
  /** Kubernetes pod name */
  pod_name?: string;
  /** Runtime ingress URL (actual field name from API) */
  ingress?: string;
  /** Runtime authentication token (actual field name from API) */
  token?: string;
  /** Maximum credits allocated for this runtime */
  credits_limit?: number;
  /** Credits consumed so far */
  credits_used?: number;
  /** Type of runtime (e.g., 'notebook', 'cell') */
  type?: string;
  /** Environment name (e.g., 'python-cpu-env') */
  environment_name?: string;
  /** Human-readable environment title */
  environment_title?: string;
  /** Rate of credit consumption */
  burning_rate?: number;
  /** Reservation identifier */
  reservation_id?: string;
  /** Runtime start timestamp */
  started_at?: string;
  /** Runtime expiration timestamp */
  expired_at?: string;
}

/**
 * Response structure for runtime creation API.
 * @interface CreateRuntimeResponse
 */
export interface CreateRuntimeResponse {
  /** Whether the creation was successful */
  success: boolean;
  /** Optional message from the API */
  message?: string;
  /** Created runtime details */
  runtime?: RuntimeResponse;
}

/**
 * Response structure for listing runtimes API.
 * @interface ListRuntimesResponse
 */
export interface ListRuntimesResponse {
  /** Whether the request was successful */
  success: boolean;
  /** Optional message from the API */
  message?: string;
  /** Array of available runtimes */
  runtimes?: RuntimeResponse[];
}

/**
 * API service for managing Datalayer runtime environments.
 * Provides methods for runtime lifecycle management and monitoring.
 *
 * @class RuntimesApiService
 */
export class RuntimesApiService {
  private static instance: RuntimesApiService;
  private authService: AuthService;

  private constructor(context?: vscode.ExtensionContext) {
    this.authService = AuthService.getInstance(context);
  }

  /**
   * Gets the singleton instance of RuntimesApiService.
   * @param {vscode.ExtensionContext} [context] - Extension context (required on first call)
   * @returns {RuntimesApiService} The singleton instance
   */
  static getInstance(context?: vscode.ExtensionContext): RuntimesApiService {
    if (!RuntimesApiService.instance) {
      RuntimesApiService.instance = new RuntimesApiService(context);
    }
    return RuntimesApiService.instance;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('Not authenticated - no token available');
    }

    // Log token info for debugging (just first/last few chars for security)
    const tokenPreview =
      token.length > 10
        ? `${token.substring(0, 5)}...${token.substring(token.length - 5)}`
        : 'short_token';
    console.log('[RuntimesAPI] Using token:', tokenPreview);
    console.log('[RuntimesAPI] Token length:', token.length);

    // Check if token looks like a JWT (should have 3 parts separated by dots)
    const tokenParts = token.split('.');
    console.log('[RuntimesAPI] Token structure: ', {
      parts: tokenParts.length,
      isJWT: tokenParts.length === 3,
      headerLength: tokenParts[0]?.length,
      payloadLength: tokenParts[1]?.length,
      signatureLength: tokenParts[2]?.length,
    });

    // Try to decode JWT payload to check expiration
    if (tokenParts.length === 3) {
      try {
        const payload = JSON.parse(
          Buffer.from(tokenParts[1], 'base64').toString(),
        );
        const now = Math.floor(Date.now() / 1000);
        console.log('[RuntimesAPI] Token payload info:', {
          issued: payload.iat
            ? new Date(payload.iat * 1000).toISOString()
            : 'unknown',
          expires: payload.exp
            ? new Date(payload.exp * 1000).toISOString()
            : 'unknown',
          isExpired: payload.exp ? now > payload.exp : 'unknown',
          subject: payload.sub || 'unknown',
        });

        if (payload.exp && now > payload.exp) {
          console.error('[RuntimesAPI] TOKEN IS EXPIRED!');
          throw new Error(
            'Authentication token has expired. Please login again.',
          );
        }
      } catch (e) {
        console.warn('[RuntimesAPI] Could not decode token payload:', e);
      }
    }

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    console.log('[RuntimesAPI] Headers being sent:', {
      'Content-Type': headers['Content-Type'],
      Authorization: `Bearer ${tokenPreview}`,
    });

    return headers;
  }

  private async fetchWithAuth(url: string, options?: any): Promise<Response> {
    try {
      const headers = this.getAuthHeaders();
      console.log('[RuntimesAPI] Making request to:', url);
      console.log('[RuntimesAPI] Request method:', options?.method || 'GET');

      const finalHeaders = {
        ...headers,
        ...options?.headers,
      };

      console.log('[RuntimesAPI] Final headers:', Object.keys(finalHeaders));

      const response = await fetch(url, {
        ...options,
        headers: finalHeaders,
      });

      console.log('[RuntimesAPI] Response status:', response.status);
      console.log('[RuntimesAPI] Response headers:', {
        'content-type': response.headers.get('content-type'),
        'www-authenticate': response.headers.get('www-authenticate'),
      });

      if (response.status === 401) {
        // Try to get more info from the response
        let errorDetails = '';
        try {
          const errorText = await response.text();
          console.error('[RuntimesAPI] 401 Error response body:', errorText);
          errorDetails = ` Details: ${errorText}`;

          // Try to parse as JSON to get more specific error
          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.message) {
              errorDetails = ` Server says: ${errorJson.message}`;
            }
          } catch {
            // Ignore JSON parse errors
          }
        } catch {
          // Ignore text extraction errors
        }
        throw new Error(
          `Authentication failed (401).${errorDetails} Please login again.`,
        );
      }

      return response;
    } catch (error) {
      console.error(`[RuntimesAPI] Request failed: ${url}`, error);
      throw error;
    }
  }

  /**
   * Verify authentication is working
   */
  async verifyAuth(): Promise<boolean> {
    try {
      const authState = this.authService.getAuthState();
      console.log('[RuntimesAPI] Auth state check:', {
        isAuthenticated: authState.isAuthenticated,
        hasToken: !!authState.token,
        tokenLength: authState.token?.length,
        serverUrl: authState.serverUrl,
        user: authState.user?.email,
      });

      if (!authState.isAuthenticated || !authState.token) {
        console.error('[RuntimesAPI] Not authenticated!');
        return false;
      }

      // Test with user info endpoint first
      console.log('[RuntimesAPI] Testing auth with user info endpoint...');
      const testUrl = `${authState.serverUrl}/api/spacer/v1/spaces/users/me`;

      try {
        const testResponse = await this.fetchWithAuth(testUrl);
        if (testResponse.ok) {
          console.log(
            '[RuntimesAPI] Auth test successful - user endpoint works!',
          );
          return true;
        } else {
          console.error(
            '[RuntimesAPI] Auth test failed with user endpoint:',
            testResponse.status,
          );
          return false;
        }
      } catch (testError) {
        console.error('[RuntimesAPI] Auth test error:', testError);
        return false;
      }
    } catch (error) {
      console.error('[RuntimesAPI] Auth verification error:', error);
      return false;
    }
  }

  /**
   * List all available runtimes for the user
   */
  async listRuntimes(): Promise<RuntimeResponse[]> {
    // Verify auth first
    const isAuth = await this.verifyAuth();
    if (!isAuth) {
      throw new Error('Not authenticated. Please login first.');
    }

    const serverUrl = this.authService.getServerUrl();
    const url = `${serverUrl}/api/runtimes/v1/runtimes`;

    console.log('[RuntimesAPI] Fetching runtimes from:', url);

    try {
      const response = await this.fetchWithAuth(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          '[RuntimesAPI] Failed to fetch runtimes:',
          response.status,
          errorText,
        );
        throw new Error(`Failed to fetch runtimes: ${response.status}`);
      }

      const data = (await response.json()) as any;
      console.log('[RuntimesAPI] Runtimes response:', data);

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
      console.error('[RuntimesAPI] Error fetching runtimes:', error);
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

    console.log('[RuntimesAPI] Creating runtime at:', url);

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

      console.log(
        '[RuntimesAPI] Creating runtime with body:',
        JSON.stringify(body, null, 2),
      );

      const response = await this.fetchWithAuth(url, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          '[RuntimesAPI] Failed to create runtime:',
          response.status,
          errorText,
        );
        console.error(
          '[RuntimesAPI] Request body was:',
          JSON.stringify(body, null, 2),
        );

        // Try to parse error message from response
        let errorMessage = `Failed to create runtime: ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message) {
            errorMessage = `Failed to create runtime: ${errorData.message}`;
          }
        } catch (e) {
          // If not JSON, use the text directly
          if (errorText) {
            errorMessage = `Failed to create runtime: ${errorText}`;
          }
        }

        throw new Error(errorMessage);
      }

      const data = (await response.json()) as any;
      console.log(
        '[RuntimesAPI] Create runtime response:',
        JSON.stringify(data, null, 2),
      );

      // The API returns the runtime wrapped in an object
      if (data.success && data.runtime) {
        console.log(
          '[RuntimesAPI] Extracted runtime:',
          JSON.stringify(data.runtime, null, 2),
        );
        return data.runtime as RuntimeResponse;
      }

      // Fallback if it's already the runtime object
      if (data.uid) {
        return data as RuntimeResponse;
      }

      console.error(
        '[RuntimesAPI] Unexpected runtime response structure:',
        data,
      );
      return undefined;
    } catch (error) {
      console.error('[RuntimesAPI] Error creating runtime:', error);
      throw error;
    }
  }

  /**
   * Get a specific runtime by pod name
   */
  async getRuntime(podName: string): Promise<RuntimeResponse | undefined> {
    const serverUrl = this.authService.getServerUrl();
    const url = `${serverUrl}/api/runtimes/v1/runtimes/${podName}`;

    console.log('[RuntimesAPI] Fetching runtime from:', url);

    try {
      const response = await this.fetchWithAuth(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          '[RuntimesAPI] Failed to fetch runtime:',
          response.status,
          errorText,
        );
        throw new Error(`Failed to fetch runtime: ${response.status}`);
      }

      const data = (await response.json()) as any;
      console.log(
        '[RuntimesAPI] Raw runtime fetch response:',
        JSON.stringify(data, null, 2),
      );

      // The API returns the runtime as "kernel" when fetching a single runtime
      if (data.success && data.kernel) {
        console.log(
          '[RuntimesAPI] Extracted kernel (runtime) from wrapper:',
          JSON.stringify(data.kernel, null, 2),
        );
        return data.kernel as RuntimeResponse;
      }

      console.warn('[RuntimesAPI] Unexpected runtime response format:', data);
      return undefined;
    } catch (error) {
      console.error('[RuntimesAPI] Error fetching runtime:', error);
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

      console.log('[RuntimesAPI] Runtime configuration:', {
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
          '[RuntimesAPI] Using existing runtime:',
          activeRuntime.pod_name,
        );
        return activeRuntime;
      }

      // No active runtime found, create a new one with configuration
      console.log('[RuntimesAPI] No active runtime found, creating new one...');
      console.log(
        `[RuntimesAPI] Using environment: ${environmentName}, credits limit: ${creditsLimit}`,
      );

      const runtime = await this.createRuntime(
        creditsLimit,
        'notebook',
        'VSCode Notebook Runtime',
        environmentName,
      );

      if (runtime) {
        console.log('[RuntimesAPI] Created new runtime:', runtime.pod_name);

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
                  '[RuntimesAPI] Runtime initialized with URL:',
                  updatedRuntime.ingress,
                );
                return updatedRuntime;
              }
              console.log(
                `[RuntimesAPI] Runtime not ready yet, retry ${retries + 1}/${maxRetries}`,
              );
            } catch (error) {
              console.warn(
                '[RuntimesAPI] Error checking runtime status:',
                error,
              );
            }

            retries++;
          }

          // Return the original runtime if we couldn't get updated info
          console.warn('[RuntimesAPI] Runtime may not be fully initialized');
          return runtime;
        }
      }

      return runtime;
    } catch (error) {
      console.error('[RuntimesAPI] Error ensuring runtime:', error);
      throw error;
    }
  }
}

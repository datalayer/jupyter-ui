/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module authService
 * Authentication service for the Datalayer VS Code extension.
 * Manages user sessions, JWT tokens, and secure credential storage using VS Code's SecretStorage API.
 * Supports GitHub OAuth integration for enhanced user profiles.
 */

import * as vscode from 'vscode';
import { GitHubService } from './githubService';

/**
 * GitHub user profile information.
 * @interface GitHubUser
 */
export interface GitHubUser {
  /** GitHub username */
  login: string;
  /** GitHub user ID */
  id: number;
  /** URL to the user's avatar image */
  avatar_url: string;
  /** User's display name */
  name?: string;
  /** User's bio/description */
  bio?: string;
  /** User's company */
  company?: string;
  /** User's location */
  location?: string;
  /** User's blog URL */
  blog?: string;
  /** URL to the user's GitHub profile */
  html_url: string;
}

/**
 * Response structure from the Datalayer login API.
 * @interface LoginResponse
 */
export interface LoginResponse {
  /** User information from the authentication response */
  user: {
    /** User ID */
    id: string;
    /** User email address */
    email: string;
    /** User display name */
    name?: string;
    /** User handle URN (e.g., "urn:dla:iam:ext::github:3627835") */
    handle_s?: string;
    /** Enriched GitHub profile data */
    github?: GitHubUser;
  };
  /** JWT authentication token */
  token: string;
  /** User handle URN (may be at root level) */
  handle_s?: string;
}

/**
 * Current authentication state of the extension.
 * @interface AuthState
 */
export interface AuthState {
  /** Whether the user is currently authenticated */
  isAuthenticated: boolean;
  /** JWT authentication token */
  token?: string;
  /** Current user information */
  user?: LoginResponse['user'];
  /** Datalayer server URL */
  serverUrl: string;
}

/**
 * Singleton service for managing authentication with the Datalayer platform.
 * Handles login/logout, token storage, and status bar updates.
 *
 * @class AuthService
 *
 * @example
 * ```typescript
 * const authService = AuthService.getInstance(context);
 * await authService.login('user-token');
 * const state = authService.getAuthState();
 * ```
 */
export class AuthService implements vscode.Disposable {
  private static instance: AuthService;
  private context: vscode.ExtensionContext;
  private statusBarItem: vscode.StatusBarItem;
  private authState: AuthState = {
    isAuthenticated: false,
    serverUrl: 'https://prod1.datalayer.run',
  };

  private constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100,
    );
    this.initialize();
  }

  /**
   * Gets or creates the singleton AuthService instance.
   *
   * @param {vscode.ExtensionContext} [context] - Extension context (required on first call)
   * @returns {AuthService} The AuthService singleton instance
   * @throws {Error} If context is not provided on first call
   */
  static getInstance(context?: vscode.ExtensionContext): AuthService {
    if (!AuthService.instance) {
      if (!context) {
        throw new Error('Context required for first initialization');
      }
      AuthService.instance = new AuthService(context);
    }
    return AuthService.instance;
  }

  /**
   * Initializes the authentication service.
   * Loads stored credentials and updates the status bar.
   *
   * @private
   * @returns {Promise<void>}
   */
  private async initialize(): Promise<void> {
    const serverUrl = vscode.workspace
      .getConfiguration('datalayer')
      .get<string>('serverUrl', 'https://prod1.datalayer.run');
    this.authState.serverUrl = serverUrl;

    console.log('[Datalayer Auth] Initializing auth service');
    console.log('[Datalayer Auth] Server URL:', serverUrl);

    const token = await this.context.secrets.get('datalayer.jwt');
    if (token) {
      console.log('[Datalayer Auth] Found stored JWT token');
      this.authState.isAuthenticated = true;
      this.authState.token = token;
      const userJson = await this.context.secrets.get('datalayer.user');
      if (userJson) {
        try {
          this.authState.user = JSON.parse(userJson);
          console.log(
            '[Datalayer Auth] Restored user session:',
            this.authState.user?.email,
          );
        } catch (e) {
          console.error(
            '[Datalayer Auth] Failed to parse stored user data:',
            e,
          );
        }
      }
    } else {
      console.log('[Datalayer Auth] No stored authentication found');
    }
    this.updateStatusBar();
  }

  /**
   * Updates the status bar item with current authentication state.
   * Shows user information when authenticated or login prompt when not.
   *
   * @private
   * @returns {void}
   */
  private updateStatusBar(): void {
    if (this.authState.isAuthenticated) {
      const user = this.authState.user as any;
      const displayName = user?.githubLogin
        ? `@${user.githubLogin}`
        : user?.email || 'User';
      // Using menu icon (three horizontal lines) as a visual representation of Datalayer's stacked bars logo
      this.statusBarItem.text = `$(menu) Datalayer`;
      this.statusBarItem.tooltip = `Connected as ${displayName}`;
      this.statusBarItem.command = 'datalayer.showAuthStatus';
      // Reset colors to default when authenticated
      this.statusBarItem.color = undefined;
      this.statusBarItem.backgroundColor = undefined;
    } else {
      this.statusBarItem.text = '$(menu) Datalayer: Not Connected';
      this.statusBarItem.tooltip = 'Click to login';
      this.statusBarItem.command = 'datalayer.login';
      // Use warning theme colors when not connected
      this.statusBarItem.color = new vscode.ThemeColor(
        'statusBarItem.warningForeground',
      );
      this.statusBarItem.backgroundColor = new vscode.ThemeColor(
        'statusBarItem.warningBackground',
      );
    }
    this.statusBarItem.show();
  }

  /**
   * Authenticates the user with the Datalayer platform.
   * Validates the token, enriches user data with GitHub info if available,
   * and stores credentials securely.
   *
   * @param {string} token - User's authentication token
   * @returns {Promise<void>}
   * @throws {Error} If login fails or token is invalid
   */
  async login(token: string): Promise<void> {
    try {
      const loginUrl = `${this.authState.serverUrl}/api/iam/v1/login`;
      const requestBody = { token };

      console.log('[Datalayer Auth] Starting login request...');
      console.log('[Datalayer Auth] Login URL:', loginUrl);
      console.log('[Datalayer Auth] Request body:', {
        token: token.substring(0, 10) + '...',
      });

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('[Datalayer Auth] Response status:', response.status);
      console.log(
        '[Datalayer Auth] Response headers:',
        Object.fromEntries(response.headers.entries()),
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          '[Datalayer Auth] Login failed with status:',
          response.status,
        );
        console.error('[Datalayer Auth] Error response:', errorText);
        throw new Error(
          `Login failed: ${response.status} ${response.statusText}. ${errorText}`,
        );
      }

      const data = (await response.json()) as LoginResponse;
      console.log('[Datalayer Auth] Login successful!');
      console.log(
        '[Datalayer Auth] Raw response data:',
        JSON.stringify(data, null, 2),
      );
      console.log('[Datalayer Auth] User:', data.user);
      console.log(
        '[Datalayer Auth] JWT token received:',
        data.token ? 'Yes' : 'No',
      );
      console.log('[Datalayer Auth] Token length:', data.token?.length);

      // Check for handle_s at root level or in user object
      const handle_s = data.handle_s || data.user?.handle_s;
      console.log('[Datalayer Auth] handle_s:', handle_s);

      // Enrich user data with GitHub information if available
      const enrichedUser = await GitHubService.enrichUserWithGitHub(
        data.user,
        handle_s,
      );

      await this.context.secrets.store('datalayer.jwt', data.token);
      await this.context.secrets.store(
        'datalayer.user',
        JSON.stringify(enrichedUser),
      );

      this.authState = {
        isAuthenticated: true,
        token: data.token,
        user: enrichedUser,
        serverUrl: this.authState.serverUrl,
      };

      console.log('[Datalayer Auth] Auth state updated:', {
        isAuthenticated: this.authState.isAuthenticated,
        serverUrl: this.authState.serverUrl,
        user: this.authState.user?.email,
      });

      this.updateStatusBar();

      // Build a detailed success message
      const githubLogin = (enrichedUser as any).githubLogin;
      const name = enrichedUser.name || (enrichedUser as any).github?.name;

      let message = 'Successfully logged in';
      if (githubLogin) {
        if (name && name !== 'undefined') {
          message = `Successfully logged in as @${githubLogin} (${name})`;
        } else {
          message = `Successfully logged in as @${githubLogin}`;
        }
      } else if (name && name !== 'undefined') {
        message = `Successfully logged in as ${name}`;
      } else if (enrichedUser.email) {
        message = `Successfully logged in as ${enrichedUser.email}`;
      }

      vscode.window.showInformationMessage(message);
    } catch (error) {
      console.error('[Datalayer Auth] Login error:', error);
      if (error instanceof Error) {
        console.error('[Datalayer Auth] Error message:', error.message);
        console.error('[Datalayer Auth] Error stack:', error.stack);
      }
      vscode.window.showErrorMessage(
        `Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * Logs out the current user.
   * Clears stored credentials and resets authentication state.
   *
   * @returns {Promise<void>}
   */
  async logout(): Promise<void> {
    try {
      if (this.authState.token) {
        await fetch(`${this.authState.serverUrl}/api/iam/v1/logout`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.authState.token}`,
          },
        }).catch(err => {
          console.error('Logout API call failed:', err);
        });
      }

      await this.context.secrets.delete('datalayer.jwt');
      await this.context.secrets.delete('datalayer.user');

      this.authState = {
        isAuthenticated: false,
        serverUrl: this.authState.serverUrl,
      };

      this.updateStatusBar();
      vscode.window.showInformationMessage('Successfully logged out');
    } catch (error) {
      console.error('Logout error:', error);
      vscode.window.showErrorMessage(
        `Logout failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Gets a copy of the current authentication state.
   *
   * @returns {AuthState} Current authentication state
   */
  getAuthState(): AuthState {
    return { ...this.authState };
  }

  /**
   * Gets the current authentication token.
   *
   * @returns {string | undefined} JWT token if authenticated, undefined otherwise
   */
  getToken(): string | undefined {
    return this.authState.token;
  }

  /**
   * Gets the current Datalayer server URL.
   *
   * @returns {string} Server URL
   */
  getServerUrl(): string {
    return this.authState.serverUrl;
  }

  /**
   * Updates the Datalayer server URL.
   * If authenticated, logs out the user and prompts for re-authentication.
   *
   * @param {string} url - New server URL
   * @returns {Promise<void>}
   */
  async updateServerUrl(url: string): Promise<void> {
    await vscode.workspace
      .getConfiguration('datalayer')
      .update('serverUrl', url, vscode.ConfigurationTarget.Global);
    this.authState.serverUrl = url;
    if (this.authState.isAuthenticated) {
      await this.logout();
      vscode.window.showInformationMessage(
        'Server URL changed. Please login again.',
      );
    }
  }

  /**
   * Disposes of the authentication service.
   * Cleans up the status bar item.
   *
   * @returns {void}
   */
  dispose(): void {
    this.statusBarItem.dispose();
  }
}

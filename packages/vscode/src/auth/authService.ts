/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import * as vscode from 'vscode';
import { GitHubService } from './githubService';

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name?: string;
  bio?: string;
  company?: string;
  location?: string;
  blog?: string;
  html_url: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name?: string;
    handle_s?: string; // e.g., "urn:dla:iam:ext::github:3627835"
    github?: GitHubUser; // Enriched GitHub data
  };
  token: string;
  handle_s?: string; // May be at root level
}

export interface AuthState {
  isAuthenticated: boolean;
  token?: string;
  user?: LoginResponse['user'];
  serverUrl: string;
}

export class AuthService {
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

  static getInstance(context?: vscode.ExtensionContext): AuthService {
    if (!AuthService.instance) {
      if (!context) {
        throw new Error('Context required for first initialization');
      }
      AuthService.instance = new AuthService(context);
    }
    return AuthService.instance;
  }

  private async initialize() {
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

  private updateStatusBar() {
    if (this.authState.isAuthenticated) {
      const user = this.authState.user as any;
      const displayName = user?.githubLogin
        ? `@${user.githubLogin}`
        : user?.email || 'User';
      // Using menu icon (three horizontal lines) as a visual representation of Datalayer's stacked bars logo
      this.statusBarItem.text = `$(menu) Datalayer: ${displayName}`;
      this.statusBarItem.tooltip = undefined; // No tooltip when authenticated
      this.statusBarItem.command = 'datalayer.showAuthStatus';
    } else {
      this.statusBarItem.text = '$(menu) Datalayer: Not Connected';
      this.statusBarItem.tooltip = 'Click to login';
      this.statusBarItem.command = 'datalayer.login';
    }
    this.statusBarItem.show();
  }

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

  getAuthState(): AuthState {
    return { ...this.authState };
  }

  getToken(): string | undefined {
    return this.authState.token;
  }

  getServerUrl(): string {
    return this.authState.serverUrl;
  }

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

  dispose() {
    this.statusBarItem.dispose();
  }
}

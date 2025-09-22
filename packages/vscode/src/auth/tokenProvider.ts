/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module tokenProvider
 * User interface provider for authentication flows.
 * Handles token input, validation, and status display through VS Code UI components.
 */

import * as vscode from 'vscode';
import { AuthService } from './authService';

/**
 * Provides user interface methods for authentication flows.
 * @class TokenProvider
 */
export class TokenProvider {
  /**
   * Prompts the user to enter their Datalayer access token.
   * @returns {Promise<string | undefined>} The trimmed token or undefined if cancelled
   */
  static async promptForToken(): Promise<string | undefined> {
    const token = await vscode.window.showInputBox({
      title: 'Datalayer Authentication',
      prompt: 'Enter your Datalayer access token',
      placeHolder: 'Paste your token here',
      password: true,
      ignoreFocusOut: true,
      validateInput: (value: string) => {
        if (!value || value.trim().length === 0) {
          return 'Token cannot be empty';
        }
        return null;
      },
    });

    return token?.trim();
  }

  /**
   * Handles the complete login flow with user prompts.
   * @returns {Promise<void>}
   */
  static async login(): Promise<void> {
    console.log('[Datalayer Auth] Login command triggered');
    const token = await TokenProvider.promptForToken();
    if (!token) {
      console.log('[Datalayer Auth] No token provided, cancelling login');
      return;
    }

    console.log(
      '[Datalayer Auth] Token received from user, length:',
      token.length,
    );
    const authService = AuthService.getInstance();
    try {
      await authService.login(token);
      console.log('[Datalayer Auth] Login completed successfully');
    } catch (error) {
      console.error('[Datalayer Auth] Login failed:', error);
    }
  }

  /**
   * Logs out the current user and clears authentication state.
   * @returns {Promise<void>}
   */
  static async logout(): Promise<void> {
    const authService = AuthService.getInstance();
    await authService.logout();
  }

  /**
   * Shows the current authentication status with options to login or logout.
   * @returns {Promise<void>}
   */
  static async showAuthStatus(): Promise<void> {
    const authService = AuthService.getInstance();
    const state = authService.getAuthState();

    if (state.isAuthenticated) {
      const user = state.user as any;
      const items: string[] = ['Logout'];

      const displayName =
        user?.githubLogin || user?.name || user?.email || 'User';
      const selected = await vscode.window.showQuickPick(items, {
        title: 'Datalayer Authentication Status',
        placeHolder: `Connected as ${displayName}`,
      });

      if (selected === 'Logout') {
        await TokenProvider.logout();
      }
    } else {
      const selected = await vscode.window.showQuickPick(['Login', 'Cancel'], {
        title: 'Datalayer Authentication Status',
        placeHolder: 'Not connected to Datalayer',
      });

      if (selected === 'Login') {
        await TokenProvider.login();
      }
    }
  }
}

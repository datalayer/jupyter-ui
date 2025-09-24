/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module githubService
 * Service for enriching user profiles with GitHub information.
 * Fetches GitHub user data when users authenticate via GitHub OAuth.
 */

import type { GitHubUser } from './authService';

/**
 * Static service class for GitHub user data enrichment.
 * Provides methods to parse GitHub handles and fetch user profiles from the GitHub API.
 *
 * @class GitHubService
 *
 * @example
 * ```typescript
 * const githubId = GitHubService.parseGitHubHandle('urn:dla:iam:ext::github:123456');
 * const userData = await GitHubService.fetchGitHubUser(githubId);
 * ```
 */
export class GitHubService {
  private static readonly GITHUB_API_BASE = 'https://api.github.com';
  private static readonly GITHUB_HANDLE_PATTERN =
    /^urn:dla:iam:ext::github:(\d+)$/;

  /**
   * Parses GitHub user ID from a Datalayer handle string.
   *
   * @param {string | undefined} handle_s - Handle string like "urn:dla:iam:ext::github:3627835"
   * @returns {string | null} GitHub user ID or null if not a GitHub handle
   *
   * @example
   * ```typescript
   * const id = GitHubService.parseGitHubHandle('urn:dla:iam:ext::github:3627835');
   * // Returns: '3627835'
   * ```
   */
  static parseGitHubHandle(handle_s: string | undefined): string | null {
    if (!handle_s) {
      return null;
    }

    const match = handle_s.match(GitHubService.GITHUB_HANDLE_PATTERN);
    if (match && match[1]) {
      console.log('[Datalayer Auth] Found GitHub user ID:', match[1]);
      return match[1];
    }

    console.log(
      '[Datalayer Auth] handle_s does not contain GitHub ID:',
      handle_s,
    );
    return null;
  }

  /**
   * Fetches GitHub user information from the GitHub API.
   *
   * @param {string} userId - GitHub user ID
   * @returns {Promise<GitHubUser | null>} GitHub user data or null if fetch fails
   *
   * @remarks
   * Uses the GitHub REST API v3 without authentication.
   * May be subject to rate limiting (60 requests per hour for unauthenticated requests).
   */
  static async fetchGitHubUser(userId: string): Promise<GitHubUser | null> {
    try {
      console.log('[Datalayer Auth] Fetching GitHub user data for ID:', userId);

      const response = await fetch(
        `${GitHubService.GITHUB_API_BASE}/user/${userId}`,
        {
          headers: {
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        },
      );

      if (!response.ok) {
        console.error(
          '[Datalayer Auth] GitHub API error:',
          response.status,
          response.statusText,
        );

        if (response.status === 403) {
          console.error(
            '[Datalayer Auth] GitHub API rate limit may have been exceeded',
          );
        }

        return null;
      }

      const userData = (await response.json()) as GitHubUser;
      console.log('[Datalayer Auth] GitHub user data fetched successfully:', {
        login: userData.login,
        name: userData.name,
        id: userData.id,
      });

      return userData;
    } catch (error) {
      console.error(
        '[Datalayer Auth] Failed to fetch GitHub user data:',
        error,
      );
      return null;
    }
  }

  /**
   * Enriches user data with GitHub profile information.
   * Merges GitHub user data with the existing Datalayer user object.
   *
   * @param {any} user - Original user data from Datalayer
   * @param {string | undefined} handle_s - The handle_s string from authentication response
   * @returns {Promise<any>} User data enriched with GitHub information
   *
   * @example
   * ```typescript
   * const enrichedUser = await GitHubService.enrichUserWithGitHub(
   *   datalayerUser,
   *   'urn:dla:iam:ext::github:3627835'
   * );
   * ```
   */
  static async enrichUserWithGitHub(
    user: any,
    handle_s: string | undefined,
  ): Promise<any> {
    const githubId = GitHubService.parseGitHubHandle(handle_s);

    if (!githubId) {
      return user;
    }

    const githubUser = await GitHubService.fetchGitHubUser(githubId);

    if (!githubUser) {
      return user;
    }

    // Merge GitHub data with existing user data
    const enrichedUser = {
      ...user,
      github: githubUser,
      // Use GitHub name if Datalayer doesn't provide one
      name: user.name || githubUser.name || githubUser.login,
      // Add GitHub login as alternative identifier
      githubLogin: githubUser.login,
      avatarUrl: githubUser.avatar_url,
    };

    console.log('[Datalayer Auth] User data enriched with GitHub info');
    return enrichedUser;
  }
}

/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import type { GitHubUser } from './authService';

export class GitHubService {
  private static readonly GITHUB_API_BASE = 'https://api.github.com';
  private static readonly GITHUB_HANDLE_PATTERN =
    /^urn:dla:iam:ext::github:(\d+)$/;

  /**
   * Parse GitHub user ID from handle_s string
   * @param handle_s String like "urn:dla:iam:ext::github:3627835"
   * @returns GitHub user ID or null if not a GitHub handle
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
   * Fetch GitHub user information by user ID
   * @param userId GitHub user ID
   * @returns GitHub user data or null if fetch fails
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
   * Enrich user data with GitHub information
   * @param user Original user data from Datalayer
   * @param handle_s The handle_s string from authentication response
   * @returns User data enriched with GitHub information
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

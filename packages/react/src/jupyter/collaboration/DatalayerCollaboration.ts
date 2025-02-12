/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Fetch the session ID of a collaborative rooms from Datalayer run.
 */
export async function fetchSessionId({
  url,
  token,
}: {
  url: string;
  token?: string;
}): Promise<string> {
  const headers: HeadersInit = {
    Accept: 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers,
    credentials: token ? 'include' : 'omit',
    mode: 'cors',
    cache: 'no-store',
  });

  if (response.ok) {
    const content = await response.json();

    return content['sessionId'];
  }

  console.error('Failed to fetch session ID.', response);

  throw new Error('Failed to fetch session ID.');
}

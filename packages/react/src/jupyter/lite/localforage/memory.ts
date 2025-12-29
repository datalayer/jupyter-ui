/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import type localforage from 'localforage';
import memoryStorageDriver from 'localforage-memoryStorageDriver';

/**
 * Ensure a localforage singleton has had the memory storage driver installed
 */
export async function ensureMemoryStorage(
  theLocalforage: typeof localforage
): Promise<void> {
  return await theLocalforage.defineDriver(memoryStorageDriver);
}

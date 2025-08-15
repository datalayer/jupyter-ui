/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { maxSatisfying } from 'semver';

/**
 * A cache using semver ranges to retrieve values.
 */
export class SemVerCache<T> {
  set(key: string, version: string, object: T): void {
    if (!(key in this._cache)) {
      this._cache[key] = Object.create(null);
    }
    if (!(version in this._cache[key])) {
      this._cache[key][version] = object;
    } else {
      //      throw `Version ${version} of key ${key} already registered.`;
      console.warn(`Version ${version} of key ${key} already registered.`);
    }
  }

  get(key: string, semver: string): T | undefined {
    if (key in this._cache) {
      const versions = this._cache[key];
      const best = maxSatisfying(Object.keys(versions), semver);
      if (best !== null) {
        return versions[best];
      }
    }
  }

  getAllVersions(key: string): { [version: string]: any } | undefined {
    if (key in this._cache) {
      return this._cache[key];
    }
  }

  private _cache: { [key: string]: { [version: string]: T } } =
    Object.create(null);
}

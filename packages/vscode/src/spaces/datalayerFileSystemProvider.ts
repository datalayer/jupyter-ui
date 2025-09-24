/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module datalayerFileSystemProvider
 * Virtual file system provider for Datalayer documents.
 * Enables seamless integration of remote documents with VS Code's file system.
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * A virtual file system provider that maps Datalayer documents to a cleaner URI scheme
 * This allows us to show "datalayer://Space Name/Notebook.ipynb" instead of temp paths
 */
export class DatalayerFileSystemProvider implements vscode.FileSystemProvider {
  private static instance: DatalayerFileSystemProvider;

  // Maps virtual URIs to real file paths
  private virtualToReal: Map<string, string> = new Map();
  // Maps real file paths to virtual URIs
  private realToVirtual: Map<string, vscode.Uri> = new Map();

  private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
  /**
   * Event fired when files change in the virtual file system.
   * This event allows VS Code to react to file changes.
   */
  readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> =
    this._emitter.event;

  private constructor() {}

  /**
   * Gets the singleton instance of DatalayerFileSystemProvider.
   * @returns {DatalayerFileSystemProvider} The singleton instance
   */
  static getInstance(): DatalayerFileSystemProvider {
    if (!DatalayerFileSystemProvider.instance) {
      DatalayerFileSystemProvider.instance = new DatalayerFileSystemProvider();
    }
    return DatalayerFileSystemProvider.instance;
  }

  /**
   * Register a mapping between a virtual URI and a real file path
   */
  registerMapping(virtualPath: string, realPath: string): vscode.Uri {
    // Create a virtual URI with the datalayer scheme
    const virtualUri = vscode.Uri.parse(`datalayer:/${virtualPath}`);
    const key = virtualUri.toString();

    this.virtualToReal.set(key, realPath);
    this.realToVirtual.set(realPath, virtualUri);

    return virtualUri;
  }

  /**
   * Get the real file path for a virtual URI
   */
  getRealPath(uri: vscode.Uri): string | undefined {
    return this.virtualToReal.get(uri.toString());
  }

  /**
   * Get the virtual URI for a real file path
   */
  getVirtualUri(realPath: string): vscode.Uri | undefined {
    return this.realToVirtual.get(realPath);
  }

  // FileSystemProvider implementation

  /**
   * Watch a file or directory for changes.
   * @param uri - The URI to watch
   * @returns A disposable that stops watching when disposed
   */
  watch(uri: vscode.Uri): vscode.Disposable {
    // We don't need to watch for changes as documents are in collaborative mode
    return new vscode.Disposable(() => {});
  }

  /**
   * Get metadata about a file or directory.
   * @param uri - The URI of the file or directory
   * @returns Metadata about the file or directory
   * @throws Error if the file or directory doesn't exist
   */
  stat(uri: vscode.Uri): vscode.FileStat {
    const realPath = this.getRealPath(uri);
    if (!realPath || !fs.existsSync(realPath)) {
      throw vscode.FileSystemError.FileNotFound(uri);
    }

    const stats = fs.statSync(realPath);
    return {
      type: stats.isDirectory()
        ? vscode.FileType.Directory
        : vscode.FileType.File,
      ctime: stats.ctimeMs,
      mtime: stats.mtimeMs,
      size: stats.size,
    };
  }

  /**
   * Read the contents of a directory.
   * @param uri - The URI of the directory
   * @returns Array of [name, type] tuples representing directory contents
   * @throws Error if the directory doesn't exist
   */
  readDirectory(uri: vscode.Uri): [string, vscode.FileType][] {
    const realPath = this.getRealPath(uri);
    if (!realPath || !fs.existsSync(realPath)) {
      throw vscode.FileSystemError.FileNotFound(uri);
    }

    const entries = fs.readdirSync(realPath);
    const result: [string, vscode.FileType][] = [];

    for (const entry of entries) {
      const entryPath = path.join(realPath, entry);
      const stats = fs.statSync(entryPath);
      result.push([
        entry,
        stats.isDirectory() ? vscode.FileType.Directory : vscode.FileType.File,
      ]);
    }

    return result;
  }

  /**
   * Create a new directory.
   * @param uri - The URI of the directory to create
   * @throws Error if creation fails
   */
  createDirectory(uri: vscode.Uri): void {
    const realPath = this.getRealPath(uri);
    if (!realPath) {
      throw vscode.FileSystemError.FileNotFound(uri);
    }

    if (!fs.existsSync(realPath)) {
      fs.mkdirSync(realPath, { recursive: true });
    }
  }

  /**
   * Read the contents of a file.
   * @param uri - The URI of the file to read
   * @returns The file contents as a byte array
   * @throws Error if the file doesn't exist
   */
  readFile(uri: vscode.Uri): Uint8Array {
    const realPath = this.getRealPath(uri);
    console.log(
      '[DatalayerFS] Reading virtual file:',
      uri.toString(),
      '-> real path:',
      realPath,
    );

    if (!realPath) {
      console.error(
        '[DatalayerFS] No real path found for virtual URI:',
        uri.toString(),
      );
      throw vscode.FileSystemError.FileNotFound(uri);
    }

    if (!fs.existsSync(realPath)) {
      console.error('[DatalayerFS] Real file does not exist:', realPath);
      throw vscode.FileSystemError.FileNotFound(uri);
    }

    console.log(
      '[DatalayerFS] Successfully reading file, size:',
      fs.statSync(realPath).size,
    );
    return new Uint8Array(fs.readFileSync(realPath));
  }

  /**
   * Write data to a file.
   * @param uri - The URI of the file to write
   * @param content - The content to write
   * @param options - Write options (create and overwrite flags)
   * @throws Error if write fails
   */
  writeFile(
    uri: vscode.Uri,
    content: Uint8Array,
    options: { create: boolean; overwrite: boolean },
  ): void {
    const realPath = this.getRealPath(uri);
    if (!realPath) {
      throw vscode.FileSystemError.FileNotFound(uri);
    }

    if (!options.create && !fs.existsSync(realPath)) {
      throw vscode.FileSystemError.FileNotFound(uri);
    }

    if (!options.overwrite && fs.existsSync(realPath)) {
      throw vscode.FileSystemError.FileExists(uri);
    }

    const dirPath = path.dirname(realPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    fs.writeFileSync(realPath, content);
    this._emitter.fire([{ type: vscode.FileChangeType.Changed, uri }]);
  }

  /**
   * Delete a file or directory.
   * @param uri - The URI to delete
   * @param options - Delete options (recursive flag)
   * @throws Error if deletion fails
   */
  delete(uri: vscode.Uri, options: { recursive: boolean }): void {
    const realPath = this.getRealPath(uri);
    if (!realPath || !fs.existsSync(realPath)) {
      throw vscode.FileSystemError.FileNotFound(uri);
    }

    const stats = fs.statSync(realPath);
    if (stats.isDirectory()) {
      if (options.recursive) {
        fs.rmSync(realPath, { recursive: true, force: true });
      } else {
        fs.rmdirSync(realPath);
      }
    } else {
      fs.unlinkSync(realPath);
    }

    this.virtualToReal.delete(uri.toString());
    this.realToVirtual.delete(realPath);
    this._emitter.fire([{ type: vscode.FileChangeType.Deleted, uri }]);
  }

  /**
   * Rename or move a file or directory.
   * @param oldUri - The current URI
   * @param newUri - The new URI
   * @param options - Rename options (overwrite flag)
   * @throws Error if rename fails
   */
  rename(
    oldUri: vscode.Uri,
    newUri: vscode.Uri,
    options: { overwrite: boolean },
  ): void {
    const oldRealPath = this.getRealPath(oldUri);
    const newRealPath = this.getRealPath(newUri);

    if (!oldRealPath || !fs.existsSync(oldRealPath)) {
      throw vscode.FileSystemError.FileNotFound(oldUri);
    }

    if (!newRealPath) {
      throw vscode.FileSystemError.FileNotFound(newUri);
    }

    if (!options.overwrite && fs.existsSync(newRealPath)) {
      throw vscode.FileSystemError.FileExists(newUri);
    }

    fs.renameSync(oldRealPath, newRealPath);

    // Update mappings
    this.virtualToReal.delete(oldUri.toString());
    this.realToVirtual.delete(oldRealPath);
    this.virtualToReal.set(newUri.toString(), newRealPath);
    this.realToVirtual.set(newRealPath, newUri);

    this._emitter.fire([
      { type: vscode.FileChangeType.Deleted, uri: oldUri },
      { type: vscode.FileChangeType.Created, uri: newUri },
    ]);
  }

  /**
   * Clean up all mappings
   */
  dispose(): void {
    this.virtualToReal.clear();
    this.realToVirtual.clear();
  }
}

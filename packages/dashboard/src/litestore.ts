import { ArrayExt } from '@lumino/algorithm';
import {
  Datastore,
  IServerAdapter,
  Schema,
  Table,
  Record
} from '@lumino/datastore';
import { IDisposable } from '@lumino/disposable';
import { ISignal } from '@lumino/signaling';
import { Message } from '@lumino/messaging';

export type DatastoreFn = ((transaction: Datastore.Transaction) => void) | null;

/**
 * A patch store.
 */
export class TransactionStore {
  /**
   * Construct a new patch store.
   */
  constructor() {
    this._transactions = {};
    this._order = [];
    this._undoStack = [];
    this._redoStack = [];
  }

  /**
   * Add a transaction to the patch store.
   *
   * @param - the transaction to add to the store.
   *
   * @returns - whether it was successfully added.
   */
  add(transaction: Datastore.Transaction): boolean {
    if (
      Object.prototype.hasOwnProperty.call(this._transactions, transaction.id)
    ) {
      return false;
    }
    this._transactions[transaction.id] = transaction;
    this._order.push(transaction.id);
    const count = this._cemetery[transaction.id];
    if (count === undefined) {
      this._cemetery[transaction.id] = 1;
    } else {
      this._cemetery[transaction.id] = count + 1;
    }
    this._undoStack.push(transaction.id);
    return true;
  }

  /**
   * Get a transaction by id.
   *
   * @param transactionId - the id of the transaction.
   *
   * @returns - the transaction, or undefined if it can't be found.
   */
  get(transactionId: string): Datastore.Transaction | undefined {
    return this._transactions[transactionId];
  }

  /**
   * Handle a transaction undo.
   *
   * @param transactionId - the ID of the transaction to undo.
   *
   * #### Notes
   * This has no effect on the content of the transaction. Instead, it
   * updates its undo count in the internal cemetery, determining whether
   * the transaction should be applied at any given time.
   */
  undo(transactionId: string): void {
    const count = this._cemetery[transactionId];
    if (count === undefined) {
      this._cemetery[transactionId] = -1;
    } else {
      this._cemetery[transactionId] = count - 1;
    }
    ArrayExt.removeLastOf(this._undoStack, transactionId);
    this._redoStack.push(transactionId);
  }

  /**
   * Handle a transaction redo.
   *
   * @param transactionId - the ID of the transaction to redo.
   *
   * #### Notes
   * This has no effect on the content of the transaction. Instead, it
   * updates its undo count in the internal cemetery, determining whether
   * the transaction should be applied at any given time.
   */
  redo(transactionId: string): void {
    const count = this._cemetery[transactionId];
    if (count === undefined) {
      this._cemetery[transactionId] = 0;
    } else {
      this._cemetery[transactionId] = count + 1;
    }
    ArrayExt.removeLastOf(this._redoStack, transactionId);
    this._undoStack.push(transactionId);
  }

  /**
   * Get the entire history for the transaction store.
   *
   * @returns - an array of transactions representing the whole history.
   */
  getHistory(): Datastore.Transaction[] {
    const history = [];
    for (const id of this._order) {
      const count = this._cemetery[id] || 0;
      if (count > 0) {
        history.push(this._transactions[id]);
      }
    }
    return history;
  }

  get cemetery(): { [id: string]: number } {
    return this._cemetery;
  }

  /**
   * Get the most recent transaction (newly added or redone).
   *
   * @returns - the transaction, or undefined if there aren't any.
   */
  getLastTransaction(): Datastore.Transaction | undefined {
    if (this._undoStack.length === 0) {
      return undefined;
    }
    const id = this._undoStack[this._undoStack.length - 1];
    return this.get(id);
  }

  /**
   * Get the most recent undone transaction.
   *
   * @returns - the transaction, or undefined if there aren't any.
   */
  getLastUndo(): Datastore.Transaction | undefined {
    if (this._redoStack.length === 0) {
      return undefined;
    }
    const id = this._redoStack[this._redoStack.length - 1];
    return this.get(id);
  }

  /**
   * Whether there is a transaction to undo in the store.
   */
  hasUndo(): boolean {
    return this._undoStack.length > 0;
  }

  /**
   * Whether there is a transaction to redo in the store.
   */
  hasRedo(): boolean {
    return this._redoStack.length > 0;
  }

  private _order: string[];
  private _transactions: { [id: string]: Datastore.Transaction };
  private _cemetery: { [id: string]: number } = {};
  private _undoStack: string[];
  private _redoStack: string[];
}

/**
 * A class providing minimal adapter functionality for undoing and redoing.
 *
 * ### Notes
 * Does not support broadcasting or multiple users.
 */
export class DummyAdapter implements IServerAdapter {
  /**
   * Construct a new adapter.
   *
   * @param transactionStore - the TransactionStore to use, or undefined.
   */
  constructor(transactionStore?: TransactionStore) {
    this._transactionStore =
      transactionStore !== undefined
        ? transactionStore
        : new TransactionStore();
  }

  /**
   * Adds each transaction to the TransactionStore.
   *
   * ### Notes
   * This method is supposed to broadcast each transaction to collaborators in
   * a "real" adapter. Here, it just acts as a convenient way to run some code
   * every time a new transaction occurs.
   */
  broadcast(transaction: Datastore.Transaction): void {
    this._transactionStore.add(transaction);
  }

  /**
   * Whether the adapter has been disposed.
   */
  get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * Disposes of the resources held by the adapter.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._transactionStore = null;
    this._onRemoteTransaction = null;
    this._onUndo = null;
    this._onRedo = null;
    this._isDisposed = true;
  }

  /**
   * A callback for when a remote transaction is recieved by the adapter (no op).
   */
  get onRemoteTransaction(): DatastoreFn {
    return this._onRemoteTransaction;
  }
  set onRemoteTransaction(fn: DatastoreFn) {
    this._onRemoteTransaction = fn;
  }

  /**
   * A callback for when an undo request is recieved by the adapter.
   */
  get onUndo(): DatastoreFn {
    return this._onUndo;
  }
  set onUndo(fn: DatastoreFn) {
    this._onUndo = fn;
  }

  /**
   * A callback for when a redo request is recieved by the adapter.
   */
  get onRedo(): DatastoreFn {
    return this._onRedo;
  }
  set onRedo(fn: DatastoreFn) {
    this._onRedo = fn;
  }

  /**
   * Handles an undo message.
   *
   * @param id - the ID of the transaction to undo.
   *
   * ### Notes
   * This function should only be called by the Datastore.
   */
  async undo(id: string): Promise<void> {
    if (this.onUndo) {
      const transaction = this._transactionStore.get(id);
      if (transaction === undefined) {
        return;
      }
      this.onUndo(transaction);
      this._transactionStore.undo(id);
    }
  }

  /**
   * Handles a redo message.
   *
   * @param id
   *
   * ### Notes
   * This function should only be called by the Datastore.
   */
  async redo(id: string): Promise<void> {
    if (this.onRedo) {
      const transaction = this._transactionStore.get(id);
      if (transaction === undefined) {
        return;
      }
      this.onRedo(transaction);
      this._transactionStore.redo(id);
    }
  }

  private _isDisposed: boolean;
  private _transactionStore: TransactionStore | null;
  private _onRemoteTransaction: DatastoreFn;
  private _onUndo: DatastoreFn;
  private _onRedo: DatastoreFn;
}

/**
 * A convenient Datastore wrapper for non-collaborative work where a local
 * database with undo, redo, or serialization functionality is needed.
 */
export class Litestore implements IDisposable, IIterable<Table<Schema>> {
  /**
   * Constructs a new Litestore.
   *
   * @param options - The options for creating the Litestore. The adapter will
   * be overwritten by a new DummyAdapter.
   */
  constructor(options: Datastore.IOptions) {
    this._transactionStore = new TransactionStore();
    this._adapter = new DummyAdapter(this._transactionStore);
    this._dataStore = Datastore.create({ ...options, adapter: this._adapter });
  }

  /**
   * The unique id of the store.
   */
  get id(): number {
    return this._dataStore.id;
  }

  /**
   * A signal emitted when changes are made to the store.
   *
   * ### Notes
   * The payload represents the sert of local changes that were made
   * to bring the store to its current state.
   */
  get changed(): ISignal<Datastore, Datastore.IChangedArgs> {
    return this._dataStore.changed;
  }

  /**
   * Whether the store has been disposed.
   */
  get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * Whether a transaction is currently in progress.
   */
  get inTransaction(): boolean {
    return this._dataStore.inTransaction;
  }

  /**
   * The current version of the store.
   *
   * ### Notes
   * This version is automatically increased for each transaction to
   * the store. However, it might not increase linearly
   * (i.e. it might make jumps).
   */
  get version(): number {
    return this._dataStore.version;
  }

  /**
   * The dummy adapter for the store.
   */
  get adapter(): IServerAdapter {
    return this._adapter;
  }

  /**
   * The transaction cemetery used by the TransactionStore.
   */
  get cemetery(): { [id: string]: number } {
    return this._transactionStore.cemetery;
  }

  /**
   * Get a transaction by id.
   *
   * @param transactionId - the id of the transaction.
   *
   * @returns - the transaction, or undefined if it can't be found.
   */
  getTransaction(transactionId: string): Datastore.Transaction | undefined {
    return this._transactionStore.get(transactionId);
  }

  /**
   * Get the entire history for the transaction store.
   *
   * @returns - an array of transactions representing the whole history.
   */
  getHistory(): Datastore.Transaction[] {
    return this._transactionStore.getHistory();
  }

  /**
   * Get the most recent transaction (newly added or redone).
   *
   * @returns - the transaction, or undefined if there aren't any.
   */
  getLastTransaction(): Datastore.Transaction | undefined {
    return this._transactionStore.getLastTransaction();
  }

  /**
   * Get the most recent undone transaction.
   *
   * @returns - the transaction, or undefined if there aren't any.
   */
  getLastUndo(): Datastore.Transaction | undefined {
    return this._transactionStore.getLastUndo();
  }

  /**
   * Begin a new transaction in the store.
   *
   * @returns - the id of the new transaction.
   *
   *  @throws - an exception if a transaction is already in progress.
   *
   * #### Notes
   * This will allow the state of the store to be mutated
   * thorugh the `update` method on the individual tables.
   *
   * After the updates are completed, `endTransaction` should
   * be called.
   */
  beginTransaction(): string {
    return this._dataStore.beginTransaction();
  }

  /**
   * Completes a transaction.
   *
   * @returns - the ID of the last transaction, or undefined if it was empty.
   *
   * #### Notes
   * This completes a transaction previously started with
   * `beginTransaction`. If a change has occurred, the
   * `changed` signal will be emitted.
   */
  endTransaction(): string | undefined {
    this._dataStore.endTransaction();
    const transaction = this.getLastTransaction();
    if (transaction === undefined) {
      return undefined;
    }

    return transaction.id;
  }

  /**
   * Get the table for a particular schema.
   *
   * @param schema - the schema of interest.
   *
   * @returns - the table for the specified schema.
   *
   * @throws - an exception if no table exists for the given schema.
   */
  get<S extends Schema>(schema: S): Table<S> {
    return this._dataStore.get(schema);
  }

  /**
   * Create an iterator over all the tables of the datastore.
   *
   * @returns - an iterator.
   */
  iter(): IIterator<Table<Schema>> {
    return this._dataStore.iter();
  }

  /**
   * Handle a message using the Datastore.
   */
  processMessage(msg: Message): void {
    this._dataStore.processMessage(msg);
  }

  /**
   * Disposes of the resources held by the store.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._adapter.dispose();
    this._dataStore.dispose();
    this._transactionStore = null;
    this._isDisposed = true;
  }

  /**
   * Undo a transaction that was previoulsy applied.
   *
   * @param transactionId - the ID of the transaction to undo, or undefined
   * to undo the last transaction.
   *
   * @returns - a promise which resolves when the action is complete.
   *
   * @throws - an exception if `undo` is called during a transaction.
   *
   * #### Notes
   * If changes are made, the `changed` signal will be emitted before
   * the promise resolves.
   */
  undo(transactionId?: string): Promise<void> {
    let promise: Promise<void>;
    if (transactionId === undefined) {
      const lastTransaction = this._transactionStore.getLastTransaction();
      if (lastTransaction === undefined) {
        return;
      }
      promise = this._dataStore.undo(lastTransaction.id);
    } else {
      promise = this._dataStore.undo(transactionId);
    }
    return promise;
  }

  /**
   * Redo a transaction that was previously applied.
   *
   * @param transactionId - the ID of the transaction to redo, or undefined
   * to redo the last transaction.
   *
   * @returns - a promise which resolves when the action is complete.
   *
   * @throws - an exception if `undo` is called during a transaction.
   *
   * #### Notes
   * If changes are made, the `changed` signal will be emitted before
   * the promise resolves.
   */
  redo(transactionId?: string): Promise<void> {
    let promise: Promise<void>;
    if (transactionId === undefined) {
      const lastUndo = this._transactionStore.getLastUndo();
      if (lastUndo === undefined) {
        return;
      }
      promise = this._dataStore.redo(lastUndo.id);
    } else {
      promise = this._dataStore.redo(transactionId);
    }
    return promise;
  }

  /**
   * Serialize the state of the store to a string.
   *
   * @returns - the serialized state.
   */
  toString(): string {
    return this._dataStore.toString();
  }

  /**
   * Get a given table by its location.
   *
   * @param loc - the table location ({schema}).
   *
   * @returns - the table.
   */
  getTable<S extends Schema>(loc: Datastore.TableLocation<S>): Table<S> {
    return Datastore.getTable(this._dataStore, loc);
  }

  /**
   * Get a record by its location.
   *
   * @param loc - the record location ({schema, record}).
   *
   * @returns - the record.
   */
  getRecord<S extends Schema>(
    loc: Datastore.RecordLocation<S>
  ): Record.Value<S> | undefined {
    return Datastore.getRecord(this._dataStore, loc);
  }

  /**
   * Get a field by its location.
   *
   * @param loc - the field location ({schema, record, field}).
   *
   * @returns - the field.
   */
  getField<S extends Schema, F extends keyof S['fields']>(
    loc: Datastore.FieldLocation<S, F>
  ): S['fields'][F]['ValueType'] {
    return Datastore.getField(this._dataStore, loc);
  }

  /**
   * Update a table.
   *
   * @param loc - the table location ({schema}).
   *
   * @param update - the update to the table.
   *
   * #### Notes
   * This does not begin a transaction, so usage of this function should be
   * combined with `beginTransaction`/`endTransaction`, or `withTransaction`.
   */
  updateTable<S extends Schema>(
    loc: Datastore.TableLocation<S>,
    update: Table.Update<S>
  ): void {
    Datastore.updateTable(this._dataStore, loc, update);
  }

  /**
   * Update a record.
   *
   * @param loc - the record location ({schema, record}).
   *
   * @param update - the update to the record.
   *
   * #### Notes
   * This does not begin a transaction, so usage of this function should be
   * combined with `beginTransaction`/`endTransaction`, or `withTransaction`.
   */
  updateRecord<S extends Schema>(
    loc: Datastore.RecordLocation<S>,
    update: Record.Update<S>
  ): void {
    Datastore.updateRecord(this._dataStore, loc, update);
  }

  /**
   * Update a field in a table.
   *
   * @param loc - the field location ({schema, record, field}).
   *
   * @param update - the update to the field (new field value).
   *
   * #### Notes
   * This does not begin a transaction, so usage of this function should be
   * combined with `beginTransaction`/`endTransaction`, or `withTransaction`.
   */
  updateField<S extends Schema, F extends keyof S['fields']>(
    loc: Datastore.FieldLocation<S, F>,
    update: S['fields'][F]['UpdateType']
  ): void {
    Datastore.updateField(this._dataStore, loc, update);
  }

  /**
   * Listen to changes in a table. Changes to other tables are ignored.
   *
   * @param loc - the table location ({schema}).
   *
   * @param slot - a callback function to invoke when the table changes.
   *
   * @returns - an `IDisposable` that can be disposed to remove the listener.
   */
  listenTable<S extends Schema>(
    loc: Datastore.TableLocation<S>,
    slot: (source: Datastore, args: Table.Change<S>) => void,
    thisArg?: any
  ): IDisposable {
    return Datastore.listenTable(this._dataStore, loc, slot, thisArg);
  }

  /**
   * Listen to changes in a record. Changes to other records are ignored.
   *
   * @param loc - the record location ({schema, record}).
   *
   * @param slot - a callback function to invoke when the record changes.
   *
   * @returns - `IDisposable` that can be disposed to remove the listener.
   */
  listenRecord<S extends Schema>(
    loc: Datastore.RecordLocation<S>,
    slot: (source: Datastore, args: Record.Change<S>) => void,
    thisArg?: any
  ): IDisposable {
    return Datastore.listenRecord(this._dataStore, loc, slot, thisArg);
  }

  /**
   * Listen to changes in a field. Changes to other fields are ignored.
   *
   * @param loc - the table location ({schema, record, field}).
   *
   * @param slot - a callback function to invoke when the field changes.
   *
   * @returns - an `IDisposable` that can be disposed to remove the listener.
   */
  listenField<S extends Schema, F extends keyof S['fields']>(
    loc: Datastore.FieldLocation<S, F>,
    slot: (source: Datastore, args: S['fields'][F]['ChangeType']) => void,
    thisArg?: any
  ): IDisposable {
    return Datastore.listenField(this._dataStore, loc, slot, thisArg);
  }

  /**
   * A helper function to wrap an update to the datastore in calls to
   * `beginTransaction` and `endTransaction`.
   *
   * @param update: - a function that performs the update on the datastore.
   *   The function is called with a transaction id string, in case the
   *   user wishes to store the transaction ID for later use.
   *
   * @returns - the transaction ID.
   *
   * #### Notes
   * If the datastore is already in a transaction, this does not attempt
   * to start a new one, and returns an empty string for the transaction
   * id. This allows for transactions to be composed a bit more easily.
   */
  withTransaction(update: (id: string) => void): string {
    return Datastore.withTransaction(this._dataStore, update);
  }

  /**
   * Whether there is a transaction to undo in the store.
   */
  hasUndo(): boolean {
    return this._transactionStore.hasUndo();
  }

  /**
   * Whether there is a transaction to redo in the store.
   */
  hasRedo(): boolean {
    return this._transactionStore.hasRedo();
  }

  private _transactionStore: TransactionStore | null;
  private _adapter: DummyAdapter;
  private _dataStore: Datastore;
  private _isDisposed: boolean;
}

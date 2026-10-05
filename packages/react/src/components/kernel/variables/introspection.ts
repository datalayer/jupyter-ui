/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The variables of a kernel, read by running code in it.
 *
 * One place for what every variables view needs: the code a kernel runs to
 * describe its namespace (per language; Python today), the typed model its
 * answer is parsed into, and the words a list shows for each variable. The
 * code prints its answer as JSON between markers on stdout, so whatever runs
 * it — a kernel connection here, an agent's sandbox over HTTP, a browser
 * sandbox — only has to hand back what was printed.
 *
 * Pure: no Jupyter, no React, so it is tested and shared without a page.
 *
 * @module components/kernel/variables/introspection
 */

/** What a variable is, for the renderer that draws it. */
export type KernelVariableKind =
  | 'scalar'
  | 'string'
  | 'sequence'
  | 'mapping'
  | 'set'
  | 'ndarray'
  | 'dataframe'
  | 'series'
  | 'figure'
  | 'widget'
  | 'module'
  | 'function'
  | 'class'
  | 'object';

const KINDS: readonly KernelVariableKind[] = [
  'scalar',
  'string',
  'sequence',
  'mapping',
  'set',
  'ndarray',
  'dataframe',
  'series',
  'figure',
  'widget',
  'module',
  'function',
  'class',
  'object',
];

/** A variable of the kernel's namespace, as the list shows it. */
export type KernelVariable = {
  name: string;
  /** Its type's name: `int`, `DataFrame`. */
  type: string;
  /** Its type's module: `builtins`, `pandas.core.frame`. */
  module?: string;
  kind: KernelVariableKind;
  /** Its size in memory, in bytes, when the kernel can tell. */
  size?: number;
  /** An array's or a frame's shape. */
  shape?: number[];
  /** A collection's or a string's length. */
  length?: number;
  /** An array's or a series' dtype. */
  dtype?: string;
  /** One line of its value, short; a widget's value. */
  preview: string;
  /** An ipywidget's model id: it is drawn live, by the kernel's widget manager. */
  modelId?: string;
};

/** A dataframe's head, as the details draw it. */
export type KernelVariableTable = {
  columns: string[];
  dtypes?: string[];
  index: string[];
  rows: string[][];
};

/** One variable, read in full: what a renderer draws. */
export type KernelVariableDetails = KernelVariable & {
  /** Its `repr`, cut at {@link KERNEL_VARIABLE_REPR_LIMIT} characters. */
  repr: string;
  /** Whether `repr` was cut. */
  truncated?: boolean;
  /**
   * What its kind adds, capped by the kernel: a dataframe's head
   * ({@link KernelVariableTable}), a series' values, a collection's first
   * items, a figure's PNG, a function's signature and doc.
   */
  data: Record<string, unknown>;
};

/** How much of a variable's `repr` the details carry. */
export const KERNEL_VARIABLE_REPR_LIMIT = 10000;

/** The marker the snippet prints its JSON answer between. */
export const KERNEL_VARIABLES_MARKER = '__DL_KERNEL_VARIABLES__';

/** What runs a snippet in a kernel, and hands back what it printed. */
export type KernelVariablesExecution = {
  /** What was printed on stdout. */
  stdout: string;
  /** The error it raised, if it did: `NameError: …`. */
  error?: string;
};

/** Runs a snippet somewhere — a kernel, a sandbox — and says what it printed. */
export type KernelVariablesExecutor = (
  code: string
) => Promise<KernelVariablesExecution>;

/** What to ask the kernel. */
export type KernelVariablesQuery = {
  /** A variable to read in full; the whole namespace, listed, otherwise. */
  name?: string;
  /** List modules too: they are left out unless asked for. */
  modules?: boolean;
};

/** How a language's kernel is asked for its variables. */
export type KernelVariablesLanguage = {
  /** The code that prints the answer between {@link KERNEL_VARIABLES_MARKER}s. */
  code: (query: KernelVariablesQuery) => string;
};

/**
 * The Python snippet: run in the user namespace, it describes it without
 * leaving anything there — the helper is deleted once it ran — and without
 * importing anything heavy: pandas, numpy and matplotlib values are known by
 * their type's module, never by importing them.
 *
 * Skipped: private names (`_…`), IPython's own (`In`, `Out`, `exit`, `quit`,
 * `get_ipython`, and what the shell put there at start), and modules unless
 * asked for. Every value is described under a `try`: one that fails to
 * describe itself is listed as such, and does not hide the others.
 */
export const PYTHON_KERNEL_VARIABLES_SNIPPET = `def __dl_kernel_variables(__dl_name=None, __dl_modules=False):
    import io as _io
    import json as _json
    import sys as _sys
    import types as _types
    import reprlib as _reprlib
    import itertools as _itertools
    _ns = globals()
    _hidden = {}
    _get_ipython = _ns.get('get_ipython')
    try:
        _shell = _get_ipython() if callable(_get_ipython) else None
    except Exception:
        _shell = None
    if _shell is not None:
        _ns = getattr(_shell, 'user_ns', _ns)
        _hidden = getattr(_shell, 'user_ns_hidden', {}) or {}
    _internal = {'In', 'Out', 'exit', 'quit', 'get_ipython'}
    _short = _reprlib.Repr()
    _short.maxstring = 80
    _short.maxother = 80
    _short.maxlist = 8
    _short.maxtuple = 8
    _short.maxset = 8
    _short.maxdict = 6
    _short.maxlevel = 2

    def _module_of(v):
        return getattr(type(v), '__module__', '') or ''

    def _kind(v):
        t = type(v)
        m = _module_of(v)
        n = t.__name__
        if isinstance(v, _types.ModuleType):
            return 'module'
        if isinstance(v, type):
            return 'class'
        _ipywidgets = _sys.modules.get('ipywidgets')
        if _ipywidgets is not None and isinstance(v, getattr(_ipywidgets, 'Widget', ())):
            return 'widget'
        if isinstance(v, (_types.FunctionType, _types.BuiltinFunctionType, _types.MethodType, _types.BuiltinMethodType)):
            return 'function'
        if v is None or isinstance(v, (bool, int, float, complex)):
            return 'scalar'
        if isinstance(v, (str, bytes, bytearray)):
            return 'string'
        if m.startswith('pandas') and n == 'DataFrame':
            return 'dataframe'
        if m.startswith('pandas') and n == 'Series':
            return 'series'
        if m.startswith('numpy') and n == 'ndarray':
            return 'ndarray'
        if m.startswith('numpy') and getattr(v, 'shape', None) == ():
            return 'scalar'
        if m.startswith('matplotlib') and n == 'Figure':
            return 'figure'
        if isinstance(v, dict):
            return 'mapping'
        if isinstance(v, (set, frozenset)):
            return 'set'
        if isinstance(v, (list, tuple, range)):
            return 'sequence'
        return 'object'

    def _cell(x):
        try:
            text = x if isinstance(x, str) else _short.repr(x)
        except Exception:
            text = '?'
        return text[:60]

    def _preview(v, k):
        try:
            if k == 'dataframe':
                columns = [str(c) for c in list(v.columns)[:12]]
                text = 'columns: ' + ', '.join(columns) + (' ...' if len(v.columns) > 12 else '')
            elif k == 'module':
                text = getattr(v, '__name__', '')
            elif k in ('function', 'class'):
                text = getattr(v, '__qualname__', getattr(v, '__name__', ''))
            elif k == 'widget':
                text = _short.repr(v.value) if hasattr(v, 'value') else (getattr(v, 'description', '') or '')
            else:
                text = _short.repr(v)
        except Exception as e:
            text = '<repr failed: %s>' % type(e).__name__
        return ' '.join(text.split())[:120]

    def _describe(name, v):
        k = _kind(v)
        d = {'name': name, 'type': type(v).__name__, 'module': _module_of(v), 'kind': k, 'preview': _preview(v, k)}
        try:
            if k == 'dataframe':
                d['size'] = int(v.memory_usage(deep=False).sum())
            elif k in ('ndarray', 'series'):
                d['size'] = int(v.nbytes)
            elif k not in ('module', 'function', 'class'):
                d['size'] = int(_sys.getsizeof(v))
        except Exception:
            pass
        if k == 'widget':
            d['model_id'] = getattr(v, 'model_id', None)
        if k in ('dataframe', 'ndarray', 'series'):
            try:
                d['shape'] = [int(i) for i in v.shape]
            except Exception:
                pass
        if k in ('ndarray', 'series'):
            d['dtype'] = str(getattr(v, 'dtype', ''))
        if k in ('sequence', 'mapping', 'set', 'string'):
            try:
                d['length'] = len(v)
            except Exception:
                pass
        return d

    def _data(v, k):
        data = {}
        if k == 'dataframe':
            head = v.head(10)
            data['columns'] = [str(c) for c in list(v.columns)[:50]]
            data['dtypes'] = [str(t) for t in list(v.dtypes)[:50]]
            data['index'] = [_cell(i) for i in list(head.index)]
            data['rows'] = [[_cell(x) for x in row[:50]] for row in head.itertuples(index=False, name=None)]
        elif k == 'series':
            head = v.head(10)
            data['name'] = None if v.name is None else str(v.name)
            data['index'] = [_cell(i) for i in list(head.index)]
            data['values'] = [_cell(x) for x in list(head)]
        elif k == 'ndarray':
            data['ndim'] = int(v.ndim)
        elif k in ('sequence', 'set'):
            data['items'] = [_cell(x) for x in _itertools.islice(v, 20)]
        elif k == 'mapping':
            data['items'] = [[_cell(a), _cell(b)] for a, b in _itertools.islice(v.items(), 20)]
        elif k == 'figure':
            w, h = v.get_size_inches()
            if w * h * 72 * 72 <= 1500000:
                import base64 as _base64
                buffer = _io.BytesIO()
                v.savefig(buffer, format='png', dpi=72)
                if buffer.tell() <= 1500000:
                    data['png'] = _base64.b64encode(buffer.getvalue()).decode('ascii')
        elif k in ('function', 'class'):
            import inspect as _inspect
            try:
                data['signature'] = str(_inspect.signature(v))
            except Exception:
                pass
            doc = _inspect.getdoc(v) or ''
            data['doc'] = doc.split('\\n\\n')[0][:500]
            if k == 'class':
                data['bases'] = [b.__name__ for b in v.__mro__[1:6]]
        elif k == 'widget':
            data['description'] = getattr(v, 'description', None) or None
            data['tooltip'] = getattr(v, 'tooltip', None) or None
        elif k == 'module':
            data['file'] = getattr(v, '__file__', None)
        return data

    if __dl_name is None:
        out = []
        for _n in sorted(_ns.keys()):
            if _n.startswith('_') or _n in _internal:
                continue
            _v = _ns[_n]
            if _n in _hidden and _hidden[_n] is _v:
                continue
            if isinstance(_v, _types.ModuleType) and not __dl_modules:
                continue
            try:
                out.append(_describe(_n, _v))
            except Exception as e:
                out.append({'name': _n, 'type': type(_v).__name__, 'kind': 'object', 'preview': '<error: %s>' % type(e).__name__})
        payload = {'variables': out}
    elif __dl_name not in _ns:
        payload = {'error': 'There is no variable named %s.' % __dl_name}
    else:
        v = _ns[__dl_name]
        d = _describe(__dl_name, v)
        try:
            r = '%s(model_id=%r)' % (type(v).__name__, d.get('model_id')) if d['kind'] == 'widget' else repr(v)
        except Exception as e:
            r = '<repr failed: %s>' % e
        d['repr'] = r[:${KERNEL_VARIABLE_REPR_LIMIT}]
        d['truncated'] = len(r) > ${KERNEL_VARIABLE_REPR_LIMIT}
        try:
            d['data'] = _data(v, d['kind'])
        except Exception as e:
            d['data'] = {'error': '%s: %s' % (type(e).__name__, e)}
        payload = {'variable': d}
    print('${KERNEL_VARIABLES_MARKER}' + _json.dumps(payload, default=str) + '${KERNEL_VARIABLES_MARKER}')
`;

/** Whether a name can be handed to the snippet: an identifier, nothing else. */
export function isVariableName(name: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
}

/** The Python code that answers a query. */
export function pythonKernelVariablesCode(
  query: KernelVariablesQuery = {}
): string {
  if (query.name !== undefined && !isVariableName(query.name)) {
    throw new Error(`Not a variable name: ${query.name}`);
  }
  const name = query.name === undefined ? 'None' : JSON.stringify(query.name);
  const modules = query.modules ? 'True' : 'False';
  return `${PYTHON_KERNEL_VARIABLES_SNIPPET}
try:
    __dl_kernel_variables(${name}, ${modules})
finally:
    del __dl_kernel_variables
`;
}

const LANGUAGES = new Map<string, KernelVariablesLanguage>([
  ['python', { code: pythonKernelVariablesCode }],
]);

/** Teach the views another language's snippet. Returns the undo. */
export function registerKernelVariablesLanguage(
  language: string,
  model: KernelVariablesLanguage
): () => void {
  const key = language.toLowerCase();
  LANGUAGES.set(key, model);
  return () => {
    if (LANGUAGES.get(key) === model) {
      LANGUAGES.delete(key);
    }
  };
}

/** The snippets for a kernel language (`python`, `python3`), if there are. */
export function kernelVariablesLanguage(
  language: string | undefined
): KernelVariablesLanguage | undefined {
  if (!language) {
    return undefined;
  }
  const key = language.toLowerCase();
  return LANGUAGES.get(key) ?? LANGUAGES.get(key.replace(/[0-9.]+$/, ''));
}

/** Whether variables are listed for a kernel language. */
export function supportsKernelVariables(language: string | undefined): boolean {
  return kernelVariablesLanguage(language) !== undefined;
}

/** The kernel did not answer as the snippet does. */
export class KernelVariablesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KernelVariablesError';
  }
}

/** The JSON the snippet printed, out of everything that was printed. */
export function kernelVariablesPayload(
  execution: KernelVariablesExecution
): Record<string, unknown> {
  const { stdout, error } = execution;
  const end = stdout.lastIndexOf(KERNEL_VARIABLES_MARKER);
  const start =
    end > 0 ? stdout.lastIndexOf(KERNEL_VARIABLES_MARKER, end - 1) : -1;
  if (start < 0 || end <= start) {
    throw new KernelVariablesError(
      error
        ? `The kernel could not list its variables: ${error}`
        : 'The kernel did not say what its variables are.'
    );
  }
  const json = stdout.slice(start + KERNEL_VARIABLES_MARKER.length, end);
  let payload: unknown;
  try {
    payload = JSON.parse(json);
  } catch {
    throw new KernelVariablesError(
      'The kernel answered with something that is not JSON.'
    );
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new KernelVariablesError('The kernel answered with no variables.');
  }
  const answer = payload as Record<string, unknown>;
  if (typeof answer.error === 'string') {
    throw new KernelVariablesError(answer.error);
  }
  return answer;
}

const text = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;
const count = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

/** One variable as the snippet described it, checked; `undefined` if it is not one. */
export function toKernelVariable(value: unknown): KernelVariable | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const raw = value as Record<string, unknown>;
  const name = text(raw.name);
  if (!name) {
    return undefined;
  }
  const kind = KINDS.includes(raw.kind as KernelVariableKind)
    ? (raw.kind as KernelVariableKind)
    : 'object';
  const variable: KernelVariable = {
    name,
    type: text(raw.type) ?? 'object',
    kind,
    preview: text(raw.preview) ?? '',
  };
  const module = text(raw.module);
  if (module) {
    variable.module = module;
  }
  const size = count(raw.size);
  if (size !== undefined) {
    variable.size = size;
  }
  if (
    Array.isArray(raw.shape) &&
    raw.shape.every(n => count(n) !== undefined)
  ) {
    variable.shape = raw.shape as number[];
  }
  const length = count(raw.length);
  if (length !== undefined) {
    variable.length = length;
  }
  const dtype = text(raw.dtype);
  if (dtype) {
    variable.dtype = dtype;
  }
  const modelId = text(raw.model_id);
  if (modelId) {
    variable.modelId = modelId;
  }
  return variable;
}

/** The variables a listing printed. */
export function parseKernelVariables(
  execution: KernelVariablesExecution
): KernelVariable[] {
  const payload = kernelVariablesPayload(execution);
  if (!Array.isArray(payload.variables)) {
    throw new KernelVariablesError('The kernel answered with no variables.');
  }
  return payload.variables
    .map(toKernelVariable)
    .filter((variable): variable is KernelVariable => variable !== undefined);
}

/** The variable a details query printed. */
export function parseKernelVariableDetails(
  execution: KernelVariablesExecution
): KernelVariableDetails {
  const payload = kernelVariablesPayload(execution);
  const raw = payload.variable as Record<string, unknown> | undefined;
  const variable = toKernelVariable(raw);
  if (!raw || !variable) {
    throw new KernelVariablesError('The kernel did not describe the variable.');
  }
  const data =
    raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)
      ? (raw.data as Record<string, unknown>)
      : {};
  return {
    ...variable,
    repr: text(raw.repr) ?? '',
    truncated: raw.truncated === true,
    data,
  };
}

/** Run the listing with an executor, in a kernel of `language`. */
export async function listKernelVariables(
  execute: KernelVariablesExecutor,
  options: { language?: string; modules?: boolean } = {}
): Promise<KernelVariable[]> {
  const language = kernelVariablesLanguage(options.language ?? 'python');
  if (!language) {
    throw new KernelVariablesError(
      `Variables are listed for Python kernels, not ${options.language}.`
    );
  }
  return parseKernelVariables(
    await execute(language.code({ modules: options.modules }))
  );
}

/** Read one variable in full with an executor. */
export async function inspectKernelVariable(
  execute: KernelVariablesExecutor,
  name: string,
  options: { language?: string } = {}
): Promise<KernelVariableDetails> {
  const language = kernelVariablesLanguage(options.language ?? 'python');
  if (!language) {
    throw new KernelVariablesError(
      `Variables are listed for Python kernels, not ${options.language}.`
    );
  }
  return parseKernelVariableDetails(await execute(language.code({ name })));
}

/** A size in bytes, for a reader: `1.2 KB`. */
export function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined) {
    return '';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return unit === 0
    ? `${value} ${units[unit]}`
    : `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
}

/** How big a variable is, in its own terms: `3 rows × 2 cols`, `5 items`. */
export function kernelVariableExtent(variable: KernelVariable): string {
  const { kind, shape, length, dtype } = variable;
  if (kind === 'dataframe' && shape?.length === 2) {
    return `${shape[0]} rows × ${shape[1]} cols`;
  }
  if (kind === 'series' && shape?.length) {
    return `${shape[0]} rows${dtype ? ` · ${dtype}` : ''}`;
  }
  if (kind === 'ndarray' && shape) {
    const dims = shape.length ? shape.join(' × ') : 'scalar';
    return dtype ? `${dims} · ${dtype}` : dims;
  }
  if (length !== undefined) {
    if (kind === 'mapping') {
      return `${length} ${length === 1 ? 'key' : 'keys'}`;
    }
    if (kind === 'string') {
      return `${length} ${length === 1 ? 'char' : 'chars'}`;
    }
    return `${length} ${length === 1 ? 'item' : 'items'}`;
  }
  return '';
}

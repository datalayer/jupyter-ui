# Tool Operations with OperationRunner - Usage Guide

## Architecture Overview

The tool system now follows a clean separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    LLM / User Code                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              OperationRunner.execute()                   │
│  - Coordinates execution                                 │
│  - Applies formatting based on context.format            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│            Operation.execute() [pure logic]              │
│  - insertCellOperation                                   │
│  - deleteCellOperation                                   │
│  - updateCellOperation                                   │
│  - readCellOperation                                     │
│  - readAllCellsOperation                                 │
│  - runCellOperation                                      │
│  - runAllCellsOperation                                  │
│  - executeCodeOperation                                  │
│  - insertCellsOperation                                  │
│  Returns: Pure typed data (ReadAllCellsResult, etc.)     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                Executor.execute()                        │
│  - DefaultExecutor (React/JupyterLab)                    │
│  - BridgeExecutor (VSCode)                               │
│  - Platform-specific implementations                     │
└─────────────────────────────────────────────────────────┘
```

## Key Principles

1. **Operations return pure typed data** - No formatting logic
2. **Runner handles formatting** - Based on `context.format`
3. **Type-safe results** - `Promise<TResult | string>`
4. **Format options**:
   - `format: 'json'` → Returns structured `TResult` (token-efficient for LLMs)
   - `format: 'toon'` → Returns TOON-encoded string (default, human-readable)

## Usage Examples

### Basic Usage

```typescript
import { OperationRunner } from '@datalayer/jupyter-ui-react/tools';
import { readAllCellsOperation } from '@datalayer/jupyter-ui-react/tools';
import type { ToolExecutionContext } from '@datalayer/jupyter-ui-react/tools';

// Create runner instance
const runner = new OperationRunner();

// Setup execution context
const context: ToolExecutionContext = {
  executor: myExecutor, // DefaultExecutor or BridgeExecutor
  notebookId: 'notebook-123',
  format: 'json', // or 'toon' (default)
};

// Execute operation
const result = await runner.execute(
  readAllCellsOperation,
  {}, // params
  context
);

// With format='json', result is ReadAllCellsResult:
// { success: true, cells: [...], cellCount: 2 }

// With format='toon', result is string:
// "success: true\ncells: [\n  { type: \"code\", ... }\n]\ncellCount: 2"
```

### For LLMs (JSON format - token efficient)

```typescript
const runner = new OperationRunner();

// LLMs benefit from structured data
const result = await runner.execute(
  readAllCellsOperation,
  {},
  {
    executor: myExecutor,
    notebookId: 'notebook-123',
    format: 'json', // Returns structured object
  }
);

// Type-safe access to result properties
if (typeof result === 'object') {
  console.log(`Found ${result.cellCount} cells`);
  result.cells.forEach(cell => {
    console.log(`Cell ${cell.index}: ${cell.type}`);
  });
}
```

### For Humans (TOON format - readable)

```typescript
const runner = new OperationRunner();

// Default format is TOON (human/LLM readable string)
const result = await runner.execute(
  executeCodeOperation,
  { code: 'import numpy as np\nprint(np.__version__)' },
  {
    executor: myExecutor,
    notebookId: 'notebook-123',
    // format defaults to 'toon'
  }
);

// Result is a TOON-encoded string:
// success: true
// outputs:
//   - type: stream
//     content:
//       name: stdout
//       text: "1.24.3"
// executionCount: 1
```

### All Operations Examples

#### 1. Insert Cell

```typescript
await runner.execute(
  insertCellOperation,
  {
    type: 'code',
    source: 'print("Hello, World!")',
    index: 0, // optional, defaults to end
  },
  context
);
// Returns: { success: true, index: 0, message: "Cell inserted at index 0" }
```

#### 2. Insert Multiple Cells

```typescript
await runner.execute(
  insertCellsOperation,
  {
    cells: [
      { type: 'markdown', source: '# Title' },
      { type: 'code', source: 'x = 42' },
    ],
    index: 1,
  },
  context
);
// Returns: { success: true, insertedCount: 2, startIndex: 1, message: "..." }
```

#### 3. Delete Cell

```typescript
await runner.execute(deleteCellOperation, { index: 2 }, context);
// Returns: { success: true, index: 2, message: "Cell at index 2 has been deleted..." }
```

#### 4. Update Cell

```typescript
await runner.execute(
  updateCellOperation,
  {
    index: 1,
    source: 'y = x * 2\nprint(y)',
  },
  context
);
// Returns: { success: true, index: 1, message: "✅ Cell at index 1 updated..." }
```

#### 5. Read Cell

```typescript
await runner.execute(readCellOperation, { index: 0 }, context);
// Returns: { success: true, type: 'code', source: '...', index: 0, ... }
```

#### 6. Read All Cells

```typescript
await runner.execute(readAllCellsOperation, {}, context);
// Returns: { success: true, cells: [...], cellCount: 5 }
```

#### 7. Run Cell

```typescript
await runner.execute(runCellOperation, { index: 1 }, context);
// Returns: { success: true, index: 1, message: "Cell executed successfully" }
```

#### 8. Run All Cells

```typescript
await runner.execute(runAllCellsOperation, {}, context);
// Returns: { success: true, message: "All cells executed" }
```

#### 9. Execute Code (Direct Kernel Execution)

```typescript
await runner.execute(
  executeCodeOperation,
  {
    code: 'import sys\nsys.version',
    storeHistory: false, // optional
    silent: false, // optional
    stopOnError: true, // optional
  },
  context
);
// Returns: { success: true, outputs: [...], executionCount: 1 }
```

## Type Safety

### Before (❌ Type Safety Issue)

```typescript
// Operations claimed to return typed objects but actually returned string | object
const result = await readAllCellsOperation.execute({}, context);
// TypeScript type: ReadAllCellsResult
// Runtime value: string (if format='toon') 💥 Type mismatch!
```

### Now (✅ Type Safe)

```typescript
// Runner has correct return type: TResult | string
const result = await runner.execute(readAllCellsOperation, {}, context);
// TypeScript type: ReadAllCellsResult | string ✅
// Runtime value matches TypeScript type ✅
```

## Integration with Existing Code

### In React Components

```typescript
import { OperationRunner, insertCellOperation } from '@datalayer/jupyter-ui-react/tools';
import { useExecutor } from './hooks/useExecutor';

function NotebookToolbar() {
  const executor = useExecutor();
  const runner = new OperationRunner();

  const handleAddCell = async () => {
    const result = await runner.execute(
      insertCellOperation,
      { type: 'code', source: '' },
      {
        executor,
        notebookId: currentNotebookId,
        format: 'json',
      }
    );

    if (typeof result === 'object' && result.success) {
      console.log(`Inserted cell at index ${result.index}`);
    }
  };

  return <button onClick={handleAddCell}>Add Cell</button>;
}
```

### In VSCode Extension

```typescript
import {
  OperationRunner,
  readAllCellsOperation,
} from '@datalayer/jupyter-ui-react/tools';
import { BridgeExecutor } from './executors/BridgeExecutor';

async function getAllCells(notebookUri: string) {
  const runner = new OperationRunner();
  const executor = new BridgeExecutor(notebookUri);

  const result = await runner.execute(
    readAllCellsOperation,
    {},
    {
      executor,
      notebookId: notebookUri,
      format: 'json', // Get structured data
    }
  );

  if (typeof result === 'object') {
    return result.cells;
  }
  throw new Error('Expected JSON format');
}
```

## Error Handling

```typescript
try {
  const result = await runner.execute(
    insertCellOperation,
    { type: 'code', source: 'print("test")' },
    context
  );

  if (typeof result === 'object' && result.success) {
    console.log('Success!');
  }
} catch (error) {
  // Errors are thrown for:
  // - Invalid parameters
  // - Missing notebookId
  // - Missing executor
  // - Execution failures
  console.error('Operation failed:', error.message);
}
```

## Migration Guide

### Old Pattern (Don't Use)

```typescript
// ❌ Don't call operations directly anymore
const result = await readAllCellsOperation.execute({}, context);
// Type mismatch between declared type and runtime value
```

### New Pattern (Use This)

```typescript
// ✅ Use OperationRunner
const runner = new OperationRunner();
const result = await runner.execute(readAllCellsOperation, {}, context);
// Correct types: TResult | string
```

## Benefits

1. **Type Safety** - No more hidden type mismatches
2. **Separation of Concerns** - Operations focus on logic, runner handles formatting
3. **Token Efficiency** - LLMs get structured `format='json'` data
4. **Flexibility** - Easy to add pre/post execution hooks later
5. **Testability** - Operations return predictable typed data
6. **DRY** - Formatting logic in one place (OperationRunner)

## Future Extensibility

The runner pattern allows easy addition of:

- Pre-execution validation hooks
- Post-execution logging/analytics
- Result caching
- Permission checks
- Rate limiting
- Retry logic

All without modifying individual operations!

## Testing

See [operationRunner.test.ts](../../__tests__/operationRunner.test.ts) for comprehensive test examples covering all 9 operations.

/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createState } from 'lexical';

// Shared NodeState for the counter value
export const counterValueState = createState('counter-value', {
  parse: (v: unknown) => (typeof v === 'number' ? v : undefined),
});

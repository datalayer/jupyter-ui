/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import { Greeter } from '../greeter';

test('My Greeter', () => {
  expect(Greeter('Datalayer')).toBe('Hello Datalayer');
});

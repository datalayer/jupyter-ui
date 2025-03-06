/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

export const CAN_USE_DOM: boolean =
  typeof window !== 'undefined' &&
  typeof window.document !== 'undefined' &&
  typeof window.document.createElement !== 'undefined';

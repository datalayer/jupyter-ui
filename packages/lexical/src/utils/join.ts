/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

export const joinClasses = (
  ...args: Array<string | boolean | null | undefined>
) => {
  return args.filter(Boolean).join(' ');
};

export default joinClasses;

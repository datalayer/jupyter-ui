/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

export const joinClasses = (
  ...args: Array<string | boolean | null | undefined>
) => {
  return args.filter(Boolean).join(' ');
};

export default joinClasses;

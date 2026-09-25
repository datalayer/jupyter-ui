/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import type { JSX } from 'react';
import { ReactNode } from 'react';

export const Placeholder = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element => {
  return <div className={className || 'Placeholder__root'}>{children}</div>;
};

export default Placeholder;

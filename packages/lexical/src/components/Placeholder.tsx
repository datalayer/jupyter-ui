/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import {ReactNode} from 'react';


export const Placeholder = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element => {
  return <div className={className || 'Placeholder__root'}>{children}</div>;
}

export default Placeholder;

/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { PropsWithChildren } from "react";
import { createPortal } from "react-dom";

export const Portal = ({children}: PropsWithChildren<any>) => {
  return typeof document === 'object'
    ? createPortal(children, document.body)
    : null;
}

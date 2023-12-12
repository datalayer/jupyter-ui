/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
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

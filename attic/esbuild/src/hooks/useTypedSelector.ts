/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import { createSelectorHook } from "react-redux";
import { RootState } from "../state";

export const useTypedSelector = createSelectorHook<RootState>();

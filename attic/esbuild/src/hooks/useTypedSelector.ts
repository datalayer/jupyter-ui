/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createSelectorHook } from "react-redux";
import { RootState } from "../state";

export const useTypedSelector = createSelectorHook<RootState>();

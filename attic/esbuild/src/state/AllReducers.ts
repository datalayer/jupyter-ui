/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import { combineReducers } from "redux";
import bundlesReducer from "./BundlesReducer";
import cellsReducer from "./CellsReducer";

const reducers = combineReducers({
  cells: cellsReducer,
  bundles: bundlesReducer
});

export default reducers;

export type RootState = ReturnType<typeof reducers>;

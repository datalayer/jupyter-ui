/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
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

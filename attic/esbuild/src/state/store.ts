/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import { applyMiddleware, createStore } from "redux";
import thunk from "redux-thunk";
import reducers from "./AllReducers";

export const store = createStore(reducers, {}, applyMiddleware(thunk));

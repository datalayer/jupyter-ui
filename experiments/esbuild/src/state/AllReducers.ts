import { combineReducers } from "redux";
import bundlesReducer from "./BundlesReducer";
import cellsReducer from "./CellsReducer";

const reducers = combineReducers({
  cells: cellsReducer,
  bundles: bundlesReducer
});

export default reducers;

export type RootState = ReturnType<typeof reducers>;

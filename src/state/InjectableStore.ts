import { createStore } from "redux";
import { reducers } from "./AllState";
/*
function createReducer(asyncReducers: any) {
  return combineReducers({
    ...reducers,
    ...asyncReducers,
  });
}
*/
function createInjectableStore() {
  const injectableStore = createStore(
//    createReducer({}),
    reducers,
  );
  (injectableStore as any).asyncReducers = {};
  /*
  (injectableStore as any).injectReducer = (key: any, asyncReducer: any) => {
    (injectableStore as any).asyncReducers[key] = asyncReducer;
    injectableStore.replaceReducer(createReducer((injectableStore as any).asyncReducers));
  }
  */
  return injectableStore;
}

const injectableStore = createInjectableStore();

export default injectableStore;

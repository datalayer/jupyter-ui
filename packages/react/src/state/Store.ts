import { applyMiddleware, createStore } from "redux";
import { createEpicMiddleware } from "redux-observable";
import { AnyAction, Success } from "typescript-fsa";
import { reducers, epics } from "./State";
// import { BehaviorSubject } from 'rxjs';
// import { mergeMap } from 'rxjs/operators';
// import { initEpics } from "./init/InitState";

const epicMiddleware = createEpicMiddleware<AnyAction, AnyAction, Success<any, any>, any>();
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
    applyMiddleware(epicMiddleware),
  );
  /*
  (injectableStore as any).asyncReducers = {};
  (injectableStore as any).injectReducer = (key: any, asyncReducer: any) => {
    (injectableStore as any).asyncReducers[key] = asyncReducer;
    injectableStore.replaceReducer(createReducer((injectableStore as any).asyncReducers));
  }
  */
  epicMiddleware.run(epics)
  return injectableStore;
}
/*
export const epic$ = new BehaviorSubject(initEpics);
const rootEpic = (action$: any, state$: any, deps: any) => epic$.pipe(
  mergeMap(epic => epic(action$, state$, deps))
);
epicMiddleware.run(rootEpic);
*/
const injectableStore = createInjectableStore();

export default injectableStore;

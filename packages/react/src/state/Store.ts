import { applyMiddleware, combineReducers, createStore } from "redux";
import { createEpicMiddleware } from "redux-observable";
import { AnyAction, Success } from "typescript-fsa";
import { initReducer } from "./InitState";

const epicMiddleware = createEpicMiddleware<AnyAction, AnyAction, Success<any, any>, any>();

function createReducer(asyncReducers: any) {
  return combineReducers({
    ...asyncReducers,
  });
}

function createInjectableStore() {
  const injectableStore = createStore(
    createReducer([initReducer]),
    applyMiddleware(epicMiddleware),
  );
  (injectableStore as any).asyncReducers = {};
  (injectableStore as any).inject = (key: string, asyncReducer: any, epic?: any) => {
    const reducer = (injectableStore as any).asyncReducers[key];
    if (!reducer) {
      if (epic) {
        epicMiddleware.run(epic);
      }
      (injectableStore as any).asyncReducers[key] = asyncReducer;
      const newReducer = createReducer((injectableStore as any).asyncReducers);
      injectableStore.replaceReducer(newReducer as any);  
    }
  }
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

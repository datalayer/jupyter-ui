import { applyMiddleware, createStore, combineReducers } from "redux";
import { createEpicMiddleware } from "redux-observable";
import { AnyAction, Success } from "typescript-fsa";
import { BehaviorSubject } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { initReducers, initEpics } from "./init/InitRedux";

const epicMiddleware = createEpicMiddleware<AnyAction, AnyAction, Success<any, any>, any>();

function createReducer(asyncReducers: any) {
  return combineReducers({
    ...initReducers,
    ...asyncReducers
  });
}

function createInjectableStore() {
  const injectableStore = createStore(
    createReducer({}),
    applyMiddleware(epicMiddleware)
  );
  (injectableStore as any).asyncReducers = {};
  (injectableStore as any).injectReducer = (key: any, asyncReducer: any) => {
    (injectableStore as any).asyncReducers[key] = asyncReducer;
    injectableStore.replaceReducer(createReducer((injectableStore as any).asyncReducers));
  }
  (injectableStore as any).injectEpic = (epic: any) => {
    epicMiddleware.run(epic);
  }
  return injectableStore;
}

export const epic$ = new BehaviorSubject(initEpics);
const rootEpic = (action$: any, state$: any, deps: any) => epic$.pipe(
  mergeMap(epic => epic(action$, state$, deps))
);
epicMiddleware.run(rootEpic);

const injectableStore = createInjectableStore();

export default injectableStore;

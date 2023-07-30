import { applyMiddleware, combineReducers, createStore, Store, ReducersMapObject } from "redux";
import { createEpicMiddleware } from "redux-observable";
import { AnyAction, Success } from "typescript-fsa";
import { initReducer } from "./InitState";
// import { BehaviorSubject } from "rxjs";
// import { mergeMap } from 'rxjs/operators';

export type InjectableStore = Store & {
  asyncReducers: ReducersMapObject,
  inject: (key: string, asyncReducer: any, epic?: any) => void,
}

const epicMiddleware = createEpicMiddleware<AnyAction, AnyAction, Success<any, any>, any>();

function createReducer(asyncReducers: ReducersMapObject) {
  return combineReducers({
    ...asyncReducers,
  });
}
/*
export const createEpics = (initEpics: any) => {
  const epic$ = new BehaviorSubject(initEpics);
  const rootEpic = (action$: any, state$: any, deps: any) => epic$.pipe(
    mergeMap(epic => epic(action$, state$, deps))
  );
  epicMiddleware.run(rootEpic as any);
}
*/
export const createInjectableStore = (store: Store): InjectableStore => {
  const injectableStore = store as InjectableStore;
  injectableStore.asyncReducers = {};
  injectableStore.inject = (key: string, asyncReducer: any, epic?: any) => {
    const reducer = injectableStore.asyncReducers[key];
    if (key === 'init' || !reducer) {
      if (epic) {
        epicMiddleware.run(epic);
      }
      injectableStore.asyncReducers[key] = asyncReducer;
      const newReducer = createReducer(injectableStore.asyncReducers);
      injectableStore.replaceReducer(newReducer);
    }
  }
  return injectableStore as InjectableStore;
}

export const createReduxEpicStore = () => createStore(
  createReducer({initReducer}),
  applyMiddleware(epicMiddleware),
);

const store = createReduxEpicStore();
const injectableStore = createInjectableStore(store);
injectableStore.inject('init', initReducer);

export default injectableStore;

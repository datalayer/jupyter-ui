import produce from "immer";
import { ActionType } from "./ActionTypes";
import { Action } from "./Actions";

interface BundlesState {
  [key: string]:
    | {
        loading: boolean;
        code: string;
        err: string;
      }
    | undefined;
}

const initialState: BundlesState = {};

const reducer = produce(
  (draft: BundlesState = initialState, action: Action): BundlesState => {
    switch (action.type) {
      case ActionType.BUNDLE_START:
        draft[action.payload.cellId] = {
          loading: true,
          code: "",
          err: ""
        };
        return draft;
      case ActionType.BUNDLE_COMPLETE:
        draft[action.payload.cellId] = {
          loading: false,
          code: action.payload.bundle.code,
          err: action.payload.bundle.err
        };
        return draft;
      default:
        return draft;
    }
  },
  initialState
);

export default reducer;

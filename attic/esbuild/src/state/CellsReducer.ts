import produce from "immer";
import { ActionType } from "./ActionTypes";
import { Action } from "./Actions";
import { Cell } from "./Cell";

interface CellsState {
  loading: boolean;
  error: string | null;
  order: string[];
  data: {
    [key: string]: Cell;
  };
}

const initialState: CellsState = {
  loading: false,
  error: null,
  order: [],
  data: {}
};

const reducer = produce(
  (draft: CellsState = initialState, action: Action): CellsState => {
    switch (action.type) {
      case ActionType.UPDATE_CELL:
        const { id, content } = action.payload;
        draft.data[id].content = content;
        return draft;
      case ActionType.DELETE_CELL:
        delete draft.data[action.payload];
        draft.order = draft.order.filter(id => id !== action.payload);
        return draft;
      case ActionType.MOVE_CELL:
        const { direction, id: currentId } = action.payload;
        const currentIndex = draft.order.findIndex(id => id === currentId);
        const targetIndex =
          direction === "up" ? currentIndex - 1 : currentIndex + 1;

        if (targetIndex < 0 || targetIndex > draft.order.length - 1)
          return draft;

        draft.order[currentIndex] = draft.order[targetIndex];
        draft.order[targetIndex] = currentId;
        return draft;
      case ActionType.INSERT_CELL_AFTER:
        const cell: Cell = {
          content: "",
          type: action.payload.type,
          id: randomId()
        };

        draft.data[cell.id] = cell;

        const foundIndex = draft.order.findIndex(
          id => id === action.payload.id
        );

        if (foundIndex < 0) draft.order.unshift(cell.id);
        else draft.order.splice(foundIndex + 1, 0, cell.id);

        return draft;
      default:
        return draft;
    }
  },
  initialState
);

const randomId = () => {
  return Math.random().toString(36).substr(2, 5);
};

export default reducer;

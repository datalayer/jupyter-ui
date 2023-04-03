import { createSelectorHook } from "react-redux";
import { RootState } from "../state";

export const useTypedSelector = createSelectorHook<RootState>();

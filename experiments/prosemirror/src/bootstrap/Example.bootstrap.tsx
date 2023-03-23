import { EditorState } from "prosemirror-state";
import json from "../doc/Doc";
import schema from "../schema/schema";
import createPlugins from "./../plugins/plugins";
import createView from "../view/View";

const doc = schema.nodeFromJSON(json);
const plugins = createPlugins(schema);

const state = EditorState.create({
  doc,
  plugins,
});

const div = document.querySelector("#editor") as HTMLDivElement;
const view = createView(div, state);

view.focus();

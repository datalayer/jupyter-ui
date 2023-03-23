import { Schema } from "prosemirror-model"
import { addListNodes } from "prosemirror-schema-list";
import { nodes } from "./nodes";
import { marks } from "./marks";

const basicSchema = new Schema({
  nodes,
  marks,
} as any);

const schema = new Schema({
  nodes: addListNodes(basicSchema.spec.nodes as any, "paragraph block*", "block"),
  marks: basicSchema.spec.marks,
});

export default schema;

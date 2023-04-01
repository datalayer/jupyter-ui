import { NodeType } from "prosemirror-model";
import { InputRule, inputRules, wrappingInputRule, textblockTypeInputRule, smartQuotes, emDash, ellipsis } from "prosemirror-inputrules";

export const strongMarkdown = new InputRule(/(\S|^)\*(.*)\*$/, (state: any, match: any, start: any, end: any) => {
  const { tr, schema } = state;
  const [, beforeMatchPos, text ] = match;
  return tr.replaceWith(start + beforeMatchPos.length, end, schema.text(text, [schema.marks.strong.create()])).setMeta('addToHistory', false);
});

export function blockQuoteRule(nodeType: NodeType) {
  return wrappingInputRule(/^\s*>\s$/, nodeType);
}

export function orderedListRule(nodeType: NodeType) {
  return wrappingInputRule(/^(\d+)\.\s$/, nodeType, (match: any) => ({order: +match[1]}), (match, node) => node.childCount + node.attrs.order == +match[1]);
}

export function bulletListRule(nodeType: NodeType) {
  return wrappingInputRule(/^\s*([-+*])\s$/, nodeType);
}

export function codeBlockRule(nodeType: NodeType) {
  return textblockTypeInputRule(/^```$/, nodeType);
}

export function headingRule(nodeType: NodeType, maxLevel: number) {
  return textblockTypeInputRule(new RegExp("^(#{1," + maxLevel + "})\\s$"), nodeType, (match: any) => ({level: match[1].length}));
}

export function buildInputRules(schema: any) {
  let rules = smartQuotes.concat(ellipsis, emDash), type
  if (type = schema.nodes.blockquote) rules.push(blockQuoteRule(type))
  if (type = schema.nodes.ordered_list) rules.push(orderedListRule(type))
  if (type = schema.nodes.bullet_list) rules.push(bulletListRule(type))
  if (type = schema.nodes.code_block) rules.push(codeBlockRule(type))
  if (type = schema.nodes.heading) rules.push(headingRule(type, 6))
  return inputRules({rules})
}

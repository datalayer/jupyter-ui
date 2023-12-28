/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */


import { Node } from "prosemirror-model"

const pDOM = ["p", 0];
const blockquoteDOM = ["blockquote", 0];
const hrDOM = ["hr"];
const preDOM = ["pre", ["code", 0]];
const brDOM = ["br"];

export const nodes = {
  doc: {
    content: "block+"
  },
  paragraph: {
    content: "inline*",
    group: "block",
    parseDOM: [{tag: "p"}],
    toDOM() { return pDOM }
  },
  blockquote: {
    content: "block+",
    group: "block",
    defining: true,
    parseDOM: [{tag: "blockquote"}],
    toDOM() { return blockquoteDOM }
  },
  horizontal_rule: {
    group: "block",
    parseDOM: [{tag: "hr"}],
    toDOM() { return hrDOM }
  },
  heading: {
    attrs: {level: {default: 1}},
    content: "inline*",
    group: "block",
    defining: true,
    parseDOM: [
      {tag: "h1", attrs: {level: 1}},
      {tag: "h2", attrs: {level: 2}},
      {tag: "h3", attrs: {level: 3}},
      {tag: "h4", attrs: {level: 4}},
      {tag: "h5", attrs: {level: 5}},
      {tag: "h6", attrs: {level: 6}},
    ],
    toDOM(node: Node) { return ["h" + node.attrs.level, 0] }
  },
  code_block: {
    content: "text*",
    marks: "",
    group: "block",
    code: true,
    defining: true,
    parseDOM: [{tag: "pre", preserveWhitespace: "full"}],
    toDOM() { return preDOM }
  },
  text: {
    group: "inline"
  },
  image: {
    inline: true,
    group: "inline",
    draggable: true,
    selectable: true,
    attrs: {
      src: {},
      alt: {default: null},
      title: {default: null}
    },
    parseDOM: [{tag: "img[src]", getAttrs(dom: any) {
      return {
        src: dom.getAttribute("src"),
        title: dom.getAttribute("title"),
        alt: dom.getAttribute("alt")
      }
    }}],
    toDOM(node: Node) { 
      const {src, alt, title} = node.attrs;
      return ["img", {src, alt, title}]
    }
  },
  hashtag_block: {
    content: "text*",
    group: "block",
    selectable: true,
    draggable: true,
    toDOM: () => [ "div", { class: "hashtag" }, 0 ],
    parseDOM: [ { hashtag_block: "div.hashtag" } ],
  },
  hashtag_inline: {
    group: "inline",
    content: "text*",
    inline: true,
    draggable: true,
    selectable: true,
    toDOM: () => [ "hashtag", 0 ],
    parseDOM: [{ hashtab_inline: "hashtag" }],
  },
  lumino: {
    content: "text*",
    group: "block",
    selectable: true,
    draggable: true,
    toDOM: () => [ "div", { class: "lumino" }, 0 ],
    parseDOM: [ { lumino: "div.lumino" } ],
  },
  cell: {
    content: "text*",
    group: "block",
    selectable: true,
    draggable: true,
    toDOM: () => [ "div", { class: "cell" }, 0 ],
    parseDOM: [ { lumino: "div.cell" } ],
  },
  hard_break: {
    inline: true,
    group: "inline",
    selectable: false,
    parseDOM: [{tag: "br"}],
    toDOM() { return brDOM }
  }
}

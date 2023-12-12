/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import { Node } from "prosemirror-model"

const emDOM = ["em", 0];
const strongDOM = ["strong", 0];
const codeDOM = ["code", 0];

export const marks = {
  link: {
    attrs: {
      href: {},
      title: {default: null}
    },
    inclusive: false,
    parseDOM: [
      {
        tag: "a[href]",
        getAttrs(dom: any) {
          return {href: dom.getAttribute("href"), title: dom.getAttribute("title")}
        }
      }
    ],
    toDOM(node: Node) { let {href, title} = node.attrs; return ["a", {href, title}, 0] }
  },
  em: {
    parseDOM: [
      {tag: "i"},
      {tag: "em"},
      {style: "font-style=italic"}
    ],
    toDOM() { return emDOM }
  },
  strong: {
    parseDOM: [
      {tag: "strong"},
      {tag: "b", getAttrs: (node: any) => node.style.fontWeight != "normal" && null},
      {style: "font-weight", getAttrs: (value: any) => /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null}
    ],
    toDOM() { return strongDOM }
  },
  code: {
    parseDOM: [
      {tag: "code"}
    ],
    toDOM() { return codeDOM }
  }
}

import { BaseEditor, Descendant, Text } from "slate";
import { ReactEditor } from "slate-react";
import { HistoryEditor } from "slate-history";
import { IOutputProps } from '@datalayer/jupyter-react';

export type JupyterOutput = React.FunctionComponentElement<IOutputProps>

export type BlockQuoteElement = { type: "block-quote"; children: Descendant[] };
export type BulletedListElement = { type: "bulleted-list"; children: ListItemElement[] };
export type NumberedListElement = { type: "numbered-list"; children: ListItemElement[] };
export type CheckListItemElement = { type: "check-list-item"; checked: boolean; children: Descendant[] };
export type CodeElement = { type: "code"; children: Descendant[] };
export type EditableVoidElement = { type: "editable-void"; children: EmptyText[] };
export type HeadingElement = { type: "heading"; children: Descendant[] };
export type HeadingOneElement = { type: "h1"; children: Descendant[] };
export type HeadingTwoElement = { type: "h2"; children: Descendant[] };
export type HeadingThreeElement = { type: "h3"; children: Descendant[] };
export type ImageElement = { type: "image"; url: string; children: EmptyText[] };
export type LinkElement = { type: "link"; url: string; children: Descendant[] };
export type ListItemElement = { type: "list-item"; children: Descendant[] };
export type MarkElement = { type: "mark"; children: Descendant[] };
export type MentionElement = { type: "mention"; character: string; children: Descendant[]; };
export type ParagraphElement = { type: "paragraph"; children: Descendant[] };
export type TableCellElement = { type: "table-cell"; children: Descendant[] };
export type TableRowElement = { type: "table-row"; children: TableCellElement[] };
export type TableElement = { type: "table"; children: TableRowElement[] };
export type TitleElement = { type: "title"; children: Descendant[] };
export type VideoElement = { type: "video"; url: string; children: EmptyText[] };
export type TagElement = { type: "tag"; value?: string, num?: number; children: EmptyText[] };
export type JupyterCellElement = { type: 'jupyter-cell'; output: JupyterOutput; executeTrigger: number; clearTrigger: number; children: Text[] }
export type JupyterFileBrowserElement = { type: 'jupyter-filebrowser'; children: EmptyText[] }

export type CustomElement =
  | BlockQuoteElement
  | BulletedListElement
  | NumberedListElement
  | CheckListItemElement
  | CodeElement
  | EditableVoidElement
  | HeadingElement
  | HeadingOneElement
  | HeadingTwoElement
  | HeadingThreeElement
  | ImageElement
  | LinkElement
  | ListItemElement
  | MarkElement
  | MentionElement
  | ParagraphElement
  | TableElement
  | TableRowElement
  | TableCellElement
  | TitleElement
  | VideoElement
  | TagElement
  | JupyterCellElement
  | JupyterFileBrowserElement
  ;

export type EmptyText = {
  text: string;
}

export type CustomText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  code?: boolean;
}

export type CustomEditor = BaseEditor & ReactEditor & HistoryEditor;

declare module "slate" {
  interface CustomTypes {
    Editor: CustomEditor;
    Element: CustomElement;
    Text: CustomText & EmptyText;
  }
}

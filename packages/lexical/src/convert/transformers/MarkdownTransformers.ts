/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import type {
  ElementTransformer,
  TextMatchTransformer,
  Transformer,
} from './../markdown';
import type { ElementNode, LexicalNode, Klass } from 'lexical';

import {
  CHECK_LIST,
  ELEMENT_TRANSFORMERS,
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
} from './../markdown';
import {
  $createHorizontalRuleNode,
  $isHorizontalRuleNode,
  HorizontalRuleNode,
} from '@lexical/react/LexicalHorizontalRuleNode';
import {
  $createTableCellNode,
  $createTableNode,
  $createTableRowNode,
  $isTableNode,
  $isTableRowNode,
  TableCellHeaderStates,
  TableCellNode,
  TableNode,
  TableRowNode,
  $isTableCellNode,
} from '@lexical/table';
import {
  $createParagraphNode,
  $createTextNode,
  $isElementNode,
  $isParagraphNode,
  $isTextNode,
} from 'lexical';

import {
  $createEquationNode,
  $isEquationNode,
  EquationNode,
} from '../../nodes/EquationNode';
import {
  $createImageNode,
  $isImageNode,
  ImageNode,
} from '../../nodes/ImageNode';

export const HR: ElementTransformer = {
  dependencies: [HorizontalRuleNode as unknown as Klass<LexicalNode>],
  export: (node: LexicalNode) => {
    return $isHorizontalRuleNode(node) ? '***' : null;
  },
  regExp: /^(---|\*\*\*|___)\s?$/,
  replace: (parentNode, _1, _2, isImport) => {
    const line = $createHorizontalRuleNode() as unknown as LexicalNode;

    // TODO: Get rid of isImport flag
    if (isImport || parentNode.getNextSibling() != null) {
      parentNode.replace(line);
    } else {
      parentNode.insertBefore(line);
    }

    // Note: selectNext() is not available on HorizontalRuleNode
    // line.selectNext();
  },
  type: 'element',
};

export const IMAGE: TextMatchTransformer = {
  dependencies: [ImageNode],
  export: (node, exportChildren, exportFormat) => {
    if (!$isImageNode(node)) {
      return null;
    }

    return `![${node.getAltText()}](${node.getSrc()})`;
  },
  importRegExp: /!(?:\[([^[]*)\])(?:\(([^(]+)\))/,
  regExp: /!(?:\[([^[]*)\])(?:\(([^(]+)\))$/,
  replace: (textNode, match) => {
    const [, altText, src] = match;
    const imageNode = $createImageNode({
      altText,
      maxWidth: 800,
      src,
    });
    textNode.replace(imageNode);
  },
  trigger: ')',
  type: 'text-match',
};

/**
 * A paragraph that is one displayed equation: `$$…$$` on a line of its own,
 * the way a notebook's Markdown cell writes one. Before the inline `$…$`
 * transformer, which would otherwise read the inside of the `$$` pair and
 * leave a stray dollar sign on each side.
 */
export const DISPLAY_EQUATION: ElementTransformer = {
  dependencies: [EquationNode],
  export: (node: LexicalNode) => {
    if (!$isParagraphNode(node) || node.getChildrenSize() !== 1) {
      return null;
    }
    const equation = node.getFirstChild();
    if (!$isEquationNode(equation) || equation.__inline) {
      return null;
    }
    return `$$${equation.getEquation()}$$`;
  },
  regExp: /^\$\$(.+?)\$\$\s?$/,
  replace: (parentNode, _children, match) => {
    const paragraph = $createParagraphNode();
    paragraph.append($createEquationNode(match[1].trim(), false));
    parentNode.replace(paragraph);
  },
  type: 'element',
};

export const EQUATION: TextMatchTransformer = {
  dependencies: [EquationNode],
  export: (node, exportChildren, exportFormat) => {
    if (!$isEquationNode(node)) {
      return null;
    }

    return `$${node.getEquation()}$`;
  },
  importRegExp: /\$([^$].+?)\$/,
  regExp: /\$([^$].+?)\$$/,
  replace: (textNode, match) => {
    const [, equation] = match;
    const equationNode = $createEquationNode(equation, true);
    textNode.replace(equationNode);
  },
  trigger: '$',
  type: 'text-match',
};

// Very primitive table setup
const TABLE_ROW_REG_EXP = /^(?:\|)(.+)(?:\|)\s?$/;
/** A cell of a GFM divider row: dashes, with optional alignment colons. */
const TABLE_DIVIDER_CELL_REG_EXP = /^:?-+:?$/;

export const TABLE: ElementTransformer = {
  dependencies: [TableNode, TableRowNode, TableCellNode],
  export: (
    node: LexicalNode,
    exportChildren: (elementNode: ElementNode) => string,
  ) => {
    if (!$isTableNode(node)) {
      return null;
    }

    const output = [];

    for (const row of node.getChildren()) {
      const rowOutput = [];

      if ($isTableRowNode(row)) {
        for (const cell of row.getChildren()) {
          // It's TableCellNode (hence ElementNode) so it's just to make flow happy
          if ($isElementNode(cell)) {
            rowOutput.push(exportChildren(cell));
          }
        }
      }

      output.push(`| ${rowOutput.join(' | ')} |`);
      // GFM wants a divider after the header row; Lexical marks such a row
      // by its cells' header state.
      if (
        output.length === 1 &&
        $isTableRowNode(row) &&
        row.getChildrenSize() > 0 &&
        row
          .getChildren()
          .every(cell => $isTableCellNode(cell) && cell.hasHeader())
      ) {
        output.push(`| ${rowOutput.map(() => '---').join(' | ')} |`);
      }
    }

    return output.join('\n');
  },
  regExp: TABLE_ROW_REG_EXP,
  replace: (parentNode, _1, match) => {
    const matchCells = mapToTableCells(match[0]);

    if (matchCells == null) {
      return;
    }

    const rows = [matchCells];
    let sibling = parentNode.getPreviousSibling();
    let maxCells = matchCells.length;

    while (sibling) {
      if (!$isParagraphNode(sibling)) {
        break;
      }

      if (sibling.getChildrenSize() !== 1) {
        break;
      }

      const firstChild = sibling.getFirstChild();

      if (!$isTextNode(firstChild)) {
        break;
      }

      const cells = mapToTableCells(firstChild.getTextContent());

      if (cells == null) {
        break;
      }

      maxCells = Math.max(maxCells, cells.length);
      rows.unshift(cells);
      const previousSibling = sibling.getPreviousSibling();
      sibling.remove();
      sibling = previousSibling;
    }

    // A GFM divider row (`| --- | :-: |`) is not content: it names the row
    // before it the header.
    const dividerIndex = rows.findIndex(cells =>
      cells.every(cell =>
        TABLE_DIVIDER_CELL_REG_EXP.test(cell.getTextContent().trim()),
      ),
    );
    if (dividerIndex === 0) {
      // The rows before it were already made a table, line by line: the
      // divider names that table's last row the header, and goes.
      const previous = parentNode.getPreviousSibling();
      if ($isTableNode(previous)) {
        const lastRow = previous.getLastChild();
        if ($isTableRowNode(lastRow)) {
          lastRow.getChildren().forEach(cell => {
            if ($isTableCellNode(cell)) {
              cell.setHeaderStyles(
                TableCellHeaderStates.ROW,
                TableCellHeaderStates.ROW,
              );
            }
          });
        }
        parentNode.remove();
        return;
      }
    }
    const headerRows = dividerIndex > 0 ? dividerIndex : 0;
    if (dividerIndex >= 0) {
      rows.splice(dividerIndex, 1);
    }
    if (rows.length === 0) {
      parentNode.remove();
      return;
    }

    const table = $createTableNode();

    for (const [rowIndex, cells] of rows.entries()) {
      const tableRow = $createTableRowNode();
      table.append(tableRow);

      for (let i = 0; i < maxCells; i++) {
        const cell = i < cells.length ? cells[i] : createTableCell(null);
        if (rowIndex < headerRows) {
          cell.setHeaderStyles(
            TableCellHeaderStates.ROW,
            TableCellHeaderStates.ROW,
          );
        }
        tableRow.append(cell);
      }
    }

    const previousSibling = parentNode.getPreviousSibling();
    if (
      $isTableNode(previousSibling) &&
      getTableColumnsSize(previousSibling) === maxCells
    ) {
      previousSibling.append(...table.getChildren());
      parentNode.remove();
    } else {
      parentNode.replace(table);
    }

    table.selectEnd();
  },
  type: 'element',
};

function getTableColumnsSize(table: TableNode) {
  const row = table.getFirstChild();
  return $isTableRowNode(row) ? row.getChildrenSize() : 0;
}

const createTableCell = (
  textContent: string | null | undefined,
): TableCellNode => {
  const cell = $createTableCellNode(TableCellHeaderStates.NO_STATUS);
  const paragraph = $createParagraphNode();

  if (textContent != null) {
    paragraph.append($createTextNode(textContent.trim()));
  }

  cell.append(paragraph);
  return cell;
};

const mapToTableCells = (textContent: string): Array<TableCellNode> | null => {
  // TODO:
  // For now plain text, single node. Can be expanded to more complex content
  // including formatted text
  const match = textContent.match(TABLE_ROW_REG_EXP);

  if (!match || !match[1]) {
    return null;
  }

  return match[1].split('|').map(text => createTableCell(text));
};

export const PLAYGROUND_TRANSFORMERS: Array<Transformer> = [
  DISPLAY_EQUATION,
  TABLE,
  HR,
  IMAGE,
  EQUATION,
  CHECK_LIST,
  ...ELEMENT_TRANSFORMERS,
  ...TEXT_FORMAT_TRANSFORMERS,
  ...TEXT_MATCH_TRANSFORMERS,
];

/**
 * @jest-environment jsdom
 */
/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * LaTeX out of a document, and the document back out of the LaTeX.
 *
 * The first half writes a document holding one of everything the
 * transformers know and checks the LaTeX one would write by hand is what
 * comes out. The second half reads that LaTeX back and checks the same
 * document is there, then reads an article written by hand — preamble,
 * comments, AMS environments, a float, a `minted` listing — the way a person
 * writes one rather than the way the exporter does.
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';

// The notebook stack behind the Jupyter nodes is only reached when they
// render; importing it here would drag a service worker into the test.
jest.mock('@datalayer/jupyter-react', () => ({ __esModule: true }));

import { createHeadlessEditor } from '@lexical/headless';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isParagraphNode,
  $isTextNode,
  $nodesOfType,
  type LexicalEditor,
} from 'lexical';
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  HeadingNode,
  QuoteNode,
} from '@lexical/rich-text';
import {
  $createListItemNode,
  $createListNode,
  $isListNode,
  ListItemNode,
  ListNode,
} from '@lexical/list';
import { $createCodeNode, CodeHighlightNode, CodeNode } from '@lexical/code';
import { $createLinkNode, AutoLinkNode, LinkNode } from '@lexical/link';
import {
  $createTableNodeWithDimensions,
  $isTableNode,
  TableCellHeaderStates,
  TableCellNode,
  TableNode,
  TableRowNode,
} from '@lexical/table';
import {
  $createHorizontalRuleNode,
  HorizontalRuleNode,
} from '@lexical/react/LexicalHorizontalRuleNode';
import { $createEquationNode, EquationNode } from '../../../nodes/EquationNode';
import { $createImageNode, ImageNode } from '../../../nodes/ImageNode';
import { $createYouTubeNode, YouTubeNode } from '../../../nodes/YouTubeNode';
import {
  $createJupyterInputNode,
  JupyterInputNode,
} from '../../../nodes/JupyterInputNode';
import { JupyterInputHighlightNode } from '../../../nodes/JupyterInputHighlightNode';
import { $convertFromLatexString, $convertToLatexString } from '..';

const NODES = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  CodeNode,
  CodeHighlightNode,
  LinkNode,
  AutoLinkNode,
  TableNode,
  TableRowNode,
  TableCellNode,
  HorizontalRuleNode,
  EquationNode,
  ImageNode,
  YouTubeNode,
  JupyterInputNode,
  JupyterInputHighlightNode,
];

let editor: LexicalEditor;

const update = (fn: () => void) => editor.update(fn, { discrete: true });
const read = <T>(fn: () => T): T => editor.getEditorState().read(fn);
const exported = () => read(() => $convertToLatexString());
const blockTypes = () =>
  read(() =>
    $getRoot()
      .getChildren()
      .map(n => n.getType()),
  );

/** The text of each item of a list, in document order. */
function itemTexts(list: ListNode): string[] {
  return list.getChildren().map(item => item.getTextContent());
}

/** A document with one of everything. */
function $writeFixture() {
  const root = $getRoot();
  root.append($createHeadingNode('h1').append($createTextNode('Title')));

  const paragraph = $createParagraphNode();
  paragraph.append($createTextNode('Plain, '));
  paragraph.append($createTextNode('bold').toggleFormat('bold'));
  paragraph.append($createTextNode(', '));
  paragraph.append($createTextNode('italic').toggleFormat('italic'));
  paragraph.append($createTextNode(', '));
  paragraph.append($createTextNode('code').toggleFormat('code'));
  paragraph.append($createTextNode(', '));
  paragraph.append(
    $createLinkNode('https://example.com').append($createTextNode('a link')),
  );
  paragraph.append($createTextNode(', math '));
  paragraph.append($createEquationNode('x^2', true));
  paragraph.append($createTextNode(' and 50% & _x_ #1.'));
  root.append(paragraph);

  root.append($createQuoteNode().append($createTextNode('A quote.')));

  const bullets = $createListNode('bullet');
  bullets.append($createListItemNode().append($createTextNode('one')));
  const nestedHolder = $createListItemNode();
  const nested = $createListNode('bullet');
  nested.append($createListItemNode().append($createTextNode('one point one')));
  nestedHolder.append(nested);
  bullets.append(nestedHolder);
  bullets.append($createListItemNode().append($createTextNode('two')));
  root.append(bullets);

  const numbers = $createListNode('number');
  numbers.append($createListItemNode().append($createTextNode('first')));
  numbers.append($createListItemNode().append($createTextNode('second')));
  root.append(numbers);

  const checks = $createListNode('check');
  checks.append($createListItemNode(true).append($createTextNode('done')));
  checks.append($createListItemNode(false).append($createTextNode('todo')));
  root.append(checks);

  root.append(
    $createCodeNode('javascript').append($createTextNode('const a = 1;')),
  );
  root.append(
    $createJupyterInputNode('python').append($createTextNode('print("hi")')),
  );
  root.append($createHorizontalRuleNode() as never);
  root.append(
    $createParagraphNode().append(
      $createImageNode({
        altText: 'A picture',
        maxWidth: 800,
        src: 'https://example.com/img.png',
      }),
    ),
  );
  root.append(
    $createParagraphNode().append($createEquationNode('E = mc^2', false)),
  );

  const table = $createTableNodeWithDimensions(2, 2, true);
  const cellTexts = [
    ['Name', 'Value'],
    ['a', '1'],
  ];
  table.getChildren().forEach((row, r) => {
    (row as TableRowNode).getChildren().forEach((cell, c) => {
      const cellParagraph = (cell as TableCellNode).getFirstChild();
      if ($isParagraphNode(cellParagraph)) {
        cellParagraph.append($createTextNode(cellTexts[r][c]));
      }
    });
  });
  root.append(table);
  root.append($createYouTubeNode('dQw4w9WgXcQ'));
}

beforeEach(() => {
  editor = createHeadlessEditor({
    nodes: NODES,
    onError: error => {
      throw error;
    },
  });
});

describe('export', () => {
  it('writes the LaTeX one would write by hand for every block', () => {
    update($writeFixture);
    const latex = exported();
    expect(latex).toContain('\\section{Title}');
    expect(latex).toContain(
      'Plain, \\textbf{bold}, \\textit{italic}, \\texttt{code}, \\href{https://example.com}{a link}, math $x^2$ and 50\\% \\& \\_x\\_ \\#1.',
    );
    expect(latex).toContain('\\begin{quote}\nA quote.\n\\end{quote}');
    expect(latex).toContain(
      '\\begin{itemize}\n  \\item one\n  \\begin{itemize}\n    \\item one point one\n  \\end{itemize}\n  \\item two\n\\end{itemize}',
    );
    expect(latex).toContain(
      '\\begin{enumerate}\n  \\item first\n  \\item second\n\\end{enumerate}',
    );
    expect(latex).toContain('\\item[$\\boxtimes$] done');
    expect(latex).toContain('\\item[$\\square$] todo');
    expect(latex).toContain(
      '\\begin{lstlisting}[language=JavaScript]\nconst a = 1;\n\\end{lstlisting}',
    );
    expect(latex).toContain(
      '\\begin{lstlisting}[language=Python]\nprint("hi")\n\\end{lstlisting}',
    );
    expect(latex).toContain('\\noindent\\hrulefill');
    expect(latex).toContain(
      '\\begin{figure}[h]\n\\centering\n\\includegraphics[width=\\linewidth]{https://example.com/img.png}\n\\caption{A picture}\n\\end{figure}',
    );
    expect(latex).toContain('\\[\nE = mc^2\n\\]');
    expect(latex).toContain(
      '\\begin{tabular}{|l|l|}\n\\hline\nName & Value \\\\\n\\hline\na & 1 \\\\\n\\hline\n\\end{tabular}',
    );
    expect(latex).toContain(
      '\\url{https://www.youtube.com/watch?v=dQw4w9WgXcQ}',
    );
  });

  it('wraps a complete document on request', () => {
    update(() => {
      $getRoot().append($createParagraphNode().append($createTextNode('Body')));
    });
    const latex = read(() =>
      $convertToLatexString(undefined, { document: true, title: 'A & B' }),
    );
    expect(latex.startsWith('\\documentclass{article}\n')).toBe(true);
    expect(latex).toContain('\\usepackage{amsmath}');
    expect(latex).toContain('\\title{A \\& B}');
    expect(latex).toContain(
      '\\begin{document}\n\\maketitle\n\nBody\n\n\\end{document}',
    );
  });
});

describe('import', () => {
  it('reads back what the export wrote', () => {
    update($writeFixture);
    const before = blockTypes();
    const latex = exported();
    update(() => {
      $getRoot().clear();
      $convertFromLatexString(latex);
    });
    // A listing reads back as an executable input, as a fenced block does in
    // markdown: LaTeX does not tell a snippet from a cell.
    expect(blockTypes()).toEqual(
      before.map(type => (type === 'code' ? 'jupyter-input' : type)),
    );
    read(() => {
      const [heading, paragraph, quote, bullets, numbers, checks, code, input] =
        $getRoot().getChildren();
      expect($isHeadingNode(heading) && heading.getTag()).toBe('h1');
      expect(heading.getTextContent()).toBe('Title');
      const texts = (paragraph as never as ListNode).getChildren();
      const bold = texts.find(n => $isTextNode(n) && n.hasFormat('bold'));
      expect(bold?.getTextContent()).toBe('bold');
      expect(texts.some(n => $isTextNode(n) && n.hasFormat('code'))).toBe(true);
      expect(paragraph.getTextContent()).toContain('50% & _x_ #1.');
      expect($nodesOfType(LinkNode)[0].getURL()).toBe('https://example.com');
      expect(quote.getTextContent()).toBe('A quote.');
      expect($isListNode(bullets) && bullets.getListType()).toBe('bullet');
      expect($nodesOfType(ListNode).length).toBe(4);
      expect($isListNode(numbers) && numbers.getListType()).toBe('number');
      expect($isListNode(checks) && checks.getListType()).toBe('check');
      const [done, todo] = (checks as ListNode).getChildren() as ListItemNode[];
      expect([done.getChecked(), todo.getChecked()]).toEqual([true, false]);
      expect((code as JupyterInputNode).getLanguage()).toBe('javascript');
      expect(code.getTextContent()).toBe('const a = 1;');
      expect((input as JupyterInputNode).getLanguage()).toBe('python');
      const equations = $nodesOfType(EquationNode);
      expect(equations.map(e => [e.getEquation(), e.__inline])).toEqual([
        ['x^2', true],
        ['E = mc^2', false],
      ]);
      const image = $nodesOfType(ImageNode)[0];
      expect([image.getSrc(), image.getAltText()]).toEqual([
        'https://example.com/img.png',
        'A picture',
      ]);
      const table = $nodesOfType(TableNode)[0];
      expect($isTableNode(table)).toBe(true);
      const cells = $nodesOfType(TableCellNode);
      expect(cells.map(c => c.getTextContent())).toEqual([
        'Name',
        'Value',
        'a',
        '1',
      ]);
      expect(
        cells
          .slice(0, 2)
          .every(c => c.hasHeaderState(TableCellHeaderStates.ROW)),
      ).toBe(true);
      expect(cells.slice(2).some(c => c.hasHeader())).toBe(false);
      expect($nodesOfType(YouTubeNode)[0].getId()).toBe('dQw4w9WgXcQ');
    });
  });

  it('reads an article written by hand', () => {
    const article = String.raw`
\documentclass{article}
\usepackage{amsmath}
\title{Notes}
\begin{document}
\maketitle
% a comment line
\section*{Introduction}
Some \emph{emphasis}, \textbf{\texttt{bold code}}, a footnote\footnote{noted}, 100\% sure\ldots
a second line of the same paragraph.

\subsection{Steps}
\begin{enumerate}
  \item First
  \item Second, with
    \begin{itemize}
      \item a nested point
    \end{itemize}
  \item Third
\end{enumerate}

\begin{align*}
  a &= b + c \\
  d &= e
\end{align*}

\begin{verbatim}
raw text % not a comment
\end{verbatim}

\begin{minted}{python}
import os
print(os.getcwd())
\end{minted}

\begin{table}[h]
\centering
\begin{tabular}{lr}
\toprule
Item & Count \\
\midrule
Apples & 3 \\
Pears & 5 \\
\bottomrule
\end{tabular}
\end{table}

\begin{figure}[t]
\includegraphics[width=0.5\textwidth]{plots/loss.png}
\caption{Training loss}
\end{figure}

Line one\\
line two.

Price: \$5, \$\$ more, and \[ x \] displayed.

\url{https://youtu.be/dQw4w9WgXcQ}
\end{document}
`;
    update(() => $convertFromLatexString(article));
    expect(blockTypes()).toEqual([
      'heading',
      'heading',
      'paragraph',
      'heading',
      'list',
      'paragraph',
      'code',
      'jupyter-input',
      'table',
      'paragraph',
      'paragraph',
      'paragraph',
      'paragraph',
      'paragraph',
      'youtube',
    ]);
    read(() => {
      const [
        title,
        intro,
        paragraph,
        steps,
        list,
        math,
        verbatim,
        minted,
        table,
        figure,
        lines,
      ] = $getRoot().getChildren();
      expect($isHeadingNode(title) && title.getTag()).toBe('h1');
      expect(title.getTextContent()).toBe('Notes');
      expect(intro.getTextContent()).toBe('Introduction');
      expect(paragraph.getTextContent()).toBe(
        'Some emphasis, bold code, a footnote (noted), 100% sure… a second line of the same paragraph.',
      );
      const runs = (paragraph as ListNode).getChildren();
      expect(runs.find(r => r.getTextContent() === 'emphasis')).toBeDefined();
      const boldCode = runs.find(r => r.getTextContent() === 'bold code');
      expect(
        $isTextNode(boldCode) &&
          boldCode.hasFormat('bold') &&
          boldCode.hasFormat('code'),
      ).toBe(true);
      expect($isHeadingNode(steps) && steps.getTag()).toBe('h2');
      expect($isListNode(list) && list.getListType()).toBe('number');
      expect(itemTexts(list as ListNode)).toEqual([
        'First',
        'Second, with',
        'a nested point',
        'Third',
      ]);
      const holder = (list as ListNode).getChildren()[2] as ListItemNode;
      expect($isListNode(holder.getFirstChild())).toBe(true);
      const equation = $nodesOfType(EquationNode)[0];
      expect(equation.getEquation()).toBe(
        '\\begin{aligned}a &= b + c \\\\\n  d &= e\\end{aligned}',
      );
      expect(equation.__inline).toBe(false);
      expect(math.getTextContent()).toBe(equation.getTextContent());
      expect(verbatim.getTextContent()).toBe('raw text % not a comment');
      expect((minted as JupyterInputNode).getLanguage()).toBe('python');
      expect(minted.getTextContent()).toBe('import os\nprint(os.getcwd())');
      const cells = (table as TableNode)
        .getChildren()
        .flatMap(row => (row as TableRowNode).getChildren()) as TableCellNode[];
      expect(cells.map(c => c.getTextContent())).toEqual([
        'Item',
        'Count',
        'Apples',
        '3',
        'Pears',
        '5',
      ]);
      expect(cells[0].hasHeaderState(TableCellHeaderStates.ROW)).toBe(true);
      expect(cells[2].hasHeader()).toBe(false);
      const image = $nodesOfType(ImageNode)[0];
      expect(figure.getTextContent()).toBe(image.getTextContent());
      expect([image.getSrc(), image.getAltText()]).toEqual([
        'plots/loss.png',
        'Training loss',
      ]);
      expect(lines.getTextContent()).toBe('Line one\nline two.');
      const [price, , displayed] = $getRoot().getChildren().slice(-4, -1);
      expect(price.getTextContent()).toBe('Price: $5, $$ more, and');
      expect(
        $nodesOfType(EquationNode).some(
          e => e.getEquation() === 'x' && !e.__inline,
        ),
      ).toBe(true);
      expect(displayed.getTextContent()).toBe('displayed.');
      expect($nodesOfType(YouTubeNode)[0].getId()).toBe('dQw4w9WgXcQ');
    });
  });
});

/**
 * @jest-environment jsdom
 */
/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The templates read, and the features they need.
 *
 * One sample per Overleaf category, each written in the idiom of its
 * best-known template. Reading one must give the document it describes —
 * the two columns of an IEEE article, a beamer frame's blocks and columns, a
 * CV's entries, a letter's opening and signature — and writing it back out
 * and in again must give the same blocks. Then the features on their own:
 * macros, `\multicolumn`, description lists, dashes and quotes, citations.
 */

import { describe, expect, it, jest } from '@jest/globals';

jest.mock('@datalayer/jupyter-react', () => ({ __esModule: true }));

import { createHeadlessEditor } from '@lexical/headless';
import {
  $getRoot,
  $isElementNode,
  $isParagraphNode,
  $isTextNode,
  $nodesOfType,
  type LexicalEditor,
  type LexicalNode,
} from 'lexical';
import { $isHeadingNode, HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { EquationNode } from '../../../nodes/EquationNode';
import { ImageNode } from '../../../nodes/ImageNode';
import { YouTubeNode } from '../../../nodes/YouTubeNode';
import { JupyterInputNode } from '../../../nodes/JupyterInputNode';
import { JupyterInputHighlightNode } from '../../../nodes/JupyterInputHighlightNode';
import {
  $isLayoutContainerNode,
  LayoutContainerNode,
} from '../../../nodes/LayoutContainerNode';
import { LayoutItemNode } from '../../../nodes/LayoutItemNode';
import {
  $isCollapsibleContainerNode,
  CollapsibleContainerNode,
} from '../../../plugins/CollapsiblePlugin/CollapsibleContainerNode';
import { CollapsibleContentNode } from '../../../plugins/CollapsiblePlugin/CollapsibleContentNode';
import { CollapsibleTitleNode } from '../../../plugins/CollapsiblePlugin/CollapsibleTitleNode';
import {
  $convertFromLatexString,
  $convertToLatexString,
  $importLatex,
  expandMacros,
  findLatexTemplate,
  LATEX_TEMPLATE_CATEGORIES,
  LATEX_TEMPLATES,
  LATEX_TRANSFORMERS,
  parseMacros,
  type LatexTemplate,
} from '..';

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
  LayoutContainerNode,
  LayoutItemNode,
  CollapsibleContainerNode,
  CollapsibleTitleNode,
  CollapsibleContentNode,
];

function newEditor(): LexicalEditor {
  return createHeadlessEditor({
    nodes: NODES,
    onError: error => {
      throw error;
    },
  });
}

const types = (nodes: LexicalNode[]) => nodes.map(node => node.getType());
const template = (id: string) => findLatexTemplate(id)!.source;

/** Import `latex` into a fresh editor; returns the editor. */
function load(latex: string): LexicalEditor {
  const editor = newEditor();
  editor.update(() => $convertFromLatexString(latex), { discrete: true });
  return editor;
}

const read = <T>(editor: LexicalEditor, fn: () => T): T =>
  editor.getEditorState().read(fn);

describe('the templates', () => {
  it('cover every Overleaf category once', () => {
    expect(LATEX_TEMPLATES.map(t => t.category)).toEqual([
      ...LATEX_TEMPLATE_CATEGORIES,
    ]);
    expect(new Set(LATEX_TEMPLATES.map(t => t.id)).size).toBe(
      LATEX_TEMPLATES.length,
    );
  });

  it.each<[string, LatexTemplate]>(LATEX_TEMPLATES.map(t => [t.id, t]))(
    '%s reads into a document and survives a round trip',
    (_id, entry) => {
      const editor = load(entry.source);
      const before = read(editor, () => types($getRoot().getChildren()));
      expect(before.length).toBeGreaterThanOrEqual(3);
      const latex = read(editor, () => $convertToLatexString());
      expect(latex.length).toBeGreaterThan(100);
      editor.update(
        () => {
          $getRoot().clear();
          $convertFromLatexString(latex);
        },
        { discrete: true },
      );
      const after = read(editor, () => types($getRoot().getChildren()));
      // A titled box goes out as a paragraph heading and its content: the
      // only block the LaTeX written here does not bring back as itself.
      const boxed = (list: string[]) =>
        list.flatMap(type =>
          type === 'collapsible-container' ? ['heading', '*'] : [type],
        );
      const expected = boxed(before);
      expect(after.length).toBeGreaterThanOrEqual(before.length);
      expected.forEach(type => {
        if (type !== '*') {
          expect(after).toContain(type);
        }
      });
      if (!before.includes('collapsible-container')) {
        expect(after).toEqual(before);
      }
    },
  );

  it('sets the IEEE article in two columns after its title and abstract', () => {
    const editor = load(template('journal-article'));
    read(editor, () => {
      const blocks = $getRoot().getChildren();
      expect($isHeadingNode(blocks[0]) && blocks[0].getTextContent()).toBe(
        'Adaptive Sampling for Streaming Regression',
      );
      expect(blocks[1].getTextContent()).toBe('Ada Lovelace, Charles Babbage');
      const layout = blocks.find($isLayoutContainerNode)!;
      expect(layout).toBeDefined();
      expect(layout.getChildrenSize()).toBe(2);
      expect(layout.getTemplateColumns()).toBe('50fr 50fr');
      expect($getRoot().getTextContent()).toContain('[knuth84]');
      const spanning = $nodesOfType(TableCellNode).find(
        c => c.getColSpan() === 3,
      );
      expect(spanning?.getTextContent()).toBe('Lower is better.');
      expect($getRoot().getTextContent()).toContain('References');
    });
  });

  it('expands the macros a preamble defines', () => {
    const editor = load(template('bibliography'));
    read(editor, () => {
      const text = $getRoot().getTextContent();
      expect(text).toContain('OpenLibrary');
      expect(text).not.toContain('\\dataset');
      expect(text).toContain('[openlibrary, ranganathan31]');
    });
  });

  it('reads a CV: the person as the title, the role beneath, the entries', () => {
    const editor = load(template('cv'));
    read(editor, () => {
      const [name, role, contact] = $getRoot().getChildren();
      expect($isHeadingNode(name) && name.getTag()).toBe('h1');
      expect(name.getTextContent()).toBe('Grace Hopper');
      expect($isHeadingNode(role) && role.getTag()).toBe('h3');
      expect(role.getTextContent()).toBe('Computer scientist');
      expect(contact.getTextContent()).toContain('grace@example.org');
      const phd = $getRoot()
        .getChildren()
        .find(n => n.getTextContent().startsWith('Ph.D. in Mathematics'))!;
      expect(phd.getTextContent()).toContain(
        'Yale University, New Haven (1930–1934)',
      );
      const bold = ($isParagraphNode(phd) ? phd.getChildren() : []).find(
        n => $isTextNode(n) && n.hasFormat('bold'),
      );
      expect(bold?.getTextContent()).toBe('Ph.D. in Mathematics');
      const skills = $nodesOfType(ListNode);
      expect(skills.length).toBe(1);
      expect(skills[0].getChildrenSize()).toBe(2);
    });
  });

  it('reads a letter: address, opening, closing with the signature, postscript', () => {
    const editor = load(template('letter'));
    read(editor, () => {
      const texts = $getRoot()
        .getChildren()
        .map(n => n.getTextContent());
      expect(texts[0]).toContain('Institut du Radium');
      expect(texts[1]).toContain('The Nobel Committee');
      expect(texts).toContain('Dear Members of the Committee,');
      const closing = texts.indexOf('Yours sincerely,');
      expect(closing).toBeGreaterThan(0);
      expect(texts[closing + 1]).toBe('Marie Curie');
      expect(
        texts.some(t => t.startsWith('Enclosures: Curriculum vitae')),
      ).toBe(true);
      expect(texts.some(t => t.startsWith('P.S. '))).toBe(true);
    });
  });

  it('reads an assignment: theorem and proof, a description list, macros in math', () => {
    const editor = load(template('assignment'));
    read(editor, () => {
      const quotes = $nodesOfType(QuoteNode);
      const theorem = quotes.find(q =>
        q.getTextContent().startsWith('Theorem (Pythagoras).'),
      )!;
      expect(theorem).toBeDefined();
      const label = theorem.getFirstChild();
      expect($isTextNode(label) && label.hasFormat('bold')).toBe(true);
      const proof = quotes.find(q => q.getTextContent().startsWith('Proof.'))!;
      expect(proof.getTextContent().endsWith('∎')).toBe(true);
      const equations = $nodesOfType(EquationNode).map(e => e.getEquation());
      expect(equations.some(e => e.includes('\\mathbb{R}'))).toBe(true);
      expect(
        equations.some(e =>
          e.includes('\\left\\lVert x_n - x_m \\right\\rVert'),
        ),
      ).toBe(true);
      const description = $nodesOfType(ListNode).find(l =>
        l.getTextContent().startsWith('Definition'),
      )!;
      const first = description.getFirstChild() as ListItemNode;
      const term = first.getFirstChild();
      expect(
        $isTextNode(term) && term.hasFormat('bold') && term.getTextContent(),
      ).toBe('Definition');
    });
  });

  it('reads a newsletter into three columns with a boxed announcement', () => {
    const editor = load(template('newsletter'));
    read(editor, () => {
      const layout = $nodesOfType(LayoutContainerNode)[0];
      expect(layout.getChildrenSize()).toBe(3);
      const columns = layout.getChildren().map(c => c.getTextContent());
      expect(columns[0]).toContain('New members');
      expect(columns[1]).toContain('Reading group');
      expect(columns[2]).toContain('From the archive');
      const box = $nodesOfType(CollapsibleContainerNode)[0];
      expect(box.getFirstChild()?.getTextContent()).toBe('Save the date');
      expect($nodesOfType(ImageNode)[0].getAltText()).toBe('The lab in 1962');
    });
  });

  it('reads a poster: three weighted columns of blocks', () => {
    const editor = load(template('poster'));
    read(editor, () => {
      const layout = $nodesOfType(LayoutContainerNode)[0];
      expect(layout.getChildrenSize()).toBe(3);
      expect(layout.getTemplateColumns()).toBe('33fr 33fr 33fr');
      const titles = $nodesOfType(CollapsibleContainerNode).map(b =>
        b.getFirstChild()?.getTextContent(),
      );
      expect(titles).toEqual([
        'Introduction',
        'Method',
        'Results',
        'Take-away',
      ]);
      expect($nodesOfType(TableNode).length).toBe(1);
      expect($getRoot().getChildren()[0].getTextContent()).toBe(
        'Adaptive Sampling for Streaming Regression',
      );
    });
  });

  it('reads a beamer deck: title page, frames as headings, columns, code, blocks', () => {
    const editor = load(template('presentation'));
    read(editor, () => {
      const headings = $nodesOfType(HeadingNode).map(h => [
        h.getTag(),
        h.getTextContent(),
      ]);
      expect(headings[0]).toEqual(['h1', 'Streaming Regression in Practice']);
      expect(headings[1]).toEqual(['h3', 'What a bounded window buys you']);
      expect(headings).toContainEqual(['h2', 'Why streams are different']);
      expect(headings).toContainEqual(['h2', 'The update in ten lines']);
      const layout = $nodesOfType(LayoutContainerNode)[0];
      expect(layout.getChildrenSize()).toBe(2);
      expect(layout.getChildren()[0].getTextContent()).toContain(
        'Statistician',
      );
      const code = $nodesOfType(JupyterInputNode)[0];
      expect(code.getLanguage()).toBe('python');
      expect(code.getTextContent()).toContain('def update(window, x, y, w):');
      const block = $nodesOfType(CollapsibleContainerNode).find(
        b => b.getFirstChild()?.getTextContent() === 'Weighted least squares',
      )!;
      expect($isCollapsibleContainerNode(block)).toBe(true);
      expect(
        $nodesOfType(EquationNode).some(e =>
          e.getEquation().includes('X^\\top W X'),
        ),
      ).toBe(true);
    });
  });

  it('reads a thesis: chapters, a definition, an appendix and references', () => {
    const editor = newEditor();
    let documentClass: string | null = null;
    editor.update(
      () => {
        const result = $importLatex(template('thesis'));
        documentClass = result.document.documentClass;
        $getRoot().append(...result.nodes);
      },
      { discrete: true },
    );
    expect(documentClass).toBe('report');
    read(editor, () => {
      const levels = $nodesOfType(HeadingNode).map(h => [
        h.getTag(),
        h.getTextContent(),
      ]);
      // A report: chapters at the top, sections one level down.
      expect(levels).toContainEqual(['h1', 'Introduction']);
      expect(levels).toContainEqual(['h2', 'Contributions']);
      expect(levels).toContainEqual(['h1', 'Data']);
      const headings = levels.map(([, text]) => text);
      expect(headings).toEqual(
        expect.arrayContaining([
          'Introduction',
          'Contributions',
          'Method',
          'Results',
          'Data',
          'References',
        ]),
      );
      expect(
        $nodesOfType(QuoteNode).some(q =>
          q.getTextContent().startsWith('Abstract'),
        ),
      ).toBe(false);
      expect(
        $nodesOfType(QuoteNode).some(q =>
          q.getTextContent().startsWith('Definition (Drift).'),
        ),
      ).toBe(true);
    });
  });
});

describe('a complete document', () => {
  it('takes its title block from the document and keeps one through round trips', () => {
    const editor = load(template('journal-article'));
    const options = { document: true, documentClass: 'article' };
    const first = read(editor, () =>
      $convertToLatexString(LATEX_TRANSFORMERS, options),
    );
    expect(first).toContain(
      '\\title{Adaptive Sampling for Streaming Regression}',
    );
    expect(first).toContain('\\author{Ada Lovelace, Charles Babbage}');
    expect(first).not.toContain(
      '\\section{Adaptive Sampling for Streaming Regression}',
    );
    expect(first).toContain('\\maketitle');
    const h1Before = read(
      editor,
      () => $nodesOfType(HeadingNode).filter(h => h.getTag() === 'h1').length,
    );
    for (let round = 0; round < 2; round++) {
      const latex = read(editor, () =>
        $convertToLatexString(LATEX_TRANSFORMERS, options),
      );
      editor.update(
        () => {
          $getRoot().clear();
          $convertFromLatexString(latex);
        },
        { discrete: true },
      );
    }
    const h1After = read(
      editor,
      () => $nodesOfType(HeadingNode).filter(h => h.getTag() === 'h1').length,
    );
    expect(h1After).toBe(h1Before);
    const second = read(editor, () =>
      $convertToLatexString(LATEX_TRANSFORMERS, options),
    );
    expect(second).toBe(first);
  });

  it('writes chapters for a report and sections for an article', () => {
    // An opening paragraph, so that the first heading is not the title.
    const editor = load(String.raw`
      Before.

      \chapter{One}
      \section{Two}
      \subsection{Three}
    `);
    read(editor, () => {
      expect($nodesOfType(HeadingNode).map(h => h.getTag())).toEqual([
        'h1',
        'h2',
        'h3',
      ]);
      expect(
        $convertToLatexString(LATEX_TRANSFORMERS, {
          document: true,
          documentClass: 'report',
        }),
      ).toContain(
        'Before.\n\n\\chapter{One}\n\n\\section{Two}\n\n\\subsection{Three}',
      );
      expect($convertToLatexString()).toBe(
        'Before.\n\n\\section{One}\n\n\\subsection{Two}\n\n\\subsubsection{Three}',
      );
    });
  });

  it('writes a talk with its subtitle, institute and date', () => {
    const editor = load(template('presentation'));
    const latex = read(editor, () =>
      $convertToLatexString(LATEX_TRANSFORMERS, {
        document: true,
        documentClass: 'beamer',
      }),
    );
    expect(latex).toContain('\\title{Streaming Regression in Practice}');
    expect(latex).toContain('\\subtitle{What a bounded window buys you}');
    expect(latex).toContain('\\author{Ada Lovelace}');
    expect(latex).toContain('\\institute{Analytical Engine Laboratory}');
    expect(latex).toMatch(/\\date\{[A-Z][a-z]+ \d{1,2}, \d{4}\}/);
    expect(latex).not.toContain('\\section{Streaming Regression in Practice}');
  });

  it('leaves an ordinary opening heading in the body when a title is given', () => {
    const editor = load(String.raw`\section{Not the title}

      Text.`);
    const latex = read(editor, () =>
      $convertToLatexString(LATEX_TRANSFORMERS, {
        document: true,
        title: 'The Title',
      }),
    );
    expect(latex).toContain('\\title{The Title}');
    expect(latex).toContain('\\section{Not the title}');
  });
});

describe('features the templates need', () => {
  it('parses and expands macros with arguments and defaults', () => {
    const macros = parseMacros(String.raw`
      \newcommand{\R}{\mathbb{R}}
      \newcommand{\norm}[1]{\lVert #1 \rVert}
      \newcommand{\greet}[2][World]{Hello #1, from #2}
      \renewcommand\emphasis[1]{\textbf{#1}}
    `);
    expect(macros.map(m => [m.name, m.arity, m.defaultArg])).toEqual([
      ['R', 0, null],
      ['norm', 1, null],
      ['greet', 2, 'World'],
      ['emphasis', 1, null],
    ]);
    expect(
      expandMacros(
        String.raw`$\norm{x}\in\R$ \greet{Ada} \greet[Moon]{Ada} \emphasis{now}`,
        macros,
      ),
    ).toBe(
      String.raw`$\lVert x \rVert\in\mathbb{R}$ Hello World, from Ada Hello Moon, from Ada \textbf{now}`,
    );
  });

  it('reads dashes, quotes, colours and citations', () => {
    const editor = load(String.raw`
      ${'``'}Quoted'' text --- with a dash -- and \textcolor{red}{colour}, see \cite{a, b}.
    `);
    read(editor, () => {
      expect($getRoot().getTextContent()).toBe(
        '“Quoted” text — with a dash – and colour, see [a, b].',
      );
    });
  });

  it('reads multicols at their column breaks and evenly otherwise', () => {
    const explicit = load(String.raw`
      \begin{multicols}{2}
      Left one.

      Left two.
      \columnbreak
      Right.
      \end{multicols}
    `);
    read(explicit, () => {
      const layout = $nodesOfType(LayoutContainerNode)[0];
      expect(
        layout
          .getChildren()
          .map(c => ($isElementNode(c) ? c.getChildrenSize() : 0)),
      ).toEqual([2, 1]);
    });
    const even = load(String.raw`
      \begin{multicols}{3}
      One.

      Two.

      Three.

      Four.
      \end{multicols}
    `);
    read(even, () => {
      const layout = $nodesOfType(LayoutContainerNode)[0];
      expect(layout.getChildrenSize()).toBe(3);
      expect(
        layout
          .getChildren()
          .map(c => ($isElementNode(c) ? c.getChildrenSize() : 0)),
      ).toEqual([2, 2, 1]);
    });
  });

  it('writes columns back as multicols with column breaks', () => {
    const editor = load(String.raw`
      \begin{multicols}{2}
      Left.
      \columnbreak
      Right.
      \end{multicols}
    `);
    const latex = read(editor, () => $convertToLatexString());
    expect(latex).toBe(
      '\\begin{multicols}{2}\nLeft.\n\\columnbreak\nRight.\n\\end{multicols}',
    );
  });

  it('reads and writes cells that span columns', () => {
    const editor = load(String.raw`
      \begin{tabular}{lll}
      \multicolumn{2}{c}{Pair} & Single \\
      a & b & c \\
      \end{tabular}
    `);
    read(editor, () => {
      const cells = $nodesOfType(TableCellNode);
      expect(cells.map(c => [c.getTextContent(), c.getColSpan()])).toEqual([
        ['Pair', 2],
        ['Single', 1],
        ['a', 1],
        ['b', 1],
        ['c', 1],
      ]);
      expect($convertToLatexString()).toContain(
        '\\multicolumn{2}{l}{Pair} & Single \\\\',
      );
    });
  });

  it('reads side-by-side minipages as columns and a lone one as content', () => {
    const pair = load(String.raw`
      \begin{minipage}{0.6\textwidth}Wide.\end{minipage}
      \hfill
      \begin{minipage}{0.4\textwidth}Narrow.\end{minipage}
    `);
    read(pair, () => {
      const layout = $nodesOfType(LayoutContainerNode)[0];
      expect(layout.getTemplateColumns()).toBe('60fr 40fr');
    });
    const lone = load(
      String.raw`\begin{minipage}{\textwidth}Alone.\end{minipage}`,
    );
    read(lone, () => {
      expect($nodesOfType(LayoutContainerNode).length).toBe(0);
      expect($getRoot().getTextContent()).toBe('Alone.');
    });
  });
});

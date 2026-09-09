/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * One LaTeX document per Overleaf template category, written the way its
 * best-known template is written — the same classes, packages and commands
 * — so that reading them exercises what those templates need: two-column
 * articles, `multicols`, beamer frames with columns and blocks, `moderncv`
 * entries, a `letter`, theorem environments, bibliographies, `\multicolumn`
 * tables, macros. Not copies of any template: samples in their idiom.
 *
 * @module convert/latex/templates
 */

export interface LatexTemplate {
  /** A stable id, also the file name a download would use. */
  id: string;
  /** The Overleaf gallery category. */
  category: string;
  /** The template the sample is written after. */
  name: string;
  /** What the sample exercises. */
  description: string;
  source: string;
}

/** TeX's opening double quote: two backticks, which a template literal cannot hold. */
const LDQ = '``';

export const LATEX_TEMPLATE_CATEGORIES = [
  'Journal articles',
  'Bibliographies',
  'Books',
  'Calendars',
  'CVs and résumés',
  'Formal letters',
  'Assignments',
  'Newsletters',
  'Posters',
  'Presentations',
  'Theses',
] as const;

export const LATEX_TEMPLATES: LatexTemplate[] = [
  {
    id: 'journal-article',
    category: 'Journal articles',
    name: 'IEEE Transactions article (IEEEtran)',
    description:
      'Two-column article: abstract, equations, a table with a spanning cell, a figure, citations and a bibliography.',
    source: String.raw`\documentclass[journal,twocolumn]{IEEEtran}
\usepackage{amsmath}
\usepackage{graphicx}
\usepackage{booktabs}
\usepackage{cite}

\title{Adaptive Sampling for Streaming Regression}
\author{Ada Lovelace \and Charles Babbage}

\begin{document}
\maketitle

\begin{abstract}
We study regression over data streams whose distribution drifts. An adaptive
sampler keeps a bounded window while tracking the drift, at a fraction of the
cost of retraining.
\end{abstract}

\section{Introduction}
Streams arrive faster than models can be refit \cite{knuth84}. The usual
answer is a sliding window, whose size trades responsiveness against
variance\footnote{A window of one sample is responsive and useless.}. We show
the window can be chosen online in $O(n \log n)$ time --- see Section~\ref{sec:method}.

\section{Method}
\label{sec:method}
The estimate at step $t$ is a weighted sum over the window,
\begin{equation}
  \hat{y}_t = \sum_{i \in W_t} w_i \, x_i ,
\end{equation}
where the weights decay with age.

\begin{table}[h]
\centering
\caption{Results on the drift benchmark}
\begin{tabular}{lrr}
\toprule
Method & MSE & Time (s) \\
\midrule
Ours & 0.12 & 3.1 \\
Baseline & 0.20 & 2.8 \\
\multicolumn{3}{l}{\textit{Lower is better.}} \\
\bottomrule
\end{tabular}
\end{table}

\begin{figure}[t]
\centering
\includegraphics[width=\linewidth]{figures/curve.png}
\caption{Learning curve under drift}
\end{figure}

\section{Conclusion}
The sampler matches retraining within noise while touching a tenth of the
data. Code and data accompany the paper.

\begin{thebibliography}{9}
\bibitem{knuth84} D. E. Knuth, \emph{The \TeX{}book}. Addison-Wesley, 1984.
\end{thebibliography}
\end{document}
`,
  },
  {
    id: 'bibliography',
    category: 'Bibliographies',
    name: 'Article with a hand-written bibliography',
    description:
      'Citations in the text, a `thebibliography` list, and a macro defined in the preamble.',
    source: String.raw`\documentclass{article}
\newcommand{\dataset}{\textsc{OpenLibrary}}
\newcommand{\cmd}[1]{\texttt{\textbackslash #1}}

\title{Reading Lists as Data}
\author{Jorge Luis Borges}
\date{\today}

\begin{document}
\maketitle

\section{Sources}
Every claim below rests on \dataset{} \cite{openlibrary, ranganathan31}.
Citations are made with \cmd{cite} and resolved by the list at the end.

\begin{quote}
A library is a growing organism.
\end{quote}

\section{Findings}
Readers return to a handful of authors; the long tail is longer than the
catalogue suggests \cite{ranganathan31}.

\begin{thebibliography}{99}
\bibitem{openlibrary} Internet Archive, \emph{Open Library}, 2024.
\bibitem{ranganathan31} S. R. Ranganathan, \emph{The Five Laws of Library Science}, 1931.
\end{thebibliography}
\end{document}
`,
  },
  {
    id: 'book',
    category: 'Books',
    name: 'Book (book class, Tufte-style chapters)',
    description:
      'Parts and chapters, an epigraph, a table of contents, dashes and quotation marks the TeX way.',
    source: String.raw`\documentclass[11pt]{book}
\usepackage{graphicx}

\title{A Field Guide to Small Machines}
\author{M. Curie}

\begin{document}
\frontmatter
\maketitle
\tableofcontents

\mainmatter
\part{Foundations}

\chapter{Levers}
\begin{quote}
${LDQ}Give me a place to stand, and I shall move the earth.'' --- Archimedes
\end{quote}

A lever is a bar and a pivot---nothing more. Its power is in the ratio of the
arms\footnote{Measured from the pivot.}, not in the bar.

\section{Classes of lever}
\begin{itemize}
  \item First class: the pivot between load and effort.
  \item Second class: the load between pivot and effort.
  \item Third class: the effort between pivot and load.
\end{itemize}

\chapter{Wheels}
The wheel is a lever that never stops turning. Its history runs from the
potter's wheel of 3500~BCE to the gyroscope.

\backmatter
\chapter{Notes}
Further reading is listed by chapter.
\end{document}
`,
  },
  {
    id: 'calendar',
    category: 'Calendars',
    name: 'Monthly calendar (tabular grid)',
    description:
      "A month as a table with a title cell spanning the week, and the month's events in two columns.",
    source: String.raw`\documentclass{article}
\usepackage{multicol}
\usepackage{geometry}
\geometry{landscape, margin=1cm}
\pagestyle{empty}

\begin{document}

\section*{September 2026}

\begin{tabular}{|c|c|c|c|c|c|c|}
\hline
\multicolumn{7}{|c|}{\textbf{September 2026}} \\
\hline
Mon & Tue & Wed & Thu & Fri & Sat & Sun \\
\hline
 & 1 & 2 & 3 & 4 & 5 & 6 \\
\hline
7 & 8 & 9 & 10 & 11 & 12 & 13 \\
\hline
14 & 15 & 16 & 17 & 18 & 19 & 20 \\
\hline
21 & 22 & 23 & 24 & 25 & 26 & 27 \\
\hline
28 & 29 & 30 & & & & \\
\hline
\end{tabular}

\subsection*{Events}
\begin{multicols}{2}
\begin{itemize}
  \item 3 --- Term starts
  \item 9 --- Faculty meeting
  \item 15 --- Grant deadline
\end{itemize}
\columnbreak
\begin{itemize}
  \item 21 --- Seminar: streaming regression
  \item 27 --- Open day
  \item 30 --- Reports due
\end{itemize}
\end{multicols}

\end{document}
`,
  },
  {
    id: 'cv',
    category: 'CVs and résumés',
    name: 'Modern CV (moderncv)',
    description:
      'Name, role and contact from the preamble, `\\cventry` and `\\cvitem` entries, skill lists.',
    source: String.raw`\documentclass[11pt,a4paper]{moderncv}
\moderncvstyle{classic}
\moderncvcolor{blue}
\usepackage[scale=0.8]{geometry}

\name{Grace}{Hopper}
\title{Computer scientist}
\address{Arlington}{Virginia}{USA}
\phone[mobile]{+1 555 0100}
\email{grace@example.org}
\homepage{example.org/grace}

\begin{document}
\makecvtitle

\section{Education}
\cventry{1930--1934}{Ph.D. in Mathematics}{Yale University}{New Haven}{}{Thesis: \emph{New Types of Irreducibility Criteria}.}
\cventry{1928--1930}{M.A. in Mathematics}{Yale University}{New Haven}{}{}

\section{Experience}
\cventry{1959--1966}{Technical consultant}{CODASYL}{}{}{Led the committee that specified COBOL.}
\cventry{1949--1959}{Senior mathematician}{Eckert--Mauchly Computer Corporation}{Philadelphia}{}{Wrote the A-0 compiler, the first of its kind.}

\section{Skills}
\cvitem{Languages}{COBOL, FLOW-MATIC, A-0}
\cvitemwithcomment{Systems}{UNIVAC I, Mark I}{hands on}
\cvlistitem{Compiler design}
\cvlistitem{Standards work}
\cvdoubleitem{English}{native}{French}{fluent}

\end{document}
`,
  },
  {
    id: 'letter',
    category: 'Formal letters',
    name: 'Formal letter (letter class)',
    description:
      'Sender address and signature from the preamble, opening, body, closing, enclosure and postscript.',
    source: String.raw`\documentclass[12pt]{letter}
\usepackage[utf8]{inputenc}
\signature{Marie Curie}
\address{Institut du Radium \\ 1 rue Pierre Curie \\ Paris}
\date{4 September 2026}

\begin{document}

\begin{letter}{The Nobel Committee \\ Stockholm}

\opening{Dear Members of the Committee,}

Thank you for your letter of 12 August. I am honoured by the invitation and
glad to accept it.

I will travel with my daughter Irène, who will present the recent
measurements. We would be grateful for two seats at the lecture on the
morning of the 10th, and for the loan of a blackboard.

\closing{Yours sincerely,}

\encl{Curriculum vitae}
\cc{Paul Langevin}
\ps{P.S. The samples travel separately, in lead.}

\end{letter}

\end{document}
`,
  },
  {
    id: 'assignment',
    category: 'Assignments',
    name: 'Homework assignment (article with theorems)',
    description:
      'Macros from the preamble, numbered problems with lettered parts, theorem and proof environments, aligned equations, a description list.',
    source: String.raw`\documentclass[11pt]{article}
\usepackage{amsmath,amsthm,amssymb}
\usepackage{enumitem}

\newcommand{\R}{\mathbb{R}}
\newcommand{\norm}[1]{\left\lVert #1 \right\rVert}
\newtheorem{theorem}{Theorem}

\title{Homework 3 --- Analysis}
\author{Student Name}
\date{Due 15 September 2026}

\begin{document}
\maketitle

\section*{Problem 1}
Let $f: \R \to \R$ be differentiable with $f'$ bounded by $M$.
\begin{enumerate}[label=(\alph*)]
  \item Show that $f$ is Lipschitz with constant $M$.
  \item Give an example where the constant is attained.
\end{enumerate}

\begin{theorem}[Pythagoras]
In a right triangle with legs $a$, $b$ and hypotenuse $c$, $a^2 + b^2 = c^2$.
\end{theorem}

\begin{proof}
Arrange four copies of the triangle inside a square of side $a + b$. The
uncovered area is a square of side $c$, so
\begin{align*}
  (a + b)^2 &= c^2 + 4 \cdot \tfrac{1}{2} a b \\
  a^2 + b^2 &= c^2 .
\end{align*}
\end{proof}

\section*{Problem 2}
\begin{description}
  \item[Definition] A sequence $(x_n)$ in $\R$ is Cauchy if $\norm{x_n - x_m} \to 0$.
  \item[Claim] Every Cauchy sequence in $\R$ converges.
\end{description}

\end{document}
`,
  },
  {
    id: 'newsletter',
    category: 'Newsletters',
    name: 'Newsletter (three columns)',
    description:
      'A title block, a three-column body with an explicit column break, a boxed announcement, a figure.',
    source: String.raw`\documentclass[10pt]{article}
\usepackage{multicol}
\usepackage{graphicx}
\usepackage{tcolorbox}
\setlength{\columnsep}{1.5em}

\title{Lab Notes --- September}
\author{The Streaming Group}
\date{\today}

\begin{document}
\maketitle

\begin{multicols}{3}

\section*{New members}
We welcome two doctoral students this term, both working on drift detection.
Their desks are by the window; their coffee is by the door.

\section*{Seminar series}
The Thursday seminar resumes on the 21st with a talk on streaming
regression. Slides go up the same day.

\columnbreak

\section*{Reading group}
This month: \emph{The Art of Computer Programming}, Volume 3, chapter 5.
Bring sorting questions.

\begin{tcolorbox}[title=Save the date]
Open day, 27 September, 10:00--16:00. Demos in the main hall.
\end{tcolorbox}

\columnbreak

\section*{From the archive}
\begin{figure}[H]
\centering
\includegraphics[width=\linewidth]{figures/lab-1962.png}
\caption{The lab in 1962}
\end{figure}
Sixty years ago the machine room needed its own power line.

\end{multicols}
\end{document}
`,
  },
  {
    id: 'poster',
    category: 'Posters',
    name: 'Conference poster (beamerposter)',
    description:
      'Three columns of titled blocks: introduction, method with an equation, results with a table.',
    source: String.raw`\documentclass[final]{beamer}
\usepackage[size=a0,scale=1.4]{beamerposter}
\usepackage{booktabs}
\usetheme{Berlin}

\title{Adaptive Sampling for Streaming Regression}
\author{Ada Lovelace, Charles Babbage}
\institute{Analytical Engine Laboratory}

\begin{document}
\begin{frame}[t]
\maketitle

\begin{columns}[t]
\begin{column}{.32\linewidth}
  \begin{block}{Introduction}
    Streams drift; models lag. We choose the window online.
    \begin{itemize}
      \item Bounded memory
      \item One pass over the data
    \end{itemize}
  \end{block}
\end{column}
\begin{column}{.32\linewidth}
  \begin{block}{Method}
    Weighted least squares over the current window:
    \[ \hat{y}_t = \sum_{i \in W_t} w_i x_i \]
  \end{block}
\end{column}
\begin{column}{.32\linewidth}
  \begin{exampleblock}{Results}
    \begin{tabular}{lr}
    \toprule
    Method & MSE \\
    \midrule
    Ours & 0.12 \\
    Baseline & 0.20 \\
    \bottomrule
    \end{tabular}
  \end{exampleblock}
  \begin{alertblock}{Take-away}
    A tenth of the data, the same error.
  \end{alertblock}
\end{column}
\end{columns}
\end{frame}
\end{document}
`,
  },
  {
    id: 'presentation',
    category: 'Presentations',
    name: 'Presentation (beamer, Metropolis theme)',
    description:
      'A title frame, an outline, bullet frames, a two-column frame, a code frame and a block with display math.',
    source: String.raw`\documentclass{beamer}
\usetheme{metropolis}
\usepackage{listings}

\title{Streaming Regression in Practice}
\subtitle{What a bounded window buys you}
\author{Ada Lovelace}
\institute{Analytical Engine Laboratory}
\date{\today}

\begin{document}

\begin{frame}
  \titlepage
\end{frame}

\begin{frame}{Outline}
  \tableofcontents
\end{frame}

\section{Motivation}
\begin{frame}{Why streams are different}
  \begin{itemize}
    \item The data never fits in memory
    \item The distribution \alert{drifts}
    \item Retraining is too slow to matter
  \end{itemize}
\end{frame}

\begin{frame}{Two views of the same window}
  \begin{columns}
    \column{0.5\textwidth}
      \textbf{Statistician}
      \begin{itemize}
        \item Bias from old samples
        \item Variance from few samples
      \end{itemize}
    \column{0.5\textwidth}
      \textbf{Engineer}
      \begin{itemize}
        \item Memory is the budget
        \item Latency is the deadline
      \end{itemize}
  \end{columns}
\end{frame}

\begin{frame}[fragile]{The update in ten lines}
\begin{lstlisting}[language=Python]
def update(window, x, y, w):
    window.append((x, y))
    while too_old(window[0]):
        window.pop(0)
    return fit(window, w)
\end{lstlisting}
\end{frame}

\begin{frame}{The estimate}
  \begin{block}{Weighted least squares}
    \[ \hat{\beta} = (X^\top W X)^{-1} X^\top W y \]
  \end{block}
  \begin{exampleblock}{In words}
    Recent samples count more; old ones fade out.
  \end{exampleblock}
\end{frame}

\end{document}
`,
  },
  {
    id: 'thesis',
    category: 'Theses',
    name: 'Thesis (report class)',
    description:
      'Title page, abstract, chapters and sections, a definition environment, a table, a figure, an appendix and a bibliography.',
    source: String.raw`\documentclass[12pt,a4paper]{report}
\usepackage{amsmath,amsthm}
\usepackage{graphicx}
\newtheorem{definition}{Definition}

\title{Adaptive Sampling for Streaming Regression}
\author{Ada Lovelace}
\date{September 2026}

\begin{document}
\maketitle

\begin{abstract}
This thesis studies regression over drifting data streams and proposes an
adaptive sampler whose window is chosen online.
\end{abstract}

\tableofcontents

\chapter{Introduction}
Streams arrive faster than models can be refit. Chapter 2 sets the method
out; Chapter 3 measures it.

\section{Contributions}
\begin{enumerate}
  \item An online rule for the window size.
  \item A bound on the excess risk under bounded drift.
  \item An open-source implementation.
\end{enumerate}

\chapter{Method}
\begin{definition}[Drift]
A stream drifts when the conditional distribution of $y$ given $x$ changes
with time.
\end{definition}
The estimate at step $t$ is
\begin{equation}
  \hat{y}_t = \sum_{i \in W_t} w_i x_i .
\end{equation}

\chapter{Results}
\begin{table}[h]
\centering
\begin{tabular}{lrr}
\hline
Method & MSE & Time (s) \\
\hline
Ours & 0.12 & 3.1 \\
Baseline & 0.20 & 2.8 \\
\hline
\end{tabular}
\caption{Results on the drift benchmark}
\end{table}

\begin{figure}[h]
\centering
\includegraphics[width=0.7\textwidth]{figures/curve.png}
\caption{Learning curve under drift}
\end{figure}

\appendix
\chapter{Data}
The benchmark streams and their generators.

\begin{thebibliography}{9}
\bibitem{knuth84} D. E. Knuth, \emph{The \TeX{}book}. Addison-Wesley, 1984.
\end{thebibliography}
\end{document}
`,
  },
];

/** The template with `id`, or `undefined`. */
export function findLatexTemplate(id: string): LatexTemplate | undefined {
  return LATEX_TEMPLATES.find(template => template.id === id);
}

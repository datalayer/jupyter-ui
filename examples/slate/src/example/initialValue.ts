import { createElement } from "react";
import { Descendant } from "slate";
import { Output, Kernel } from '@datalayer/jupyter-react';

const SOURCE_1 = `from IPython.display import display
for i in range(3):
    display('😃 String {} added to the DOM in separated DIV.'.format(i))`;

const SOURCE_2 = `import numpy as np
import matplotlib.pyplot as plt
x1 = np.linspace(0.0, 5.0)
x2 = np.linspace(0.0, 2.0)
y1 = np.cos(2 * np.pi * x1) * np.exp(-x1)
y2 = np.cos(2 * np.pi * x2)
fig, (ax1, ax2) = plt.subplots(2, 1)
fig.suptitle('A tale of 2 subplots')
ax1.plot(x1, y1, 'o-')
ax1.set_ylabel('Damped oscillation')
ax2.plot(x2, y2, '.-')
ax2.set_xlabel('time (s)')
ax2.set_ylabel('Undamped')
plt.show()`;

const initialValue = (kernel: Kernel): Descendant[] => [
  {
    type: 'h1',
    children: [{ text: 'Welcome to Editor Slate, by Datalayer' }],
  },
  {
    type: 'h3',
    children: [{ text: 'Mix source code, markdown, videos, tweets and more... 👏👏👏' }],
  },
  {
    type: 'paragraph',
    children: [{ text: 'Let\'s start with a simple python code snippet.' }],
  },
  {
    type: 'jupyter-cell',
    output: createElement(Output, {
      showEditor: false,
      autoRun: true,
      kernel: kernel,
      code: SOURCE_1,
      executeTrigger: 0,
      clearTrigger: 0,
    }),
    executeTrigger: 0,
    clearTrigger: 0,
    children: [{ text: SOURCE_1 }],
  },
  {
    type: 'paragraph',
    children: [{ text: 'Any JupyterLab renderer is supported.' }],
  },
  {
    type: 'jupyter-cell',
    output: createElement(Output, {
      showEditor: false,
      autoRun: true,
      kernel: kernel,
      code: SOURCE_2,
      executeTrigger: 0,
      clearTrigger: 0,
    }),
    clearTrigger: 0,
    executeTrigger: 0,
    children: [{ text: SOURCE_2 }],
  },
  {
    type: 'paragraph',
    children: [{ text: 'You can mix media content like image or videos.' }],
  },
  {
    type: 'image',
    url: 'https://source.unsplash.com/kFrdX5IeQzI',
    children: [{ text: '' }],
  },
  {
    type: 'paragraph',
    children: [{ text: '... and also more Jupyter related content like a File Browser.' }],
  },
/*
  {
    type: 'jupyter-filebrowser',
    children: [{ text: '' }],
  },
*/
  {
    type: 'paragraph',
    children: [{ text: 'If you find cool this new way to learn python and analyse datasets, give it a try for free on https://datalayer.io. More coming...' }],
  },
  {
    type: 'paragraph',
    children: [{ text: `1️⃣ / menu a-la-notion
2️⃣ More block (emoji, tweet) and cell (sql) types
3️⃣ Fully functional menus and toolbars
4️⃣ Block drag-and-drop
5️⃣ Performant code highlighting
6️⃣ Variable view
7️⃣ Code autocomplete
8️⃣ Snippets
9️⃣ Mardown autoformat
🔟 RTC
#️⃣ Commenting`
    }],
  },
]

export default initialValue;

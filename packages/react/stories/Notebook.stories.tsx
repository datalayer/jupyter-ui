/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React from 'react';
import { INotebookContent } from "@jupyterlab/nbformat"

import type { Meta, StoryObj } from '@storybook/react';

import { Jupyter, Notebook } from './../src';

const meta: Meta<typeof Notebook> = {
  title: 'Components/Notebook',
  component: Notebook,
  argTypes: {
    browser: {
      control: 'radio',
      options: ['true', 'false', '@jupyterlite/javascript-kernel-extension'],
      table: {
        // Switching live does not work
        disable: true,
      },
    },
    initCode: {
      control: 'text',
    },
  },
} as Meta<typeof Notebook>;

export default meta;

type Story = StoryObj<typeof Notebook | typeof Jupyter | { browser: string }>;

const Template = (args, { globals: { labComparison } }) => {
  const { browser, initCode, ...others } = args;
  const lite = {
    true: true,
    false: false,
    '@jupyterlite/javascript-kernel-extension': import(
      '@jupyterlite/javascript-kernel-extension'
    ),
  }[args.browser];

  const kernelName =
    args.browser === '@jupyterlite/javascript-kernel-extension'
      ? 'javascript'
      : undefined;

  return (
    <Jupyter
      lite={lite}
      initCode={initCode}
      defaultKernelName={kernelName}
      jupyterServerHttpUrl="https://oss.datalayer.run/api/jupyter-kernels"
      jupyterServerWsUrl="wss://oss.datalayer.run/api/jupyter-kernels"
      jupyterToken="60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6"
    >
      <Notebook {...others} />
    </Jupyter>
  );
};

export const Default: Story = Template.bind({});
Default.args = {
  browser: 'false',
  initCode: '',
  path: undefined,
  uid: undefined,
  cellMetadataPanel: false,
  cellSidebarMargin: 120,
  height: '600px',
  maxHeight: '600px',
  nbgrader: false,
  readOnly: false,
  renderers: [],
};

export const Playground: Story = {
  render: Template.bind({}),
};
Playground.args = {
  ...Default.args,
  path: 'ipywidgets.ipynb',
  uid: 'uid-1',
};

const IPYREACT_EXAMPLE: INotebookContent = {
  cells: [
    {
      metadata: {},
      cell_type: 'code',
      outputs: [],
      source: [
        "import ipyreact\n",
        "\n",
        "class ConfettiWidget(ipyreact.ValueWidget):\n",
        "  _esm = \"\"\"\n",
        "  import confetti from \"canvas-confetti\";\n",
        "  import * as React from \"react\";\n",
        "  export default function({value, setValue}) {\n",
        "      return <>\n",
        "        <h1>Ask anything to Datalayer</h1>\n",
        "        <button onClick={() => confetti() && setValue(value + 1)}>\n",
        "          CLICK here for some CONFETTIS\n",
        "        </button>\n",
        "        <h2>You have {value || 0} wishe{ (value > 1) && 's' } so far...</h2>\n",
        "        <quote>Powered by 🪐 Jupyter UI</quote>\n",
        "      </>\n",
        "  };\"\"\"\n",
        "ConfettiWidget()"
       ]
    },
  ],
  metadata: {
    kernelspec: {
      display_name: 'Python 3 (ipykernel)',
      language: 'python',
      name: 'python3',
    },
    language_info: {
      codemirror_mode: {
        name: 'ipython',
        version: 3,
      },
      file_extension: '.py',
      mimetype: 'text/x-python',
      name: 'python',
      nbconvert_exporter: 'python',
      pygments_lexer: 'ipython3',
      version: '3.11.4',
    },
  },
  nbformat: 4,
  nbformat_minor: 5,
};

const WIDGETS_EXAMPLE: INotebookContent = {
  cells: [
    {
      metadata: {},
      cell_type: 'code',
      outputs: [],
      source: 'import ipywidgets as widgets\nw = widgets.IntSlider()\nw',
    },
    {
      metadata: {},
      cell_type: 'code',
      outputs: [],
      source: 'from IPython.display import display\ndisplay(w)',
    },
    {
      metadata: {},
      cell_type: 'code',
      outputs: [],
      source:
        "a = widgets.FloatText()\nb = widgets.FloatSlider()\ndisplay(a,b)\nlink = widgets.jslink((a, 'value'), (b, 'value'))",
    },
    {
      metadata: {},
      cell_type: 'code',
      outputs: [],
      source:
        'import numpy as np\nimport bqplot.pyplot as plt\nsize = 100\nscale = 100.0\nnp.random.seed(0)\nx_data = np.arange(size)\ny_data = np.cumsum(np.random.randn(size) * scale)\nfig = plt.figure(title="First Example")\nplt.plot(y_data)\nfig',
    },
    {
      metadata: {},
      cell_type: 'code',
      outputs: [],
      source:
        'from ipyleaflet import Map, Marker\ncenter = (52.204793, 360.121558)\nm = Map(center=center, zoom=15)\nmarker = Marker(location=center, draggable=True)\nm.add(marker)\nmarker.location = (50, 356)\nm',
    },
    {
      metadata: {},
      cell_type: 'code',
      outputs: [],
      source:
        'import ipyreact\nclass ConfettiWidget(ipyreact.ReactWidget):\n    _esm = """\n    import confetti from "canvas-confetti";\n    import * as React from "react";\n\n    export default function({value, set_value, debug}) {\n        return <button onClick={() => confetti() && set_value(value + 1)}>\n            {value || 0} times confetti\n        </button>\n    };"""\nConfettiWidget()',
    },
    {
      metadata: {},
      cell_type: 'code',
      outputs: [],
      source:
        'import plotly.express as px\ndf = px.data.stocks()\nfig = px.line(df, x="date", y=df.columns,\n              hover_data={"date": "|%B %d, %Y"},\n              title=\'custom tick labels\')\nfig.update_xaxes(\n    dtick="M1",\n    tickformat="%b %Y",\n    range=["2018-01-01", "2018-12-31"])\nfig.show()',
    },
    {
      metadata: {},
      cell_type: 'code',
      outputs: [],
      source:
        'from matplotlib import pyplot as plt\nimport numpy as np\n%matplotlib widget\nx = np.linspace(0, 1, 100)\ny = 0.2+0.4*x**2+0.3*x*np.sin(15*x)+0.05*np.cos(50*x)\nplt.figure(figsize=(6, 6))\nplt.plot(x, y)',
    },
  ],
  metadata: {
    kernelspec: {
      display_name: 'Python 3 (ipykernel)',
      language: 'python',
      name: 'python3',
    },
    language_info: {
      codemirror_mode: {
        name: 'ipython',
        version: 3,
      },
      file_extension: '.py',
      mimetype: 'text/x-python',
      name: 'python',
      nbconvert_exporter: 'python',
      pygments_lexer: 'ipython3',
      version: '3.11.4',
    },
  },
  nbformat: 4,
  nbformat_minor: 5,
};

const INIT_EXAMPLE: INotebookContent = {
  ...WIDGETS_EXAMPLE,
  cells: [
    {
      cell_type: 'code',
      metadata: {
        trusted: false,
      },
      outputs: [],
      source:
        "import piplite\nawait piplite.install('ipywidgets')\nawait piplite.install('bqplot')\nawait piplite.install('ipyleaflet')\nawait piplite.install('ipyreact')\nawait piplite.install('plotly')\nawait piplite.install('nbformat')\nawait piplite.install('ipympl')",
    },
    ...WIDGETS_EXAMPLE.cells,
  ],
};

export const IpyWidgetsState: Story = Template.bind({});
IpyWidgetsState.args = {
  ...Default.args,
  url: 'https://raw.githubusercontent.com/datalayer/jupyter-ui/main/packages/react/src/examples/notebooks/IPyWidgetsExampleWithState.ipynb.json'
};

export const IpyReact: Story = Template.bind({});
IpyReact.args = {
  ...Default.args,
  nbformat: IPYREACT_EXAMPLE,
};

export const LitePython: Story = Template.bind({});
LitePython.args = {
  ...Default.args,
  browser: 'true',
  nbformat: INIT_EXAMPLE,
};

export const LitePythonInit: Story = Template.bind({});
LitePythonInit.args = {
  ...Default.args,
  browser: 'true',
  initCode:
    "import piplite\nawait piplite.install('ipywidgets')\nawait piplite.install('bqplot')\nawait piplite.install('ipyleaflet')\nawait piplite.install('ipyreact')\nawait piplite.install('plotly')\nawait piplite.install('nbformat')\nawait piplite.install('ipympl')",
  nbformat: WIDGETS_EXAMPLE,
};

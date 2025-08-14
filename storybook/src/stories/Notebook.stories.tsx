/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Jupyter, Notebook } from '@datalayer/jupyter-react';

const meta = {
  component: Notebook,
  title: 'Components/Notebook',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Interactive Jupyter Notebook component for displaying and editing notebooks.',
      },
    },
  },
  argTypes: {
    lite: {
      control: 'radio',
      options: ['true', 'false', '@jupyterlite/javascript-kernel-extension'],
      description: 'Kernel type to use (remote server, lite Python, or lite JavaScript)',
      table: {
        // Switching live does not work
        disable: true,
      },
    },
    initCode: {
      control: 'text',
      description: 'Initialization code to run before notebook loads',
    },
    path: {
      control: 'text',
      description: 'Path to the notebook file',
    },
    readonly: {
      control: 'boolean',
      description: 'Whether the notebook is read-only',
    },
    height: {
      control: 'text',
      description: 'Height of the notebook container',
    },
  },
} satisfies Meta<typeof Notebook>;

export default meta;

type Story = StoryObj<typeof meta>;

const renderWithJupyter = (args, { globals }) => {
  const { lite: liteOption, initCode, ...notebookProps } = args;
  
  const lite = {
    true: true,
    false: false,
    '@jupyterlite/javascript-kernel-extension': import(
      '@jupyterlite/javascript-kernel-extension'
    ),
  }[liteOption];

  const kernelName =
    liteOption === '@jupyterlite/javascript-kernel-extension'
      ? 'javascript'
      : undefined;
  
  return (
    <Jupyter
      startDefaultKernel={true}
      lite={lite}
      initCode={initCode}
      defaultKernelName={kernelName}
      jupyterServerUrl="https://oss.datalayer.run/api/jupyter-server"
      jupyterServerToken="60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6"
    >
      <Notebook {...notebookProps} />
    </Jupyter>
  );
};

export const Default: Story = {
  args: {
    lite: false,
    initCode: '',
    path: undefined,
    id: undefined,
    cellMetadataPanel: false,
    cellSidebarMargin: 120,
    height: '100vh',
    maxHeight: '100vh',
    nbgrader: false,
    readonly: false,
    renderers: [],
  },
  render: renderWithJupyter,
};

export const Playground: Story = {
  args: {
    ...Default.args,
    path: 'ipywidgets.ipynb',
    id: 'id-1',
  },
  render: renderWithJupyter,
  parameters: {
    docs: {
      description: {
        story: 'Interactive playground for testing notebook functionality.',
      },
    },
  },
};

const WIDGETS_EXAMPLE = {
  cells: [
    {
      metadata: {},
      cell_type: 'code',
      outputs: [],
      source: `import ipywidgets as widgets
w = widgets.IntSlider()
w`,
    },
    {
      metadata: {},
      cell_type: 'code',
      outputs: [],
      source: `from IPython.display import display
display(w)`,
    },
    {
      metadata: {},
      cell_type: 'code',
      outputs: [],
      source: `a = widgets.FloatText()
b = widgets.FloatSlider()
display(a,b)
link = widgets.jslink((a, 'value'), (b, 'value'))`,
    },
    {
      metadata: {},
      cell_type: 'code',
      outputs: [],
      source: `import numpy as np
import bqplot.pyplot as plt
size = 100
scale = 100.0
np.random.seed(0)
x_data = np.arange(size)
y_data = np.cumsum(np.random.randn(size) * scale)
fig = plt.figure(title="First Example")
plt.plot(y_data)
fig`,
    },
    {
      metadata: {},
      cell_type: 'code',
      outputs: [],
      source: `from ipyleaflet import Map, Marker
center = (52.204793, 360.121558)
m = Map(center=center, zoom=15)
marker = Marker(location=center, draggable=True)
m.add(marker)
marker.location = (50, 356)
m`,
    },
    {
      metadata: {},
      cell_type: 'code',
      outputs: [],
      source: `import ipyreact
class ConfettiWidget(ipyreact.ReactWidget):
    _esm = """
    import confetti from "canvas-confetti";
    import * as React from "react";

    export default function({value, set_value, debug}) {
        return <button onClick={() => confetti() && set_value(value + 1)}>
            {value || 0} times confetti
        </button>
    };"""
ConfettiWidget()`,
    },
    {
      metadata: {},
      cell_type: 'code',
      outputs: [],
      source: `import plotly.express as px
df = px.data.stocks()
fig = px.line(df, x="date", y=df.columns,
              hover_data={"date": "|%B %d, %Y"},
              title=\'custom tick labels\')
fig.update_xaxes(
    dtick="M1",
    tickformat="%b %Y",
    range=["2018-01-01", "2018-12-31"])
fig.show()`,
    },
    {
      metadata: {},
      cell_type: 'code',
      outputs: [],
      source: `from matplotlib import pyplot as plt
import numpy as np
%matplotlib widget
x = np.linspace(0, 1, 100)
y = 0.2+0.4*x**2+0.3*x*np.sin(15*x)+0.05*np.cos(50*x)
plt.figure(figsize=(6, 6))
plt.plot(x, y)`,
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

const INIT_EXAMPLE = {
  ...WIDGETS_EXAMPLE,
  cells: [
    {
      cell_type: 'code',
      metadata: {
        trusted: false,
      },
      outputs: [],
      source: `import micropip
await micropip.install('ipywidgets')
await micropip.install('bqplot')
await micropip.install('ipyleaflet')
await micropip.install('ipyreact')
await micropip.install('plotly')
await micropip.install('nbformat')
await micropip.install('ipympl')`,
    },
    ...WIDGETS_EXAMPLE.cells,
  ],
};

export const IpywidgetsState: Story = {
  args: {
    ...Default.args,
    height: '200px',
    maxHeight: '200px',
    url: 'https://raw.githubusercontent.com/datalayer/jupyter-ui/main/packages/react/src/examples/notebooks/IPyWidgetsExampleWithState.ipynb.json'
  },
  render: renderWithJupyter,
  parameters: {
    docs: {
      description: {
        story: 'Notebook example demonstrating IPyWidgets state management.',
      },
    },
  },
};

export const Matplotlib: Story = {
  args: {
    ...Default.args,
    url: 'https://raw.githubusercontent.com/datalayer/jupyter-ui/main/packages/react/src/examples/notebooks/Matplotlib.ipynb.json'
  },
  render: renderWithJupyter,
  parameters: {
    docs: {
      description: {
        story: 'Notebook example showcasing matplotlib plotting capabilities.',
      },
    },
  },
};

export const LitePython: Story = {
  args: {
    ...Default.args,
    lite: true,
    nbformat: INIT_EXAMPLE,
  },
  render: renderWithJupyter,
  parameters: {
    docs: {
      description: {
        story: 'Notebook running with JupyterLite Python kernel in the browser.',
      },
    },
  },
};

export const LitePythonInit: Story = {
  args: {
    ...Default.args,
    lite: true,
    initCode: `import micropip
await micropip.install('ipywidgets')
await micropip.install('bqplot')
await micropip.install('ipyleaflet')
await micropip.install('ipyreact')
await micropip.install('plotly')
await micropip.install('nbformat')
await micropip.install('ipympl')`,
    nbformat: WIDGETS_EXAMPLE,
  },
  render: renderWithJupyter,
  parameters: {
    docs: {
      description: {
        story: 'JupyterLite notebook with initialization code to install packages.',
      },
    },
  },
};

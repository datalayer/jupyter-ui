/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Jupyter, Cell } from '@datalayer/jupyter-react';
import { colormodeFromScheme } from './_utils/story-helpers';

const meta = {
  component: Cell,
  title: 'Components/Cell',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Interactive Jupyter Cell component for executing code.',
      },
    },
  },
  argTypes: {
    lite: {
      control: 'radio',
      options: ['true', 'false', '@jupyterlite/javascript-kernel-extension'],
      table: {
        // Switching live does not work
        disable: true,
      },
    },
    initCode: {
      control: 'text',
      description: 'Initialization code to run before the cell content',
    },
    source: {
      control: 'text',
      description: 'The source code to execute in the cell',
    },
    autoStart: {
      control: 'boolean',
      description: 'Whether to auto-start execution when the cell loads',
    },
  },
} satisfies Meta<typeof Cell>;

export default meta;

type Story = StoryObj<typeof meta>;

// Modern render function that handles Jupyter context and cell rendering
const renderWithJupyter = (args, { globals }) => {
  const { colorScheme } = globals || {};
  const { lite: liteOption, initCode, ...cellProps } = args;
  
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
      colormode={colormodeFromScheme(colorScheme)}
      defaultKernelName={kernelName}
      jupyterServerUrl="https://oss.datalayer.run/api/jupyter-server"
      jupyterServerToken="60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6"
    >
      <Cell {...cellProps} />
    </Jupyter>
  );
};

export const Default: Story = {
  args: {
    lite: 'false',
    initCode: '',
    source: '',
    autoStart: false,
  },
  render: renderWithJupyter,
};

export const Confettis: Story = {
  args: {
    ...Default.args,
    source: `import ipyreact
class ConfettiWidget(ipyreact.ReactWidget):
  _esm = """
    import confetti from "canvas-confetti";
    import * as React from "react";
    export default function({value, set_value, debug}) {
        return (
        <>
          <h1>Ask anything to Datalayer</h1>
          <button onClick={() => confetti() && set_value(value + 1)}>
            CLICK here for some CONFETTIS
          </button>
          <h2>You have {value || 0} wishe{ (value > 1) && 's' } so far...</h2>
          <quote>Powered by Ξ Datalayer</quote>
        </>
      )
    };"""
 ConfettiWidget()`,
    autoStart: true,
  },
  render: renderWithJupyter,
  parameters: {
    docs: {
      description: {
        story: 'A fun example showing interactive React widgets with confetti effects.',
      },
    },
  },
};

export const Playground: Story = {
  args: {
    ...Default.args,
    source: `import numpy as np
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
plt.show()`,
    autoStart: true,
  },
  render: renderWithJupyter,
  parameters: {
    docs: {
      description: {
        story: 'Example demonstrating matplotlib plotting with subplots.',
      },
    },
  },
};

export const LitePython: Story = {
  args: {
    ...Playground.args,
    lite: 'true',
    source: `import sys
print(f"{sys.platform=}")

import numpy as np
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
plt.show()`,
  },
  render: renderWithJupyter,
  parameters: {
    docs: {
      description: {
        story: 'Same plotting example but running in JupyterLite (Python in browser).',
      },
    },
  },
};

export const WithInitialization: Story = {
  args: {
    ...Default.args,
    lite: 'true',
    initCode: 'import micropip\nawait micropip.install("ipywidgets")',
    source: '# ipywidgets is imported at initialization\nimport ipywidgets',
    autoStart: true,
  },
  render: renderWithJupyter,
  parameters: {
    docs: {
      description: {
        story: 'Example showing initialization code that installs packages before running the main code.',
      },
    },
  },
};
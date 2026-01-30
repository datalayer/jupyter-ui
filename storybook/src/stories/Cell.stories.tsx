/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Box } from '@primer/react';
import {
  JupyterReactTheme,
  Cell,
  useJupyter,
  KernelIndicator,
} from '@datalayer/jupyter-react';

const meta: Meta<typeof Cell> = {
  title: 'Components/Cell',
  component: Cell,
  argTypes: {
    source: {
      control: 'text',
    },
    autoStart: {
      control: 'boolean',
    },
  },
} as Meta<typeof Cell>;

export default meta;

type Story = StoryObj<typeof Cell>;

type CellWithKernelProps = {
  id?: string;
  source?: string;
  autoStart?: boolean;
};

const CellWithKernel = (props: CellWithKernelProps) => {
  const { id = 'cell-story-id', source = '', autoStart = false } = props;
  const { defaultKernel } = useJupyter({
    startDefaultKernel: true,
  });
  return (
    <>
      {defaultKernel ? (
        <>
          <Box mb={2}>
            <KernelIndicator
              kernel={defaultKernel?.connection}
              label="Kernel Indicator"
            />
          </Box>
          <Cell
            id={id}
            source={source}
            kernel={defaultKernel}
            autoStart={autoStart}
          />
        </>
      ) : (
        <Box>Loading Jupyter kernel...</Box>
      )}
    </>
  );
};

const Template = (args, { globals: { colorScheme: _colorScheme } }) => {
  const { browser: _browser, initCode: _initCode, ...others } = args;

  return (
    <JupyterReactTheme>
      <CellWithKernel {...others} />
    </JupyterReactTheme>
  );
};

export const Default: Story = Template.bind({}) as Story;
Default.args = {
  source: `print("Hello from Jupyter Cell!")`,
  autoStart: false,
};

export const Confettis: Story = Template.bind({}) as Story;
Confettis.args = {
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
          <quote>Powered by ☰ Datalayer</quote>
        </>
      )
    };"""
ConfettiWidget()`,
  autoStart: true,
};

export const Playground: Story = Template.bind({}) as Story;

Playground.args = {
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
};

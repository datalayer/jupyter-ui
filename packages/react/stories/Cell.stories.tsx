/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Jupyter, Cell } from './../src';
import React from 'react';

const meta: Meta<typeof Cell> = {
  title: 'Components/Cell',
} as Meta<typeof Cell>;

export default meta;

type Story = StoryObj<typeof Cell>;

const Template = (args, { globals: { labComparison } }) => {
  const Tag = `${(args.as as string) ?? 'span'}` as keyof JSX.IntrinsicElements;
  return (
    <Jupyter
      jupyterServerHttpUrl="https://oss.datalayer.tech/api/jupyter"
      jupyterServerWsUrl="wss://oss.datalayer.tech/api/jupyter"
      jupyterToken="60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6"
    >
      <Cell {...args} />
    </Jupyter>
  );
};

export const Default: Story = Template.bind({});

export const Playground: Story = {
  render: Template.bind({}),
};

Playground.args = {
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

Playground.argTypes = {
  source: {
    type: 'string',
  },
  autoStart: {
    type: 'boolean',
  },
};

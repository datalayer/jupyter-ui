/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Jupyter, Viewer } from '../src';
import nbformat1 from './../src/examples/notebooks/NotebookExample1.ipynb.json'
import nbformat2 from './../src/examples/notebooks/NotebookExample2.ipynb.json'

const meta: Meta<typeof Viewer> = {
  title: 'Components/Viewer',
  component: Viewer,
  argTypes: {
    nbformatUrl: {
      control: 'string',
    },
    outputs: {
      control: 'boolean',
    },
  },
} as Meta<typeof Viewer>;

export default meta;

type Story = StoryObj<typeof Viewer | typeof Jupyter | { nbformatUrl: string }>;

const Template = (args, { globals: { labComparison } }) => {
  const { nbformat, nbformatUrl, outputs, ...others } = args;
  return (
    <Jupyter
      jupyterServerHttpUrl="https://oss.datalayer.tech/api/jupyter"
      jupyterServerWsUrl="wss://oss.datalayer.tech/api/jupyter"
      jupyterToken="60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6"
      startDefaultKernel={false}
    >
      <Viewer
        nbformat={nbformat}
        nbformatUrl={nbformatUrl}
        outputs={outputs}
        {...others}
      /> 
    </Jupyter>
  );
};

export const Default: Story = Template.bind({});
Default.args = {
  nbformat: nbformat1,
  outputs: true,
};

export const ViewerSimple: Story = Template.bind({});
ViewerSimple.args = {
  nbformat: nbformat2,
  outputs: true
};
/*
export const ViewerPlotly: Story = Template.bind({});
ViewerPlotly.args = {
  nbformatUrl: "https://raw.githubusercontent.com/datalayer-examples/notebooks/main/daily-stock.ipynb",
  outputs: true
};
*/
export const ViewerMatplotlib: Story = Template.bind({});
ViewerMatplotlib.args = {
  nbformatUrl: "https://raw.githubusercontent.com/anissa111/matplotlib-tutorial/main/notebooks/01-basic-matplotlib-tutorial.ipynb",
  outputs: true
};

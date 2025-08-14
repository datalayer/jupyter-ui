/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Jupyter, Viewer } from '@datalayer/jupyter-react';
import nbformat1 from './examples/NotebookExample1.ipynb.json';
import nbformat2 from './examples/NotebookExample2.ipynb.json';

const meta = {
  component: Viewer,
  title: 'Components/Viewer',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Notebook viewer component for displaying static notebooks.',
      },
    },
  },
  argTypes: {
    nbformatUrl: {
      control: 'text',
      description: 'URL to load notebook from',
    },
    outputs: {
      control: 'boolean',
      description: 'Whether to display cell outputs',
    },
    nbformat: {
      control: 'object',
      description: 'Notebook format object to display',
    },
  },
} satisfies Meta<typeof Viewer>;

export default meta;

type Story = StoryObj<typeof meta>;

const renderWithJupyter = (args, { globals }) => {
  const { nbformat, nbformatUrl, outputs, ...viewerProps } = args;
  return (
    <Jupyter
      jupyterServerUrl="https://oss.datalayer.run/api/jupyter-server"
      jupyterServerToken="60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6"
      startDefaultKernel={false}
    >
      <Viewer
        nbformat={nbformat}
        nbformatUrl={nbformatUrl}
        outputs={outputs}
        {...viewerProps}
      />
    </Jupyter>
  );
};

export const Default: Story = {
  args: {
    nbformat: nbformat1,
    outputs: true,
  },
  render: renderWithJupyter,
};

export const ViewerSimple: Story = {
  args: {
    nbformat: nbformat2,
    outputs: true,
  },
  render: renderWithJupyter,
  parameters: {
    docs: {
      description: {
        story: 'Simple notebook viewer example with basic content.',
      },
    },
  },
};
/*
export const ViewerPlotly: Story = Template.bind({}) as Story;
ViewerPlotly.args = {
  nbformatUrl: "https://raw.githubusercontent.com/datalayer-examples/notebooks/main/daily-stock.ipynb",
  outputs: true
};
*/
export const ViewerMatplotlib: Story = {
  args: {
    nbformatUrl:
      'https://raw.githubusercontent.com/anissa111/matplotlib-tutorial/main/notebooks/01-basic-matplotlib-tutorial.ipynb',
    outputs: true,
  },
  render: renderWithJupyter,
  parameters: {
    docs: {
      description: {
        story: 'Viewer displaying a matplotlib tutorial notebook from external URL.',
      },
    },
  },
};

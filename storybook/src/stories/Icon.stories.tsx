/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import type { Meta, StoryObj } from '@storybook/react';
import * as dtIcons from '@datalayer/icons-react';

import * as jpIcons from '@jupyterlab/ui-components';

import React from 'react';

const meta = {
  title: 'Components/Icon',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Icon component showcasing Datalayer and JupyterLab icons.',
      },
    },
  },
  argTypes: {
    icon: {
      control: 'text',
      options: ['copyright', 'undo'],
      description: 'Icon name to display',
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const renderIcon = (args, { globals }) => {
  const { labComparison } = globals || {};
  const icon = ((args.icon ?? 'undo') as string).toLowerCase();
  const datalayerIcon =
    dtIcons[icon.charAt(0).toUpperCase() + icon.slice(1) + 'Icon'];
  const labIcon: jpIcons.LabIcon =
    labComparison === 'display' ? jpIcons[icon + 'Icon'] : null;
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h4>Datalayer Icon</h4>
        {datalayerIcon
          ? React.createElement(datalayerIcon)
          : 'Unknown DataLayer icon'}
      </div>
      {labComparison === 'display' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h4>JupyterLab Icon</h4>
          {labIcon ? <labIcon.react tag="span" /> : 'Unknown Jupyter icon'}
        </div>
      )}
    </div>
  );
};

export const Default: Story = {
  args: {
    icon: 'undo',
  },
  render: renderIcon,
};

export const Playground: Story = {
  args: {
    ...Default.args,
  },
  render: renderIcon,
  parameters: {
    docs: {
      description: {
        story: 'Interactive playground for testing different icons.',
      },
    },
  },
};

export const Copyright: Story = {
  args: {
    icon: 'copyright',
  },
  render: renderIcon,
  parameters: {
    docs: {
      description: {
        story: 'Copyright icon example.',
      },
    },
  },
};

export const Undo: Story = {
  args: {
    icon: 'undo',
  },
  render: renderIcon,
  parameters: {
    docs: {
      description: {
        story: 'Undo icon example.',
      },
    },
  },
};

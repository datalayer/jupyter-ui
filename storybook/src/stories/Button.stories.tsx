/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import {
  EyeClosedIcon,
  EyeIcon,
  SearchIcon,
  TriangleDownIcon,
  XIcon,
  HeartIcon,
} from '@primer/octicons-react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@datalayer/jupyter-react';
import { createLabButton } from './_utils/lab-builders';

const meta = {
  component: Button,
  title: 'Components/Button',
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    size: {
      control: { type: 'radio' },
      options: ['small', 'medium', 'large'],
    },
    disabled: {
      control: { type: 'boolean' },
    },
    variant: {
      control: { type: 'radio' },
      options: ['default', 'primary', 'danger', 'invisible'],
    },
    alignContent: {
      control: { type: 'radio' },
      options: ['center', 'start'],
    },
    block: {
      control: { type: 'boolean' },
    },
    leadingVisual: {
      control: { type: 'select' },
      options: [null, EyeClosedIcon, EyeIcon, SearchIcon, XIcon, HeartIcon],
      mapping: {
        EyeClosedIcon,
        EyeIcon,
        SearchIcon,
        XIcon,
        HeartIcon,
      },
    },
    trailingVisual: {
      control: { type: 'select' },
      options: [null, EyeClosedIcon, EyeIcon, SearchIcon, XIcon, HeartIcon],
      mapping: {
        EyeClosedIcon,
        EyeIcon,
        SearchIcon,
        XIcon,
        HeartIcon,
      },
    },
    trailingAction: {
      control: { type: 'select' },
      options: [null, TriangleDownIcon],
      mapping: {
        TriangleDownIcon,
      },
    },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

// Modern render function that handles both component and lab comparison
const renderWithLabComparison = (args, { globals }) => {
  const { labComparison } = globals || {};
  return (
    <>
      <Button {...args}>{args.children || args.label || 'Button'}</Button>
      {labComparison === 'display' && (
        <div
          className="vertical-spacer"
          dangerouslySetInnerHTML={{ __html: createLabButton(args) }}
        />
      )}
    </>
  );
};

export const Default: Story = {
  args: {
    block: false,
    size: 'medium',
    disabled: false,
    variant: 'default',
    alignContent: 'center',
    children: 'Default',
    leadingVisual: null,
    trailingVisual: null,
    trailingAction: null,
  },
  render: renderWithLabComparison,
};

export const Primary: Story = {
  args: {
    ...Default.args,
    variant: 'primary',
    children: 'Primary',
  },
  render: renderWithLabComparison,
};

export const Danger: Story = {
  args: {
    ...Default.args,
    variant: 'danger',
    children: 'Danger',
  },
  render: renderWithLabComparison,
};

export const Invisible: Story = {
  args: {
    ...Default.args,
    variant: 'invisible',
    children: 'Invisible',
  },
  render: renderWithLabComparison,
};

export const Playground: Story = {
  args: {
    ...Default.args,
    children: 'Playground',
  },
  render: renderWithLabComparison,
};

export const WithIcons: Story = {
  args: {
    ...Default.args,
    children: 'Search',
    leadingVisual: SearchIcon,
    trailingAction: TriangleDownIcon,
  },
  render: renderWithLabComparison,
};

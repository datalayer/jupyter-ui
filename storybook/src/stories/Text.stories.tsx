/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Text } from '@primer/react';

const meta = {
  component: Text,
  title: 'Components/Text',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Text component from Primer React with JupyterLab comparison.',
      },
    },
  },
  argTypes: {
    text: {
      control: 'text',
      description: 'The text content to display',
    },
    as: {
      control: 'text',
      description: 'HTML tag to render as',
    },
  },
} satisfies Meta<typeof Text>;

export default meta;

type Story = StoryObj<typeof meta>;

const renderWithComparison = (args, { globals }) => {
  const { labComparison } = globals || {};
  const Tag = `${(args.as as string) ?? 'span'}` as keyof JSX.IntrinsicElements;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h4>Primer Text</h4>
        <Text {...args}>{args.text ?? 'Text'}</Text>
      </div>
      {labComparison === 'display' && (
        <div>
          <h4>HTML Element</h4>
          <Tag className="vertical-spacer">{args.text ?? 'Text'}</Tag>
        </div>
      )}
    </div>
  );
};

export const Default: Story = {
  args: {
    text: 'Default text',
  },
  render: renderWithComparison,
};

export const Playground: Story = {
  args: {
    text: 'Playground',
    as: 'span',
  },
  render: renderWithComparison,
  parameters: {
    docs: {
      description: {
        story: 'Interactive playground for testing text properties.',
      },
    },
  },
};

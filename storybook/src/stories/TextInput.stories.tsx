/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { InputGroup } from '@jupyterlab/ui-components';
import { TextInput } from '@datalayer/jupyter-react';
import { getTextInputArgTypes } from './_utils/story-helpers';

const meta = {
  component: TextInput,
  title: 'Components/TextInput',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Text input component with JupyterLab comparison.',
      },
    },
  },
  argTypes: {
    type: {
      control: 'text',
      description: 'Input type (text, password, email, etc.)',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
    },
    block: {
      control: 'boolean',
      description: 'Whether the input takes full width',
    },
    ...getTextInputArgTypes(),
  },
} satisfies Meta<typeof TextInput>;

export default meta;

type Story = StoryObj<typeof meta>;

const renderWithComparison = (args, { globals }) => {
  const { labComparison } = globals || {};
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px' }}>
      <div>
        <h4>Datalayer TextInput</h4>
        <TextInput block={args.block ?? true} {...args} />
      </div>
      {labComparison === 'display' && (
        <div>
          <h4>JupyterLab InputGroup</h4>
          <InputGroup
            className="vertical-spacer"
            type={args.type}
            placeholder={args.placeholder}
            disabled={args.disabled}
          />
        </div>
      )}
    </div>
  );
};

export const Default: Story = {
  args: {
    type: 'text',
    placeholder: 'Enter text...',
    onChange: () => {},
  },
  render: renderWithComparison,
};

export const Playground: Story = {
  args: {
    label: 'TextInput',
    type: 'text',
    onChange: () => {},
  },
  render: renderWithComparison,
  parameters: {
    docs: {
      description: {
        story: 'Interactive playground for testing text input properties.',
      },
    },
  },
};

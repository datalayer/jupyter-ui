/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Text } from '@primer/react';
import React from 'react';

const meta: Meta<typeof Text> = {
  title: 'Components/Text',
} as Meta<typeof Text>;

export default meta;

type Story = StoryObj<typeof Text>;

const Template = (args, { globals: { labComparison } }) => {
  const Tag = `${(args.as as string) ?? 'span'}` as keyof JSX.IntrinsicElements;
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Text {...args}>{args.text ?? 'Text'}</Text>
      {labComparison === 'display' && (
        <Tag className="vertical-spacer">{args.text ?? 'Text'}</Tag>
      )}
    </div>
  );
};

export const Default: Story = Template.bind({});

export const Playground: Story = {
  render: Template.bind({}),
};

Playground.args = {
  text: 'Playground',
  as: 'span',
};

Playground.argTypes = {
  text: {
    type: 'string',
  },
  as: {
    type: 'string',
  },
};

/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Text } from '@primer/react';

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

export const Default: Story = {
  render: (args, options) => Template.bind({})({ }, { globals: { labComparison: true } }),
};

export const Playground: Story = {
  render: (args, options) => Template.bind({})({ }, { globals: { labComparison: true } }),
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

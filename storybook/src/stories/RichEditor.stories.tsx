/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import type { Meta, StoryObj } from '@storybook/react';
import RichEditorMock from './RichEditorMock';

const meta: Meta<typeof RichEditorMock> = {
  title: 'Components/RichEditor',
  component: RichEditorMock,
  argTypes: {
  },
} as Meta<typeof RichEditorMock>;

export default meta;

type Story = StoryObj<typeof RichEditorMock>;

const Template = (args, { globals: { labComparison } }) => {
  const { nbformat, nbformatUrl, outputs, ...others } = args;
  return (
    <RichEditorMock/>
  );
};

export const Default: Story = Template.bind({}) as Story;
Default.args = {};

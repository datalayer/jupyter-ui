/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import type { Meta } from '@storybook/react';
import { Button } from '@datalayer/jupyter-react';

const meta: Meta<typeof Button> = {
  title: 'Components/About',
} as Meta<typeof Button>;

export default meta;

const Template = (args, { globals: { labComparison } }) => {
  return (
    <>
      <Button {...args}>{args.label ?? 'Default'}</Button>
    </>
  );
};

export const Default = Template.bind({});

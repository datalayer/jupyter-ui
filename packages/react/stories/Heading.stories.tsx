/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import type { Meta, StoryObj } from '@storybook/react'
import { Heading } from '@primer/react';
import React from 'react'


const meta: Meta<typeof Heading> = {
  title: 'Components/Heading',
} as Meta<typeof Heading>

export default meta

type Story = StoryObj<typeof Heading>

const Template = (args, { globals: { labComparison } }) => {
  const level = (args.as as string ?? 'h2').slice(1)
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
  return (<>
    <Heading {...args}>Heading</Heading>
    {labComparison === 'display' &&
      <div style={{ fontFamily: 'var(--jp-content-font-family)', fontSize: 'var(--jp-content-font-size1)' }}>
        <HeadingTag
          className='vertical-spacer'
          style={{ fontFamily: 'var(--jp-content-font-family)', fontSize: `var(--jp-content-font-size${6 - parseInt(level, 10)})` }}
        >
          Heading
        </HeadingTag>
      </div>}
  </>)
}

export const Default: Story = Template.bind({})

export const Playground: Story = {
  render: Template.bind({}),
}
Playground.args = {
  as: 'h2',
}

Playground.argTypes = {
  as: {
    control: 'select',
    options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  },
}
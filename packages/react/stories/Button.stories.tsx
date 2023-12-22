/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import {EyeClosedIcon, EyeIcon, SearchIcon, TriangleDownIcon, XIcon, HeartIcon} from '@primer/octicons-react'
import type {Meta, StoryObj} from '@storybook/react'
import {Button} from '../src';
import React from 'react'
import {OcticonArgType} from './story-helpers'
import { createLabButton } from './labBuilders'


const meta: Meta<typeof Button> = {
  title: 'Components/Button',
} as Meta<typeof Button>

export default meta

type Story = StoryObj<typeof Button>

const Template = (args, { globals: { labComparison } }) => {
  return (<>
  <Button {...args}>{args.label ?? 'Default'}</Button>
  {labComparison === 'display' && <div className='vertical-spacer' dangerouslySetInnerHTML={{__html: createLabButton(args)}}></div>}
</>)
}

export const Default = Template.bind({})

export const Playground: Story = {
  render: (args, options) => Template.bind({})({label: 'Button', ...args}, options),
}
Playground.argTypes = {
  size: {
    control: {
      type: 'radio',
    },
    options: ['small', 'medium', 'large'],
  },
  disabled: {
    control: {
      type: 'boolean',
    },
  },
  inactive: {
    control: {
      type: 'boolean',
    },
  },
  variant: {
    control: {
      type: 'radio',
    },
    options: ['default', 'primary', 'danger', 'invisible'],
  },
  alignContent: {
    control: {
      type: 'radio',
    },
    options: ['center', 'start'],
  },
  block: {
    control: {
      type: 'boolean',
    },
  },
  leadingVisual: OcticonArgType([EyeClosedIcon, EyeIcon, SearchIcon, XIcon, HeartIcon]),
  trailingVisual: OcticonArgType([EyeClosedIcon, EyeIcon, SearchIcon, XIcon, HeartIcon]),
  trailingAction: OcticonArgType([TriangleDownIcon]),
}
Playground.args = {
  block: false,
  size: 'medium',
  disabled: false,
  inactive: false,
  variant: 'default',
  alignContent: 'center',
  trailingVisual: null,
  leadingVisual: null,
  trailingAction: null,
}

export const Primary: Story = {
  render: (args, options) => Template.bind({})({label: 'Button', ...args}, options),
}
Primary.args = {
  block: false,
  size: 'medium',
  disabled: false,
  inactive: false,
  variant: 'primary',
  alignContent: 'center',
  trailingVisual: null,
  leadingVisual: null,
  trailingAction: null,
}

export const Danger: Story = {
  render: (args, options) => Template.bind({})({label: 'Button', ...args}, options),
}
Danger.args = {
  block: false,
  size: 'medium',
  disabled: false,
  inactive: false,
  variant: 'danger',
  alignContent: 'center',
  trailingVisual: null,
  leadingVisual: null,
  trailingAction: null,
}

export const Invisible: Story = {
  render: (args, options) => Template.bind({})({label: 'Button', ...args}, options),
}
Invisible.args = {
  block: false,
  size: 'medium',
  disabled: false,
  inactive: false,
  variant: 'invisible',
  alignContent: 'center',
  trailingVisual: null,
  leadingVisual: null,
  trailingAction: null,
}
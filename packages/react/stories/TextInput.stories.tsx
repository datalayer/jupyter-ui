/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import type {Meta, StoryObj} from '@storybook/react'
import { InputGroup } from '@jupyterlab/ui-components'
import {TextInput} from '../src';
import React from 'react'
import {getTextInputArgTypes} from './story-helpers'


const meta: Meta<typeof TextInput> = {
  title: 'Components/TextInput',
} as Meta<typeof TextInput>

export default meta

type Story = StoryObj<typeof TextInput>

const Template = (args, { globals: { labComparison } }) => {
  return (<>
  <TextInput block={args.block ?? true} {...args} />
  {labComparison === 'display' && <InputGroup className='vertical-spacer' 
    type={args.type}
    placeholder={args.placeholder}
    disabled={args.disabled}
   />}
</>)
}

export const Default = Template.bind({})

export const Playground: Story = {
    render: (args, options) => Template.bind({})({label: 'TextInput', ...args}, options),
}
Playground.args = {
    type: 'text',
    onChange: () => {},
  }
  Playground.argTypes = {
    type: {
      control: {
        type: 'text',
      },
    },
    ...getTextInputArgTypes(),
  }
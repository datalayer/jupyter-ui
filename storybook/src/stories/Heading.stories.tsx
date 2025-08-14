/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Heading } from '@primer/react';
import React from 'react';

const meta = {
  component: Heading,
  title: 'Components/Heading',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Heading component from Primer React with JupyterLab comparison.',
      },
    },
  },
  argTypes: {
    as: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      description: 'HTML heading level to render',
    },
  },
} satisfies Meta<typeof Heading>;

export default meta;

type Story = StoryObj<typeof meta>;

const renderWithComparison = (args, { globals }) => {
  const { labComparison } = globals || {};
  const level = ((args.as as string) ?? 'h2').slice(1);
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h4>Primer Heading</h4>
        <Heading {...args}>Heading</Heading>
      </div>
      {labComparison === 'display' && (
        <div>
          <h4>JupyterLab HTML Heading</h4>
          <div
            style={{
              fontFamily: 'var(--jp-content-font-family)',
              fontSize: 'var(--jp-content-font-size1)',
            }}
          >
            <HeadingTag
              className="vertical-spacer"
              style={{
                fontFamily: 'var(--jp-content-font-family)',
                fontSize: `var(--jp-content-font-size${6 - parseInt(level, 10)})`,
              }}
            >
              Heading
            </HeadingTag>
          </div>
        </div>
      )}
    </div>
  );
};

export const Default: Story = {
  args: {
    as: 'h2',
  },
  render: renderWithComparison,
};

export const Playground: Story = {
  args: {
    as: 'h2',
  },
  render: renderWithComparison,
  parameters: {
    docs: {
      description: {
        story: 'Interactive playground for testing different heading levels.',
      },
    },
  },
};

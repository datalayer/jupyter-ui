/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Jupyter, FileManagerJupyterLab, FileBrowser } from './../src';
import React from 'react';

const meta: Meta<typeof FileBrowser> = {
    title: 'Components/FileManager',
} as Meta<typeof FileBrowser>;

export default meta;

type Story = StoryObj<typeof FileBrowser>;

const Template = (args, { globals: { labComparison } }) => {
    const Tag = `${
        (args.as as string) ?? 'span'
    }` as keyof JSX.IntrinsicElements;
    return (
        <Jupyter
            jupyterServerHttpUrl="https://oss.datalayer.run/api/jupyter-kernels"
            jupyterServerWsUrl="wss://oss.datalayer.run/api/jupyter-kernels"
            jupyterToken="60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6"
        >
            <FileBrowser {...args} />
            {labComparison === 'display' && <FileManagerJupyterLab />}
        </Jupyter>
    );
};

export const Default: Story = Template.bind({});

export const Playground: Story = {
    render: Template.bind({}),
};

Playground.args = {};

Playground.argTypes = {};

/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React from 'react';
import { ArgTypes } from '@storybook/react';
import { createGlobalStyle } from 'styled-components';
import { Icon } from '@primer/octicons-react';
import { ThemeProvider, themeGet, BaseStyles } from '@primer/react';
// import { theme } from '@primer/react';
import { jupyterTheme as theme } from '@datalayer/jupyter-react';

// we don't import StoryContext from storybook because of exports that conflict
// with primer/react more: https://github.com/primer/react/runs/6129115026?check_suite_focus=true
type StoryContext = Record<string, unknown> & {
  globals: { colorScheme: string; labComparison: 'display' | 'hide' };
  parameters: Record<string, unknown>;
};

// set global theme styles for each stGlobalStyleory
const GlobalStyle = createGlobalStyle`
  body,
  .docs-story {
    background-color: ${themeGet('colors.canvas.default')};
    color: ${themeGet('colors.fg.default')};
  }
`;

export const colormodeFromScheme = (colorScheme: string) => {
  return colorScheme.startsWith('light') ? 'light' : 'dark'
}

export const withThemeProvider = (
  Story: React.FC<React.PropsWithChildren<StoryContext>>,
  context: StoryContext
) => {
  // used for testing ThemeProvider.stories.tsx
  if (context.parameters.disableThemeDecorator) return Story(context);
  const { colorScheme } = context.globals;
  return (
    <ThemeProvider
      theme={theme}
      colorMode={colormodeFromScheme(colorScheme)}
      dayScheme={colorScheme}
      nightScheme={colorScheme}
    >
      {colorScheme.startsWith('light') ? (
        <GlobalStyle $lightTheme />
      ) : (
        <GlobalStyle />
      )}
      <BaseStyles>
        <div id="html-addon-root">{Story(context)}</div>
      </BaseStyles>
    </ThemeProvider>
  );
};

export const toolbarTypes = {
  colorScheme: {
    name: 'Color Scheme',
    description: 'Switch color scheme',
    defaultValue: 'light',
    toolbar: {
      icon: 'photo',
      items: [...Object.keys(theme.colorSchemes)],
      title: 'Color Scheme',
    },
  },
  labComparison: {
    name: 'JupyterLab Comparison',
    description: 'Display the equivalent in JupyterLab',
    defaultValue: 'display',
    toolbar: {
      icon: 'mirror',
      items: ['display', 'hide'],
      title: 'JupyterLab Equivalent',
    },
  },
};

export const inputWrapperArgTypes: ArgTypes = {
  block: {
    defaultValue: false,
    control: 'boolean',
  },
  contrast: {
    defaultValue: false,
    control: 'boolean',
  },
  disabled: {
    defaultValue: false,
    control: 'boolean',
  },
  placeholder: {
    defaultValue: '',
    control: 'text',
  },
  size: {
    name: 'size (input)', // TODO: remove '(input)'
    defaultValue: 'medium',
    options: ['small', 'medium', 'large'],
    control: 'radio',
  },
  validationStatus: {
    defaultValue: undefined,
    options: ['error', 'success', undefined],
    control: 'radio',
  },
};

const textInputArgTypesUnsorted: ArgTypes = {
  ...inputWrapperArgTypes,
  loading: {
    defaultValue: false,
    control: 'boolean',
  },
  loaderPosition: {
    defaultValue: 'auto',
    options: ['auto', 'leading', 'trailing'],
    control: 'radio',
  },
  monospace: {
    defaultValue: false,
    control: 'boolean',
  },
};

// Alphabetize and optionally categorize the props
export const getTextInputArgTypes = (category?: string) =>
  Object.keys(textInputArgTypesUnsorted)
    .sort()
    .reduce<Record<string, unknown>>((obj, key) => {
      obj[key] = category
        ? {
            // have to do weird type casting so we can spread the object
            ...(textInputArgTypesUnsorted[key] as { [key: string]: unknown }),
            table: {
              category,
            },
          }
        : textInputArgTypesUnsorted[key];
      return obj;
    }, {});

// Use this function for icon options in the controls. Desired icons are passed in as an array of Octicons
export const OcticonArgType = (iconList: Icon[]) => {
  const icons = iconList.reduce<Record<string, Icon>>((obj, icon) => {
    obj[icon.displayName || 'Icon'] = icon;
    return obj;
  }, {});

  return {
    options: Object.keys(icons),
    control: 'select',
    mapping: icons,
  };
};

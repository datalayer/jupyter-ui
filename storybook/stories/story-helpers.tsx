import {Box, ThemeProvider, themeGet, BaseStyles} from '@primer/react'
import {createGlobalStyle} from 'styled-components'
import { Icon } from '@primer/octicons-react'
import {jupyterTheme as theme} from '@datalayer/jupyter-react'
import React from 'react'

// we don't import StoryContext from storybook because of exports that conflict
// with primer/react more: https://github.com/primer/react/runs/6129115026?check_suite_focus=true
type StoryContext = Record<string, unknown> & {
  globals: {colorScheme: string; labComparison: 'display' | 'hide'}
  parameters: Record<string, unknown>
}

// set global theme styles for each story
const GlobalStyle = createGlobalStyle`
  body {
    background-color: ${themeGet('colors.canvas.default')};
    color: ${themeGet('colors.fg.default')};
  }
`

// only remove padding for multi-theme view grid
const GlobalStyleMultiTheme = createGlobalStyle`
  body {
    padding: 0 !important;
  }
`

export const withThemeProvider = (Story: React.FC<React.PropsWithChildren<StoryContext>>, context: StoryContext) => {
  // used for testing ThemeProvider.stories.tsx
  if (context.parameters.disableThemeDecorator) return Story(context)

  const {colorScheme} = context.globals

  if (colorScheme === 'all') {
    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(0, 1fr))',
          height: '100vh',
        }}
      >
        <GlobalStyleMultiTheme />
        {Object.keys(theme.colorSchemes).map(scheme => (
          <ThemeProvider
            key={scheme}
            colorMode={scheme.includes('dark') ? 'dark' : 'light'}
            dayScheme={scheme}
            nightScheme={scheme}
          >
            <BaseStyles>
              <Box
                sx={{
                  padding: '1rem',
                  height: '100%',
                  backgroundColor: 'canvas.default',
                  color: 'fg.default',
                }}
              >
                <div id={`html-addon-root-${scheme}`}>{Story(context)}</div>
              </Box>
            </BaseStyles>
          </ThemeProvider>
        ))}
      </Box>
    )
  }

  return (
    <ThemeProvider colorMode="day" dayScheme={colorScheme} nightScheme={colorScheme}>
      <GlobalStyle />
      <BaseStyles>
        <div id="html-addon-root">{Story(context)}</div>
      </BaseStyles>
    </ThemeProvider>
  )
}

export const toolbarTypes = {
  colorScheme: {
    name: 'Color scheme',
    description: 'Switch color scheme',
    defaultValue: 'light',
    toolbar: {
      icon: 'photo',
      items: [...Object.keys(theme.colorSchemes), 'all'],
      title: 'Color scheme',
    },
  },
  labComparison: {
    name: 'JupyterLab comparison',
    description: 'Display the equivalent in JupyterLab',
    defaultValue: 'hide',
    toolbar: {
      icon: 'mirror',
      items: ['display', 'hide'],
      title: 'vs Lab'
    }
  }
}

// Use this function for icon options in the controls. Desired icons are passed in as an array of Octicons
export const OcticonArgType = (iconList: Icon[]) => {
  const icons = iconList.reduce<Record<string, Icon>>((obj, icon) => {
    obj[icon.displayName || 'Icon'] = icon
    return obj
  }, {})

  return {
    options: Object.keys(icons),
    control: {
      type: 'select',
    },
    mapping: icons,
  }
}
/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import {theme} from '@primer/react';
import merge from 'lodash-es/merge'

/**
 * Theme for Primer React based on JupyterLab theme
 * 
 * It sets the Primer theme tokens using the JupyterLab CSS
 * properties with a fallback in case no JupyterLab theme is
 * is provided to the page.
 */
const jupyterTheme = {
    animation: {
      easeOutCubic: 'cubic-bezier(0.33, 1, 0.68, 1)',
    },
    borderWidths: [0, '1px'],
    breakpoints: ['544px', '768px', '1012px', '1280px'],
    fonts: {
      normal: 'var(--jp-ui-font-family, sans-serif)',
      mono: 'var(--jp-code-font-family, monospace)',
    },
    // Don't use other font-size props as it is a very bad practice
    // to use em unit
    fontSizes: [
      '10.833px',
      'var(--jp-ui-font-size1, 13px)',
      '15.6px',
      '18.72px',
      '22.464px',
      '25.96px',
      '32.35px',
      '38.82px',
      '46.58px',
    ],
    fontWeights: {
      light: 300,
      normal: 400,
      semibold: 500,
      bold: 600,
    },
    lineHeights: {
      condensedUltra: 1,
      condensed: 1.25,
      default: 1.5,
    },
    radii: ['0', '3px', '6px', '100px'],
    sizes: {
      small: '544px',
      medium: '768px',
      large: '1012px',
      xlarge: '1280px',
    },
    space: ['0', '4px', '8px', '16px', '24px', '32px', '40px', '48px', '64px', '80px', '96px', '112px', '128px'],
    colorSchemes: {
      jupyter: {
        colors: {
          canvasDefaultTransparent: 'rgba(255,255,255,0)',
          pageHeaderBg: 'var(--jp-layout-color1, white)',
          marketingIcon: {
            primary: 'var(--jp-brand-color1, #1976d2)',
            secondary: 'var(--jp-brand-color3, #bbdefb)',
          },
          diffBlob: {
            addition: {
              numText: 'var(--jp-ui-font-color1, rgba(0, 0, 0, 0.87))',
              fg: 'var(--jp-ui-font-color1, rgba(0, 0, 0, 0.87))',
              numBg: 'var(--jp-success-color2, #81c784)',
              lineBg: 'var(--jp-success-color3, #c8e6c9)',
              wordBg: 'var(--jp-success-color0, #1b5e20)',
            },
            deletion: {
              numText: 'var(--jp-ui-font-color1, rgba(0, 0, 0, 0.87))',
              fg: 'var(--jp-ui-font-color1, rgba(0, 0, 0, 0.87))',
              numBg: 'var(--jp-error-color2, #e57373)',
              lineBg: 'var(--jp-error-color3, #ffcdd2)',
              wordBg: 'var(--jp-error-color0, #b71c1c)',
            },
            hunk: {
              numBg: 'var(--jp-brand-color0, #0d47a1)',
            },
            expander: {
              icon: 'var(--jp-ui-font-color1, rgba(0, 0, 0, 0.54))',
            },
          },
          diffstat: {
            deletionBorder: 'var(--jp-border-color1, #bdbdbd)',
            additionBorder: 'var(--jp-border-color1, #bdbdbd)',
            additionBg: 'var(--jp-accent-color1, #388e3c)',
          },
          searchKeyword: {
            hl: 'var(--jp-warn-color3, #ffe0b2)',
          },
          prettylights: {
            syntax: {
              comment: 'var(--jp-ui-font-color1, rgba(0, 0, 0, 0.38))',
              constant: '#0550ae',
              entity: '#6639ba',
              storageModifierImport: 'var(--jp-ui-font-color1, rgba(0, 0, 0, 0.87))',
              entityTag: '#116329',
              keyword: 'var(--jp-error-color1, #d32f2f)',
              string: '#0a3069',
              variable: '#953800',
              brackethighlighterUnmatched: '#82071e',
              invalidIllegalText: 'var(--jp-layout-color1, white)',
              invalidIllegalBg: '#82071e',
              carriageReturnText: 'var(--jp-layout-color1, white)',
              carriageReturnBg: 'var(--jp-error-color1, #d32f2f)',
              stringRegexp: '#116329',
              markupList: '#3b2300',
              markupHeading: '#0550ae',
              markupItalic: 'var(--jp-ui-font-color1, rgba(0, 0, 0, 0.87))',
              markupBold: 'var(--jp-ui-font-color1, rgba(0, 0, 0, 0.87))',
              markupDeletedText: '#82071e',
              markupDeletedBg: 'var(--jp-error-color3, #ffcdd2)',
              markupInsertedText: '#116329',
              markupInsertedBg: 'var(--jp-success-color3, #c8e6c9)',
              markupChangedText: '#953800',
              markupChangedBg: '#ffd8b5',
              markupIgnoredText: 'var(--jp-layout-color2, #eee)',
              markupIgnoredBg: '#0550ae',
              metaDiffRange: 'var(--jp-info-color1, #0097a7)',
              brackethighlighterAngle: '#57606a',
              sublimelinterGutterMark: 'var(--jp-layout-color4, #757575)',
              constantOtherReferenceLink: '#0a3069',
            },
          },
          codemirror: {
            text: 'var(--jp-ui-font-color1, rgba(0, 0, 0, 0.87))',
            bg: 'var(--jp-ui-inverse-font-color1, rgba(255, 255, 255, 1))',
            guttersBg: 'var(--jp-ui-inverse-font-color1, rgba(255, 255, 255, 1))',
            guttermarkerText: 'var(--jp-ui-inverse-font-color1, rgba(255, 255, 255, 1))',
            guttermarkerSubtleText: 'var(--jp-ui-font-color1, rgba(0, 0, 0, 0.38))',
            linenumberText: 'var(--jp-ui-font-color1, rgba(0, 0, 0, 0.54))',
            cursor: 'var(--jp-ui-font-color1, rgba(0, 0, 0, 0.87))',
            selectionBg: 'var(--jp-brand-color0, #0d47a1)',
            activelineBg: 'rgba(234,238,242,0.5)',
            matchingbracketText: 'var(--jp-ui-font-color1, rgba(0, 0, 0, 0.87))',
            linesBg: 'var(--jp-ui-inverse-font-color1, rgba(255, 255, 255, 1))',
            syntax: {
              comment: 'var(--jp-ui-font-color1, rgba(0, 0, 0, 0.87))',
              constant: '#0550ae',
              entity: 'var(--jp-info-color1, #0097a7)',
              keyword: 'var(--jp-error-color1, #d32f2f)',
              storage: 'var(--jp-error-color1, #d32f2f)',
              string: '#0a3069',
              support: '#0550ae',
              variable: '#953800',
            },
          },
          checks: {
            bg: 'var(--jp-ui-font-color1, rgba(0, 0, 0, 0.87))',
            textPrimary: 'var(--jp-layout-color1, white)',
            textSecondary: 'var(--jp-layout-color4, #757575)',
            textLink: '#54aeff',
            btnIcon: '#afb8c1',
            btnHoverIcon: 'var(--jp-layout-color1, white)',
            btnHoverBg: 'rgba(255,255,255,0.125)',
            inputText: 'var(--jp-layout-color2, #eee)',
            inputPlaceholderText: 'var(--jp-layout-color4, #757575)',
            inputFocusText: 'var(--jp-layout-color4, #757575)',
            inputBg: '#32383f',
            donutError: '#fa4549',
            donutPending: '#bf8700',
            donutSuccess: 'var(--jp-accent-color1, #388e3c)',
            donutNeutral: '#afb8c1',
            dropdownText: '#afb8c1',
            dropdownBg: '#32383f',
            dropdownBorder: '#424a53',
            dropdownShadow: 'rgba(31,35,40,0.3)',
            dropdownHoverText: 'var(--jp-layout-color1, white)',
            dropdownHoverBg: '#424a53',
            dropdownBtnHoverText: 'var(--jp-layout-color1, white)',
            dropdownBtnHoverBg: '#32383f',
            scrollbarThumbBg: '#57606a',
            headerLabelText: 'var(--jp-border-color1, #bdbdbd)',
            headerLabelOpenText: 'var(--jp-layout-color1, white)',
            headerBorder: '#32383f',
            headerIcon: 'var(--jp-layout-color4, #757575)',
            lineText: 'var(--jp-border-color1, #bdbdbd)',
            lineNumText: 'rgba(140,149,159,0.75)',
            lineTimestampText: 'var(--jp-layout-color4, #757575)',
            lineHoverBg: '#32383f',
            lineSelectedBg: 'rgba(33,139,255,0.15)',
            lineSelectedNumText: '#54aeff',
            lineDtFmText: 'var(--jp-ui-font-color1, rgba(0, 0, 0, 0.87))',
            lineDtFmBg: 'var(--jp-warn-color2, #ffb74d)',
            gateBg: 'rgba(125,78,0,0.15)',
            gateText: 'var(--jp-border-color1, #bdbdbd)',
            gateWaitingText: '#d4a72c',
            stepHeaderOpenBg: '#32383f',
            stepErrorText: '#ff8182',
            stepWarningText: '#d4a72c',
            loglineText: 'var(--jp-layout-color4, #757575)',
            loglineNumText: 'rgba(140,149,159,0.75)',
            loglineDebugText: '#c297ff',
            loglineErrorText: 'var(--jp-border-color1, #bdbdbd)',
            loglineErrorNumText: '#ff8182',
            loglineErrorBg: 'rgba(164,14,38,0.15)',
            loglineWarningText: 'var(--jp-border-color1, #bdbdbd)',
            loglineWarningNumText: '#d4a72c',
            loglineWarningBg: 'rgba(125,78,0,0.15)',
            loglineCommandText: '#54aeff',
            loglineSectionText: '#4ac26b',
            ansi: {
              black: '#24292f',
              blackBright: '#32383f',
              white: '#d0d7de',
              whiteBright: '#d0d7de',
              gray: '#8c959f',
              red: '#ff8182',
              redBright: '#ffaba8',
              green: '#4ac26b',
              greenBright: '#6fdd8b',
              yellow: '#d4a72c',
              yellowBright: '#eac54f',
              blue: '#54aeff',
              blueBright: '#80ccff',
              magenta: '#c297ff',
              magentaBright: '#d8b9ff',
              cyan: '#76e3ea',
              cyanBright: '#b3f0ff',
            },
          },
          project: {
            headerBg: 'var(--jp-ui-font-color1, rgba(0, 0, 0, 0.87))',
            sidebarBg: 'var(--jp-ui-inverse-font-color1, rgba(255, 255, 255, 1))',
            gradientIn: 'var(--jp-ui-inverse-font-color1, rgba(255, 255, 255, 1))',
            gradientOut: 'rgba(255,255,255,0)',
          },
          mktg: {
            btn: {
              bg: '#1b1f23',
            },
          },
          control: {
            borderColor: {
              emphasis: 'var(--jp-inverse-border-color, #757575)',
            },
          },
          avatar: {
            bg: 'var(--jp-ui-inverse-font-color1, rgba(255, 255, 255, 1))',
            border: 'var(--jp-border-color1, #bdbdbd)',
            stackFade: '#afb8c1',
            stackFadeMore: 'var(--jp-border-color1, #bdbdbd)',
          },
          topicTag: {
            border: 'rgba(0,0,0,0)',
          },
          counter: {
            border: 'rgba(0,0,0,0)',
          },
          selectMenu: {
            backdropBorder: 'rgba(0,0,0,0)',
            tapHighlight: 'rgba(175,184,193,0.5)',
            tapFocusBg: '#b6e3ff',
          },
          overlay: {
            backdrop: 'rgba(140,149,159,0.2)',
          },
          header: {
            text: 'var(--jp-ui-inverse-font-color1, rgba(255, 255, 255, 1))',
            bg: 'var(--jp-inverse-layout-color1, #212121)',
            divider: 'var(--jp-inverse-layout-color2, #424242)',
            logo: 'var(--jp-ui-inverse-font-color1, rgba(255, 255, 255, 1))',
          },
          headerSearch: {
            bg: 'var(--jp-ui-font-color1, rgba(0, 0, 0, 0.87))',
            border: '#57606a',
          },
          sidenav: {
            selectedBg: 'var(--jp-ui-inverse-font-color1, rgba(255, 255, 255, 1))',
          },
          menu: {
            bgActive: 'rgba(0,0,0,0)',
          },
          input: {
            disabledBg: 'var(--jp-inverse-layout-color2, #424242)',
          },
          timeline: {
            badgeBg: 'var(--jp-layout-color2, #eee)',
          },
          ansi: {
            black: '#0e1116',
            blackBright: '#20252c',
            white: '#ced5dc',
            whiteBright: '#ced5dc',
            gray: '#88929d',
            red: '#ee5a5d',
            redBright: '#ff8e8a',
            green: '#26a148',
            greenBright: '#43c663',
            yellow: '#b58407',
            yellowBright: '#d5a824',
            blue: '#368cf9',
            blueBright: '#67b3fd',
            magenta: '#a371f7',
            magentaBright: '#c49bff',
            cyan: '#76e3ea',
            cyanBright: '#b3f0ff',
          },
          btn: {
            text: 'var(--jp-ui-font-color1, rgba(0, 0, 0, 0.87))',
            bg: 'var(--jp-layout-color1, white)',
            border: 'var(--jp-border-color1, #bdbdbd)',
            hoverBg: 'var(--jp-layout-color2, #eee)',
            hoverBorder: 'var(--jp-border-color1, #bdbdbd)',
            activeBg: 'var(--jp-layout-color3, #bdbdbd)',
            activeBorder: 'var(--jp-border-color1, #bdbdbd)',
            selectedBg: 'var(--jp-layout-color0, white)',
            counterBg: 'var(--jp-layout-color4, #757575)',
            primary: {
              text: 'var(--jp-ui-inverse-font-color1, rgba(255, 255, 255, 1))',
              bg: 'var(--jp-accent-color1, #388e3c)',
              border: 'var(--jp-border-color1, #bdbdbd)',
              hoverBg: 'var(--jp-accent-color2, #81c784)',
              hoverBorder: 'var(--jp-border-color1, #bdbdbd)',
              selectedBg: 'var(--jp-accent-color0, #1b5e20)',
              disabledText: 'var(--jp-ui-inverse-font-color2, rgba(255, 255, 255, 0.7))',
              disabledBg: 'var(--jp-accent-color3, #c8e6c9)',
              disabledBorder: 'var(--jp-border-color1, #bdbdbd)',
              icon: 'var(--jp-ui-inverse-font-color2, rgba(255, 255, 255, 0.7))',
              counterBg: 'var(--jp-inverse-layout-color3, #616161)',
            },
            outline: {
              text: 'var(--jp-brand-color1, #1976d2)',
              hoverText: 'var(--jp-ui-inverse-font-color1, rgba(255, 255, 255, 1))',
              hoverBg: 'var(--jp-brand-color1, #1976d2)',
              hoverBorder: 'var(--jp-border-color1, #bdbdbd)',
              hoverCounterBg: 'var(--jp-brand-color4, #e3f2fd)',
              selectedText: 'var(--jp-ui-inverse-font-color1, rgba(255, 255, 255, 1))',
              selectedBg: 'var(--jp-brand-color2, #64b5f6)',
              selectedBorder: 'var(--jp-border-color1, #bdbdbd)',
              disabledText: 'var(--jp-brand-color3, #bbdefb)',
              disabledBg: 'var(--jp-layout-color1, white)',
              disabledCounterBg: 'var(--jp-brand-color4, #e3f2fd)',
              counterBg: 'var(--jp-brand-color4, #e3f2fd)',
              counterFg: 'var(--jp-brand-color3, #bbdefb)',
              hoverCounterFg: 'var(--jp-ui-inverse-font-color1, rgba(255, 255, 255, 1))',
              disabledCounterFg: 'var(--jp-brand-color3, #bbdefb)',
            },
            danger: {
              text: 'var(--jp-error-color0, #b71c1c)',
              hoverText: 'var(--jp-ui-inverse-font-color1, rgba(255, 255, 255, 1))',
              hoverBg: 'var(--jp-error-color1, #d32f2f)',
              hoverBorder: 'var(--jp-border-color1, #bdbdbd)',
              hoverCounterBg: 'var(--jp-brand-color4, #e3f2fd)',
              selectedText: 'var(--jp-ui-inverse-font-color1, rgba(255, 255, 255, 1))',
              selectedBg: 'var(--jp-error-color0, #b71c1c)',
              selectedBorder: 'var(--jp-border-color1, #bdbdbd)',
              disabledText: 'var(--jp-error-color3, #ffcdd2)',
              disabledBg: 'var(--jp-layout-color1, white)',
              disabledCounterBg: 'var(--jp-error-color3, #ffcdd2)',
              counterBg: 'var(--jp-error-color2, #e57373)',
              icon: 'var(--jp-error-color0, #b71c1c)',
              hoverIcon: 'var(--jp-ui-inverse-font-color1, rgba(255, 255, 255, 1))',
              counterFg: 'var(--jp-error-color1, #d32f2f)',
              hoverCounterFg: 'var(--jp-ui-inverse-font-color1, rgba(255, 255, 255, 1))',
              disabledCounterFg: 'var(--jp-error-color3, #ffcdd2)',
            },
            inactive: {
              bg: 'var(--jp-layout-color2, #eee)',
              text: 'var(--jp-ui-font-color1, rgba(0, 0, 0, 0.54))',
            },
          },
          underlinenav: {
            icon: 'var(--jp-ui-font-color1, rgba(0, 0, 0, 0.38))',
            borderHover: 'var(--jp-border-color2, #e0e0e0)',
          },
          actionListItem: {
            inlineDivider: 'rgba(208,215,222,0.48)',
            default: {
              hoverBg: 'rgba(208,215,222,0.32)',
              hoverBorder: 'rgba(0,0,0,0)',
              activeBg: 'rgba(208,215,222,0.48)',
              activeBorder: 'rgba(0,0,0,0)',
              selectedBg: 'rgba(208,215,222,0.24)',
            },
            danger: {
              hoverBg: 'var(--jp-error-color0, #b71c1c)',
              activeBg: 'var(--jp-error-color3, #ffcdd2)',
              hoverText: 'var(--jp-error-color2, #e57373)',
            },
          },
          switchTrack: {
            bg: 'var(--jp-layout-color2, #eee)',
            hoverBg: 'hsla(210,24%,90%,1)',
            activeBg: 'hsla(210,24%,88%,1)',
            disabledBg: 'var(--jp-layout-color4, #757575)',
            fg: 'var(--jp-ui-font-color1, rgba(0, 0, 0, 0.54))',
            disabledFg: 'var(--jp-ui-inverse-font-color1, rgba(255, 255, 255, 1))',
            border: 'rgba(0,0,0,0)',
            checked: {
              bg: 'var(--jp-brand-color1, #1976d2)',
              hoverBg: '#0860CA',
              activeBg: '#0757BA',
              fg: 'var(--jp-ui-inverse-font-color1, rgba(255, 255, 255, 1))',
              disabledFg: 'var(--jp-ui-inverse-font-color1, rgba(255, 255, 255, 1))',
              border: 'rgba(0,0,0,0)',
            },
          },
          switchKnob: {
            bg: 'var(--jp-ui-inverse-font-color1, rgba(255, 255, 255, 1))',
            disabledBg: 'var(--jp-layout-color1, white)',
            border: 'var(--jp-inverse-border-color, #757575)',
            checked: {
              bg: 'var(--jp-ui-inverse-font-color1, rgba(255, 255, 255, 1))',
              disabledBg: 'var(--jp-layout-color1, white)',
              border: 'var(--jp-brand-color1, #1976d2)',
            },
          },
          segmentedControl: {
            bg: 'var(--jp-layout-color2, #eee)',
            button: {
              bg: 'var(--jp-inverse-layout-color1, #212121)',
              hover: {
                bg: 'var(--jp-inverse-layout-color2, #424242)',
              },
              active: {
                bg: 'var(--jp-inverse-layout-color3, #616161)',
              },
              selected: {
                border: 'var(--jp-border-color3, #eee)',
              },
            },
          },
          treeViewItem: {
            chevron: {
              hoverBg: 'var(--jp-inverse-layout-color1, #212121)',
            },
            directory: {
              fill: 'var(--jp-brand-color3, #bbdefb)',
            },
          },
          fg: {
            default: 'var(--jp-ui-font-color1, rgba(0, 0, 0, 0.87))',
            muted: 'var(--jp-ui-font-color1, rgba(0, 0, 0, 0.54))',
            subtle: 'var(--jp-ui-font-color1, rgba(0, 0, 0, 0.38))',
            onEmphasis: 'var(--jp-ui-inverse-font-color1, rgba(255, 255, 255, 1))',
          },
          canvas: {
            default: 'var(--jp-ui-inverse-font-color1, rgba(255, 255, 255, 1))',
            overlay: 'var(--jp-ui-inverse-font-color1, rgba(255, 255, 255, 1))',
            inset: 'var(--jp-layout-color1, white)',
            subtle: 'var(--jp-layout-color1, white)',
          },
          border: {
            default: 'var(--jp-border-color1, #bdbdbd)',
            muted: 'var(--jp-border-color2, #e0e0e0)',
            subtle: 'var(--jp-border-color3, #eee)',
          },
          neutral: {
            emphasisPlus: 'var(--jp-layout-color2, #eee)',
            emphasis: 'var(--jp-layout-color1, white)',
            muted: 'var(--jp-layout-color0, white)',
            subtle: 'var(--jp-layout-color3, #bdbdbd)',
          },
          accent: {
            fg: 'var(--jp-brand-color1, #1976d2)',
            emphasis: 'var(--jp-brand-color2, #64b5f6)',
            muted: 'var(--jp-brand-color0, #0d47a1)',
            subtle: 'var(--jp-brand-color3, #bbdefb)',
          },
          success: {
            fg: 'var(--jp-success-color1, #388e3c)',
            emphasis: 'var(--jp-success-color2, #81c784)',
            muted: 'var(--jp-success-color0, #1b5e20)',
            subtle: 'var(--jp-success-color3, #c8e6c9)',
          },
          attention: {
            fg: 'var(--jp-warn-color1, #f57c00)',
            emphasis: 'var(--jp-warn-color2, #ffb74d)',
            muted: 'var(--jp-warn-color0, #e65100)',
            subtle: 'var(--jp-warn-color3, #ffe0b2)',
          },
          severe: {
            fg: 'var(--jp-warn-color1, #f57c00)',
            emphasis: 'var(--jp-warn-color2, #ffb74d)',
            muted: 'var(--jp-warn-color0, #e65100)',
            subtle: 'var(--jp-warn-color3, #ffe0b2)',
          },
          danger: {
            fg: 'var(--jp-error-color1, #d32f2f)',
            emphasis: 'var(--jp-error-color2, #e57373)',
            muted: 'var(--jp-error-color0, #b71c1c)',
            subtle: 'var(--jp-error-color3, #ffcdd2)',
          },
          open: {
            fg: 'var(--jp-success-color1, #388e3c)',
            emphasis: 'var(--jp-success-color2, #81c784)',
            muted: 'var(--jp-success-color0, #1b5e20)',
            subtle: 'var(--jp-success-color3, #c8e6c9)',
          },
          closed: {
            fg: 'var(--jp-error-color1, #d32f2f)',
            emphasis: 'var(--jp-error-color2, #e57373)',
            muted: 'var(--jp-error-color0, #b71c1c)',
            subtle: 'var(--jp-error-color3, #ffcdd2)',
          },
          done: {
            fg: 'var(--jp-info-color1, #0097a7)',
            emphasis: 'var(--jp-info-color2, #4dd0e1)',
            muted: 'var(--jp-info-color0, #006064)',
            subtle: 'var(--jp-info-color3, #b2ebf2)',
          },
          sponsors: {
            fg: '#bf3989',
            emphasis: '#bf3989',
            muted: 'rgba(255,128,200,0.4)',
            subtle: '#ffeff7',
          },
          primer: {
            fg: {
              disabled: 'var(--jp-layout-color4, #757575)',
            },
            canvas: {
              backdrop: 'rgba(31,35,40,0.5)',
              sticky: 'rgba(255,255,255,0.95)',
            },
            border: {
              active: '#fd8c73',
              contrast: 'rgba(31,35,40,0.1)',
            },
          },
        },
        shadows: {
          mktg: {
            btn: {
              shadow: {
                outline: 'rgb(0 0 0 / 15%) 0 0 0 1px inset',
                focus: 'rgb(0 0 0 / 15%) 0 0 0 4px',
                hover:
                  '0 3px 2px rgba(0, 0, 0, 0.07), 0 7px 5px rgba(0, 0, 0, 0.04), 0 12px 10px rgba(0, 0, 0, 0.03), 0 22px 18px rgba(0, 0, 0, 0.03), 0 42px 33px rgba(0, 0, 0, 0.02), 0 100px 80px rgba(0, 0, 0, 0.02)',
                hoverMuted: 'rgb(0 0 0 / 70%) 0 0 0 2px inset',
              },
            },
          },
          avatar: {
            childShadow: '0 0 0 2px var(--jp-ui-inverse-font-color2, rgba(255, 255, 255, 0.7))',
          },
          overlay: {
            shadow: '0 1px 3px rgba(31,35,40,0.12), 0 8px 24px rgba(66,74,83,0.12)',
          },
          btn: {
            shadow: '0 1px 0 rgba(31,35,40,0.04)',
            insetShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)',
            primary: {
              shadow: '0 1px 0 rgba(31,35,40,0.1)',
              insetShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
              selectedShadow: 'inset 0 1px 0 var(--jp-inverse-layout-color3, #616161)',
            },
            outline: {
              hoverShadow: '0 1px 0 rgba(31,35,40,0.1)',
              hoverInsetShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
              selectedShadow: 'inset 0 1px 0 rgba(0,33,85,0.2)',
            },
            danger: {
              hoverShadow: '0 1px 0 rgba(31,35,40,0.1)',
              hoverInsetShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
              selectedShadow: 'inset 0 1px 0 rgba(76,0,20,0.2)',
            },
          },
          shadow: {
            small: '0 1px 0 rgba(31,35,40,0.04)',
            medium: '0 3px 6px rgba(140,149,159,0.15)',
            large: '0 8px 24px rgba(140,149,159,0.2)',
            extraLarge: '0 12px 28px rgba(140,149,159,0.3)',
          },
          primer: {
            shadow: {
              highlight: 'inset 0 1px 0 rgba(255,255,255,0.25)',
              inset: 'inset 0 1px 0 rgba(208,215,222,0.2)',
            },
          },
        },
      },
    },
  }

const {colorSchemes: jpSchemes, ...jpOthers} = jupyterTheme;

// Merge with the light theme to ensure all variables are defined (although
// the style may be ugly)
const defaultTheme = merge(theme, jpOthers)
// @ts-expect-error jupyter scheme is unknown
defaultTheme.colorSchemes.jupyter = {
    colors: merge(theme.colorSchemes.light.colors, jpSchemes.jupyter.colors),
    shadows: merge(theme.colorSchemes.light.shadows, jpSchemes.jupyter.shadows)
}

export default defaultTheme;

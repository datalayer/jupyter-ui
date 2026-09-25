/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/*
 * Copyright (c) 2021-2025 Datalayer, Inc.
 *
 * MIT License
 */

import type {
  ExcalidrawElement,
  NonDeleted,
} from '@excalidraw/excalidraw/element/types';
import type { AppState, BinaryFiles } from '@excalidraw/excalidraw/types';
import type { JSX } from 'react';

import { exportToSvg } from '@excalidraw/excalidraw';
import * as React from 'react';
import { useEffect, useState } from 'react';

import { useTheme } from '../context/ThemeContext';

type ImageType = 'svg' | 'canvas';

type Dimension = 'inherit' | number;

type Props = {
  /**
   * Configures the export setting for SVG/Canvas
   */
  appState: AppState;
  /**
   * The css class applied to image to be rendered
   */
  className?: string;
  /**
   * The Excalidraw elements to be rendered as an image
   */
  elements: NonDeleted<ExcalidrawElement>[];
  /**
   * The Excalidraw files associated with the elements
   */
  files: BinaryFiles;
  /**
   * The height of the image to be rendered
   */
  height?: Dimension;
  /**
   * The ref object to be used to render the image
   */
  imageContainerRef: React.MutableRefObject<HTMLDivElement | null>;
  /**
   * The type of image to be rendered
   */
  imageType?: ImageType;
  /**
   * The css class applied to the root element of this component
   */
  rootClassName?: string | null;
  /**
   * The width of the image to be rendered
   */
  width?: Dimension;
};

// exportToSvg has fonts from excalidraw.com
// We don't want them to be used in open source
const removeStyleFromSvg_HACK = (svg: SVGElement) => {
  const styleTag = svg?.firstElementChild?.firstElementChild;

  // Generated SVG is getting double-sized by height and width attributes
  // We want to match the real size of the SVG element
  const viewBox = svg.getAttribute('viewBox');
  if (viewBox != null) {
    const viewBoxDimensions = viewBox.split(' ');
    svg.setAttribute('width', viewBoxDimensions[2]);
    svg.setAttribute('height', viewBoxDimensions[3]);
  }

  if (styleTag && styleTag.tagName === 'style') {
    styleTag.remove();
  }
};

/**
 * A component for rendering Excalidraw elements as a static image
 */
export default function ExcalidrawImage({
  elements,
  files,
  imageContainerRef,
  appState,
  rootClassName = null,
  width = 'inherit',
  height = 'inherit',
}: Props): JSX.Element {
  /*
   * The mode is read from this element's own position in the DOM, so a
   * drawing inside a dark editor exports dark even when the page around it is
   * light. `useState` rather than `useRef` for the node: the hook has to
   * re-run once the element exists, and a ref assignment does not re-render.
   */
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const { theme } = useTheme(node);
  const [Svg, setSvg] = useState<SVGElement | null>(null);
  const [cssVersion, setCssVersion] = useState(0);

  // Listen for CSS variable changes (detects theme palette changes)
  useEffect(() => {
    const observer = new MutationObserver(mutations => {
      // Check if style or class attributes changed (indicates theme change)
      for (const mutation of mutations) {
        if (
          mutation.type === 'attributes' &&
          (mutation.attributeName === 'style' ||
            mutation.attributeName === 'class')
        ) {
          setCssVersion(v => v + 1);
          break;
        }
      }
    });

    // Watch document root for attribute changes
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    // Also watch body element
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const setContent = async () => {
      // Wait for CSS variables to update after theme change
      await new Promise(resolve => setTimeout(resolve, 150));

      // Excalidraw default colors that should be replaced with editor background
      const EXCALIDRAW_DEFAULTS = ['#ffffff', '#000000', 'transparent', ''];

      // Get current background color from appState
      const currentBg = appState?.viewBackgroundColor || 'transparent';

      // Check if it's a default color that should match editor background
      const shouldUseEditorBackground = EXCALIDRAW_DEFAULTS.includes(
        currentBg.toLowerCase(),
      );

      // Strategy: Let Excalidraw handle stroke colors via exportWithDarkMode
      // Set background via CSS on container instead of in SVG
      const modifiedAppState = {
        ...appState,
        // Use transparent background - we'll set container background via CSS
        viewBackgroundColor: shouldUseEditorBackground
          ? 'transparent'
          : appState?.viewBackgroundColor,
        // exportBackground: false so SVG has no background rect
        exportBackground: !shouldUseEditorBackground,
        // Use exportWithDarkMode to get correct stroke colors for theme
        exportWithDarkMode: theme === 'dark',
      };

      const svg: SVGElement = await exportToSvg({
        appState: modifiedAppState,
        elements,
        files,
      });

      removeStyleFromSvg_HACK(svg);

      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      svg.setAttribute('display', 'block');

      setSvg(svg);
    };
    setContent();
  }, [elements, files, appState, theme, cssVersion]);

  // Build container style with editor background color
  const containerStyle: React.CSSProperties = {};
  if (width !== 'inherit') {
    containerStyle.width = `${width}px`;
  }
  if (height !== 'inherit') {
    containerStyle.height = `${height}px`;
  }

  // Set background color on container (not in SVG)
  const currentBg = appState?.viewBackgroundColor || 'transparent';
  const EXCALIDRAW_DEFAULTS = ['#ffffff', '#000000', 'transparent', ''];
  const shouldUseEditorBackground = EXCALIDRAW_DEFAULTS.includes(
    currentBg.toLowerCase(),
  );

  if (shouldUseEditorBackground) {
    /*
     * The document's own background, named rather than computed.
     *
     * This used to read `--vscode-editor-background` off
     * `document.documentElement` and fall back to a literal `#ffffff`. Both
     * halves were wrong for a Datalayer surface: nothing here sets the VSCode
     * variable, and Primer declares its variables on the theme provider's
     * wrapper rather than on the root element — so the lookup always missed
     * and every drawing was painted pure white, however cream, sand or ivory
     * the page around it was.
     *
     * Left as a `var()` chain instead of resolving it in JS, because that is
     * what makes it *stay* right. CSS resolves each variable against the
     * nearest ancestor that declares it, which is exactly the enclosing themed
     * region, and re-resolves on its own when the theme changes — including
     * the case a computed colour could never catch, where the palette changes
     * but the colour mode does not (`datalayer` to `sand`, both light).
     *
     * The order is the hosts this editor runs in: Primer first, since every
     * Datalayer surface carries it and `JupyterReactTheme` maps JupyterLab's
     * palette onto it; then JupyterLab's own, then VSCode's, and only then a
     * literal, chosen for the colour mode in effect.
     */
    const fallback = theme === 'dark' ? '#1e1e1e' : '#ffffff';
    containerStyle.backgroundColor =
      `var(--bgColor-default, var(--jp-layout-color0, ` +
      `var(--vscode-editor-background, ${fallback})))`;
  }

  return (
    <div
      ref={element => {
        setNode(element);
        if (element && imageContainerRef) {
          imageContainerRef.current = element;
        }
      }}
      className={rootClassName ?? ''}
      style={containerStyle}
      dangerouslySetInnerHTML={{ __html: Svg?.outerHTML ?? '' }}
    />
  );
}

/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The colours JupyterLab gives collaborators, taken from the active theme.
 *
 * JupyterLab names seven of them, `--jp-collaborator-color1` through `7`, and
 * hands them to cursors, selections and avatars in a shared document. They
 * used to be seven fixed pastels typed into this file, which meant a page in
 * any Datalayer theme drew its collaborators in colours belonging to none of
 * them.
 *
 * They come from primer-addons now — one palette, shared with every Primer
 * surface on the page, so a notebook and the chrome around it agree on who is
 * who. See `CollaboratorPalette` there for how a person keeps their colour.
 *
 * @module theme/JupyterPalette
 */

import {
  collaboratorColorVars,
  collaboratorColors,
  type ThemeVariant,
} from '@datalayer/primer-addons';

/**
 * The seven, as JupyterLab's own variable names.
 *
 * Read for a theme and a mode; the dark reading by default, which is what a
 * caller that has not said gets — cursors have to stay visible, and the vivid
 * reading is the safer of the two on either surface.
 */
export function jupyterCollaboratorColors(
  variant: ThemeVariant = 'datalayer',
  colorMode: 'light' | 'dark' | 'auto' = 'dark'
): Record<string, string> {
  const vars = collaboratorColorVars(variant, colorMode);
  return Object.fromEntries(
    Object.entries(vars).filter(([name]) =>
      name.startsWith('--jp-collaborator-color')
    )
  );
}

/**
 * The colour behind `var(--jp-collaborator-colorN)`.
 *
 * Takes the name with or without the `var()` around it, since that is how
 * JupyterLab's awareness state carries it.
 */
export const jpCssToColor = (
  cssVariableName: string,
  variant: ThemeVariant = 'datalayer',
  colorMode: 'light' | 'dark' | 'auto' = 'dark'
): string | undefined => {
  const name = cssVariableName
    .replaceAll('var(', '')
    .replaceAll(')', '')
    .trim();
  const index = Number(/^--jp-collaborator-color(\d+)$/.exec(name)?.[1]);
  if (!index) {
    return undefined;
  }
  const colors = collaboratorColors(variant, colorMode);
  // JupyterLab counts its colours from one.
  return colors[(index - 1) % colors.length];
};

/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

const JUPYTERLAB_COLLABORATORS_COLORS: Record<string, string> = {
  '--jp-collaborator-color1': '#ffad8e',
  '--jp-collaborator-color2': '#dac83d',
  '--jp-collaborator-color3': '#72dd76',
  '--jp-collaborator-color4': '#00e4d0',
  '--jp-collaborator-color5': '#45d4ff',
  '--jp-collaborator-color6': '#e2b1ff',
  '--jp-collaborator-color7': '#ff9de6',
};

/**
 * The colour behind a JupyterLab collaborator CSS variable
 * (`--jp-collaborator-color1` ... `7`, bare or as `var(...)`).
 *
 * @deprecated Collaborator colours come from the `@datalayer/primer-addons`
 * collaborator palette now (`collaboratorColor`); nothing here reads these
 * variables any more. Kept so existing imports keep compiling; it will be
 * removed in the next major version.
 */
export const jpCssToColor = (cssVariableName: string): string | undefined =>
  JUPYTERLAB_COLLABORATORS_COLORS[
    cssVariableName.replaceAll('var(', '').replaceAll(')', '')
  ];

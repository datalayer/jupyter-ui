/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/*
 * Copyright (c) 2023-2025 Datalayer, Inc.
 * Distributed under the terms of the Modified BSD License.
 */

const JUPYTERLAB_COLLABORATORS_COLORS = {
  '--jp-collaborator-color1': '#ffad8e',
  '--jp-collaborator-color2': '#dac83d',
  '--jp-collaborator-color3': '#72dd76',
  '--jp-collaborator-color4': '#00e4d0',
  '--jp-collaborator-color5': '#45d4ff',
  '--jp-collaborator-color6': '#e2b1ff',
  '--jp-collaborator-color7': '#ff9de6',
};

export const jpCssToColor = (cssVariableName: string) => {
  return (JUPYTERLAB_COLLABORATORS_COLORS as any)[
    cssVariableName.replaceAll('var(', '').replaceAll(')', '')
  ];
};

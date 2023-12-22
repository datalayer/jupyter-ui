/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import { Dialog } from '@jupyterlab/apputils';


export function createLabButton(args): string {
  if (args.variant === 'invisible') {
    return `<p>No variant invisible available</p>`;
  }
  const labButton = Dialog.defaultRenderer.createButtonNode(Dialog.createButton({
    label: args.label,
    displayType: args.variant === 'danger' ? 'warn' : undefined,
    accept: args.variant === 'primary' ? true : false
  }));
  if(!args.noModStyled) {
    labButton.classList.add('jp-mod-styled');
  }

  return labButton.outerHTML;
}

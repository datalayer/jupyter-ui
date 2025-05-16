/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { Button as BaseButton, ButtonProps } from '@primer/react';
import type { BetterCssProperties } from '@primer/react';
import type { FC } from 'react';

/**
 * Primer button tuned to fit JupyterLab dialog button
 */
export const Button: FC<ButtonProps> = props => {
  const sx: BetterCssProperties = {};
  switch (props.variant) {
    case 'danger':
      sx.backgroundColor = 'var(--jp-error-color1)';
      sx.color = 'btn.primary.text';
      sx.borderWidth = 0;
      break;
    case 'primary':
      sx.borderWidth = 0;
      break;
    case 'invisible':
      break;
    default:
      sx.backgroundColor = 'var(--jp-reject-color-normal)';
      sx.color = 'btn.primary.text';
      sx.borderWidth = 0;
      // @ts-expect-error unknow index
      sx[':active:not([disabled]):not([data-inactive])'] = {
        backgroundColor: 'var(--jp-reject-color-active)',
        color: 'btn.primary.text',
      };
      // @ts-expect-error unknow index
      sx[':hover:not([disabled]):not([data-inactive])'] = {
        backgroundColor: 'var(--jp-reject-color-hover)',
        color: 'btn.primary.text',
      };
      break;
  }
  return <BaseButton sx={sx} {...props} />;
};

export default Button;

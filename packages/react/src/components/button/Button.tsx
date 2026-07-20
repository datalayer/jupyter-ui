/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { Button as BaseButton, ButtonProps } from '@primer/react';
import type { FC } from 'react';

/**
 * Primer button tuned to fit JupyterLab dialog button
 */
export const Button: FC<ButtonProps> = props => {
  const sx: NonNullable<ButtonProps['sx']> =
    props.variant === 'danger'
      ? {
          backgroundColor: 'var(--jp-error-color1)',
          color: 'btn.primary.text',
          borderWidth: 0,
        }
      : props.variant === 'primary'
        ? {
            borderWidth: 0,
          }
        : props.variant === 'invisible'
          ? {}
          : {
              backgroundColor: 'var(--jp-reject-color-normal)',
              color: 'btn.primary.text',
              borderWidth: 0,
              ':active:not([disabled]):not([data-inactive])': {
                backgroundColor: 'var(--jp-reject-color-active)',
                color: 'btn.primary.text',
              },
              ':hover:not([disabled]):not([data-inactive])': {
                backgroundColor: 'var(--jp-reject-color-hover)',
                color: 'btn.primary.text',
              },
            };
  return <BaseButton sx={sx} {...props} />;
};

export default Button;

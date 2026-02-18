/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Button - Migrated from custom CSS to Primer React Button.
 * Keeps the same export signature so all consumers work unchanged.
 */

import { ReactNode } from 'react';
import { Button as PrimerButton } from '@primer/react';

export const Button = ({
  'data-test-id': dataTestId,
  children,
  className,
  onClick,
  disabled,
  small,
  title,
}: {
  'data-test-id'?: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick: () => void;
  small?: boolean;
  title?: string;
}): JSX.Element => {
  return (
    <PrimerButton
      disabled={disabled}
      onClick={onClick}
      title={title}
      aria-label={title}
      size={small ? 'small' : 'medium'}
      variant="default"
      className={className}
      {...(dataTestId && { 'data-test-id': dataTestId })}
    >
      {children}
    </PrimerButton>
  );
};

export default Button;

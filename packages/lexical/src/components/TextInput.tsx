/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { FormControl, TextInput as PrimerTextInput } from '@primer/react';

type Props = Readonly<{
  'data-test-id'?: string;
  label: string;
  onChange: (val: string) => void;
  placeholder?: string;
  value: string;
}>;

export const TextInput = ({
  label,
  value,
  onChange,
  placeholder = '',
  'data-test-id': dataTestId,
}: Props): JSX.Element => {
  return (
    <FormControl>
      <FormControl.Label>{label}</FormControl.Label>
      <PrimerTextInput
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          onChange(e.target.value);
        }}
        data-test-id={dataTestId}
        block
      />
    </FormControl>
  );
};

export default TextInput;

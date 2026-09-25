/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * A file to upload, asked for with Primer's form control.
 *
 * It was a bare `label` and `input` under three `Input__*` classes from the
 * Lexical playground's stylesheet; `FormControl` carries the label, the
 * spacing and the focus ring itself, so those rules are gone.
 *
 * @module components/FileInput
 */

import type { JSX } from 'react';
import { FormControl, TextInput } from '@primer/react';

type Props = Readonly<{
  'data-test-id'?: string;
  accept?: string;
  label: string;
  onChange: (files: FileList | null) => void;
}>;

export const FileInput = ({
  accept,
  label,
  onChange,
  'data-test-id': dataTestId,
}: Props): JSX.Element => {
  return (
    <FormControl>
      <FormControl.Label>{label}</FormControl.Label>
      <TextInput
        type="file"
        accept={accept}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          onChange(event.target.files)
        }
        data-test-id={dataTestId}
        block
      />
    </FormControl>
  );
};

export default FileInput;

/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

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
    <div className="Input__wrapper">
      <label className="Input__label">{label}</label>
      <input
        type="file"
        accept={accept}
        className="Input__input"
        onChange={e => onChange(e.target.files)}
        data-test-id={dataTestId}
      />
    </div>
  );
};

export default FileInput;

/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import './../../style/lexical/Input.css';

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
    <div className="Input__wrapper">
      <label className="Input__label">{label}</label>
      <input
        type="text"
        className="Input__input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        data-test-id={dataTestId}
      />
    </div>
  );
}

export default TextInput;

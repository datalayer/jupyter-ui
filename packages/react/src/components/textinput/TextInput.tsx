/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import {TextInput as BaseTextInput, TextInputProps} from '@primer/react'
import type { BetterSystemStyleObject } from '@primer/react/lib/sx'
import type {FC} from 'react'

/**
 * Primer button tuned to fit JupyterLab dialog button
 */
export const TextInput: FC<TextInputProps> = (props) => {
    const sx: BetterSystemStyleObject = {
        border: 'none',
        ':focus-within': {
            borderColor: 'inherit',
            outline: 'none',
            boxShadow: 'inset 0 0 0 var(--jp-border-width) var(--jp-input-active-box-shadow-color), inset 0 0 0 3px var(--jp-input-active-box-shadow-color)'
        }
    };

    return <BaseTextInput sx={sx} {...props} />
} 

export default TextInput;

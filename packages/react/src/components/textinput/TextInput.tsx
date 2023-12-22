import {TextInput as BaseTextInput, TextInputProps} from '@primer/react'
import type { BetterSystemStyleObject } from '@primer/react/lib/sx'
import type {FC} from 'react'

/**
 * Primer button tuned to fit JupyterLab dialog button
 */
export const TextInput: FC<TextInputProps> = (props) => {
    const sx: BetterSystemStyleObject = {
        border: 'none'
    };

    return <BaseTextInput sx={sx} {...props} />
} 

export default TextInput;

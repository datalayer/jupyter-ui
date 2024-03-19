import { FC } from "react";
import ReactTextareaAutosize from "react-textarea-autosize";

interface TextareaAutosizeProps {
    value: string;
    onValueChange: (value: string) => void;
    textareaRef?: React.RefObject<HTMLTextAreaElement>;
    className?: string;
    placeholder?: string;
    minRows?: number;
    maxRows?: number;
    onKeyDown?: (event: React.KeyboardEvent) => void;
    onPaste?: (event: React.ClipboardEvent) => void;
    onCompositionStart?: (event: React.CompositionEvent) => void;
    onCompositionEnd?: (event: React.CompositionEvent) => void;
}

export const TextareaAutosize: FC<TextareaAutosizeProps> = ({
    value,
    onValueChange,
    textareaRef,
    className,
    placeholder = "",
    minRows = 1,
    maxRows = 6,
    onKeyDown = () => {},
    onPaste = () => {},
    onCompositionStart = () => {},
    onCompositionEnd = () => {},
}) => {
    return (
        <ReactTextareaAutosize
            ref={textareaRef}
            style={{backgroundColor: '#1B1B1B', color: 'white', width: '100%', borderColor: "rgba(255,255,255,0.1)"}}
            // className={`dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:ring dark:focus:ring-blue-500 dark:focus:outline-none dark:rounded-md dark:border dark:border-gray-700 ${className}`}
            minRows={minRows}
            maxRows={minRows > maxRows ? minRows : maxRows}
            placeholder={placeholder}
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            onCompositionStart={onCompositionStart}
            onCompositionEnd={onCompositionEnd}
        />
    );
};

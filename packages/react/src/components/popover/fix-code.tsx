import { useState, useEffect, ChangeEvent } from 'react';
import { useDispatch } from 'react-redux';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { Typography, TextField } from '@mui/material';
import { notebookActions } from '../notebook/NotebookRedux';
import { selectNotebook } from '../notebook/NotebookRedux';

interface FixCodeProps {
    uid: string;
    onClose: any;
}

const FixCode: React.FC<FixCodeProps> = ({ uid, onClose }) => {
    const [prompt, setPrompt] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const selectedNotebook = selectNotebook(uid);
    const dispatch = useDispatch();

    const handlePromptChange = (event: ChangeEvent<HTMLInputElement>) => {
        setPrompt(event.target.value);
    };

    const handleErrorMessageChange = (event: ChangeEvent<HTMLInputElement>) => {
        setErrorMessage(event.target.value);
    };

    useEffect(() => {
        const adapter = selectedNotebook?.adapter?.notebookPanel?.content;
        const currentIndex = adapter?.activeCellIndex;

        // @ts-ignore
        const selectedWidget = adapter?.widgets[currentIndex];
        const errorText =
            selectedWidget?.node.childNodes[3].innerText.toString();
        setErrorMessage(errorText);
    }, []);

    const handleSubmit = () => {
        try {
            dispatch(
                notebookActions.fixCode.started({
                    uid: uid,
                    fixPrompt: prompt,
                    errorMessage: errorMessage,
                })
            );
            onClose();
        } catch (error) {
            console.error('Error modifying code: ', error);
        }
    };

    return (
        <Box
            sx={{
                backgroundColor: '#1B1B1B',
                color: '#FFFFFF', // Text color
                position: 'relative',
                width: 650,
                p: 2,
                border: '1.5px solid rgba(255,255,255,0.1)', // Outer box border
            }}
        >
            <Typography sx={{ fontWeight: 'semibold', fontSize: 16 }}>
                Fix Code
            </Typography>

            {/* Prompt TextArea */}
            <Box sx={{ mt: 2 }}>
                <Typography sx={{ fontWeight: 'semibold', fontSize: 12 }}>
                    Prompt (optional)
                </Typography>
                <TextField
                    placeholder="Write your prompt here..."
                    multiline
                    rows={2}
                    variant="outlined"
                    fullWidth
                    value={prompt}
                    onChange={handlePromptChange}
                    sx={{
                        mt: 1,
                        '& .MuiOutlinedInput-root': {
                            borderColor: 'rgba(255,255,255,0.1)', // TextField border color
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255,255,255,0.1)', // Hover state border color
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(255,255,255,0.1)', // Focused state border color
                            },
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255,255,255,0.1)', // Notched outline border color
                        },
                    }}
                    InputProps={{
                        style: { color: '#FFFFFF', fontSize: 12 }, // Text color of TextArea
                    }}
                />
            </Box>

            {/* Error TextArea */}
            <Box sx={{ mt: 2 }}>
                <Typography
                    sx={{
                        fontWeight: 'semibold',
                        fontSize: 12,
                        color: '#BD0202',
                        marginBottom: 1,
                    }}
                >
                    Error Message
                </Typography>
                <TextField
                    multiline
                    rows={10}
                    variant="outlined"
                    fullWidth
                    value={errorMessage}
                    onChange={handleErrorMessageChange}
                    sx={{
                        '& .MuiInputBase-input': {
                            fontFamily: 'monospace', // Use monospace font for code-like appearance
                            whiteSpace: 'pre-wrap', // Preserve line breaks and spaces
                            color: '#BD0202', // Use error color for text
                        },
                        '& .MuiOutlinedInput-root': {
                            borderColor: '#BD0202', // Error color for TextField border
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#BD0202', // Hover state border color
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#BD0202', // Focused state border color
                            },
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#BD0202', // Notched outline border color
                        },
                    }}
                    InputProps={{
                        style: { fontSize: 12 }, // Text color of TextArea
                    }}
                />
            </Box>

            {/* Buttons */}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    variant="text"
                    onClick={() => onClose()}
                    sx={{
                        mr: 1,
                        color: 'rgba(255,255,255,0.7)', // Text color
                        backgroundColor: 'transparent', // Transparent background
                        textTransform: 'none', // Prevent all caps
                    }}
                >
                    Cancel
                </Button>
                <Button
                    variant="outlined"
                    onClick={handleSubmit}
                    sx={{
                        color: 'rgba(255,255,255,0.9)', // Text color
                        textTransform: 'none', // Prevent all caps
                    }}
                >
                    Submit Fix
                </Button>
            </Box>
        </Box>
    );
};

export default FixCode;

import { useState, ChangeEvent } from 'react';
import { useDispatch } from 'react-redux';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { Typography, TextField } from '@mui/material';
import { notebookActions } from '../notebook/NotebookRedux';

interface ModifyCodeProps {
    uid: string;
    onClose: any;
}

const ModifyCode: React.FC<ModifyCodeProps> = ({ uid, onClose }) => {
    const [prompt, setPrompt] = useState('');
    const dispatch = useDispatch();

    const handlePromptChange = (event: ChangeEvent<HTMLInputElement>) => {
        setPrompt(event.target.value);
    };

    const handleSubmit = () => {
        try {
            dispatch(
                notebookActions.modifyCode.started({
                    uid: uid,
                    modifyPrompt: prompt,
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
                width: 600,
                p: 3,
                border: '1.5px solid rgba(255,255,255,0.1)', // Outer box border
            }}
        >
            <Typography sx={{ fontWeight: 'semibold', fontSize: 16 }}>
                Modify Code
            </Typography>

            {/* Prompt TextArea */}
            <Box sx={{ mt: 2 }}>
                <Typography sx={{ fontWeight: 'semibold', fontSize: 12 }}>
                    Prompt
                </Typography>
                <TextField
                    placeholder="Write your prompt here..."
                    multiline
                    rows={4}
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
                    Submit
                </Button>
            </Box>
        </Box>
    );
};

export default ModifyCode;

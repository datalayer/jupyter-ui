import { FC, useState } from 'react';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { Typography } from '@mui/material';

interface ModifyCodeProps {
    onSubmit: (newPrompt: string) => void;
    onCancel: () => void;
}

const ModifyCode: FC<ModifyCodeProps> = ({ onSubmit, onCancel }) => {
    const [prompt, setPrompt] = useState('');

    const handleSubmit = () => {
        onSubmit(prompt);
    };

    return (
        <Box
            sx={{
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                p: 2,
                backgroundColor: '#1B1B1B',
                position: 'relative',
                width: 400
            }}
        >
            <Box sx={{ mb: 2 }}>
                <Typography variant="h6">Modify Code</Typography>
            </Box>
            <TextareaAutosize
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your new chat prompt"
                minRows={3}
                maxRows={6}
                style={{
                    backgroundColor: '#1B1B1B',
                    color: 'white',
                    width: '380',
                    border: 'none',
                    resize: 'none',
                    outline: 'none',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',

                }}
            />
            <Box
                sx={{
                    width: '100%',
                    alignSelf: 'flex-end'
                }}
            >   
                <Button variant="outlined" onClick={onCancel} sx={{ ml: 1 }}>
                    Cancel
                </Button>
                <Button variant="contained" onClick={handleSubmit} sx={{ ml: 1 }}>
                    Submit
                </Button>
            </Box>
        </Box>
    );
};

export default ModifyCode;

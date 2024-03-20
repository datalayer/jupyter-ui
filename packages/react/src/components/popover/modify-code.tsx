import { useState } from 'react';
import { useDispatch } from 'react-redux';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { Typography } from '@mui/material';
import { TextareaAutosize } from '../text/textarea-autosize';
import { notebookActions } from '../notebook/NotebookRedux';

interface ModifyCodeProps {
    uid: string;
}

const ModifyCode: React.FC<ModifyCodeProps> = ({ uid }) => {
    const [prompt, setPrompt] = useState('');
    const dispatch = useDispatch();

    const handleSubmit = () => {
        dispatch(
            notebookActions.modifyCode.started({
                uid: uid,
                modifyPrompt: prompt,
            })
        );
    };

    return (
        <Box
            sx={{
                backgroundColor: '#1B1B1B',
                position: 'relative',
                width: 600,
                border: 1,
                borderColor: 'rgba(255,255,255,0.1)',
            }}
        >
            <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontWeight: 'semibold', fontSize: 16 }}>
                    Modify Code
                </Typography>
            </Box>
            <TextareaAutosize
                className="bg-background border-input border-0.5"
                placeholder="Modify this code..."
                onValueChange={prompt => setPrompt(prompt)}
                value={prompt}
                minRows={3}
                maxRows={6}
            />
            <Box
                sx={{
                    width: '100%',
                    alignSelf: 'flex-end',
                }}
            >
                {/* <Button variant="outlined" onClick={onCancel} sx={{ ml: 1 }}>
                    Cancel
                </Button> */}
                <Button variant="text" onClick={handleSubmit} sx={{ ml: 1 }}>
                    Submit
                </Button>
            </Box>
        </Box>
    );
};

export default ModifyCode;

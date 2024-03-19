import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import Fade from '@mui/material/Fade';
import {
    Box,
    Card,
    Container,
    Typography,
    Divider,
    Stack,
    Button,
    TextareaAutosize,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const CustomDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiPaper-root': {
        borderRadius: 12, // Adjust the border radius as needed
        boxShadow: 'rgba(0, 0, 0, 0.0)', // Optional: add custom box shadow
        backgroundColor: '#1B1B1B', // Use theme palette for consistent background color
    },
}));

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Fade ref={ref} {...props} />;
});

const ModifyModal = ({ handleClose }) => {
    const [textValue, setTextValue] = useState('');

    const handleSubmit = () => {
        // Handle submit logic here
        console.log('Submitted:', textValue);
    };

    const handleChange = (event) => {
        setTextValue(event.target.value);
    };

    return (
        <Container maxWidth="sm">
            <Card
                elevation={0}
                sx={{
                    p: 4,
                    backgroundColor: '#1B1B1B',
                }}>
                <Typography variant="h5" gutterBottom>
                    Modify
                </Typography>
                <Divider />
                <Stack spacing={2} mt={2}>
                    <TextareaAutosize
                        minRows={4}
                        maxRows={10}
                        placeholder="Enter your modification here"
                        value={textValue}
                        onChange={handleChange}
                        style={{ width: '100%' }}
                    />
                    <Button variant="contained" onClick={handleSubmit}>
                        Submit
                    </Button>
                    <Button variant="outlined" onClick={handleClose}>
                        Cancel
                    </Button>
                </Stack>
            </Card>
        </Container>
    );
};

export const PromptModal = React.memo(({ show, setShow }) => {
    const [currComponentIdx, setCurrComponentIdx] = useState(0);

    const renderComponent = () => {
        switch (currComponentIdx) {
            case 0:
                return <ModifyModal handleClose={() => setShow(false)} />;

            default:
                return <ModifyModal handleClose={() => setShow(false)} />;
        }
    };

    return (
        <CustomDialog open={show} onClose={() => setShow(false)} TransitionComponent={Transition}>
            <Box
                sx={{
                    backgroundColor: '#1B1B1B',
                    display: 'flex',
                    flexDirection: 'column',
                    width: 500,
                    alignItems: 'center',
                }}>
                {renderComponent()}
            </Box>
        </CustomDialog>
    );
});

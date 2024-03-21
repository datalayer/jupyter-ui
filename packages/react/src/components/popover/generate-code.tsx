import { useState, ChangeEvent } from 'react';
import { useDispatch } from 'react-redux';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { Typography, TextField } from '@mui/material';
import { notebookActions } from '../notebook/NotebookRedux';
import { MultipleSelectCheckmarks } from '../select/multi-select';
import { selectNotebook } from '../notebook/NotebookRedux';
import { HiMiniQuestionMarkCircle } from 'react-icons/hi2';

interface ModifyCodeProps {
    uid: string;
    onClose: any;
}

const GenerateCode: React.FC<ModifyCodeProps> = ({ uid, onClose }) => {
    const [prompt, setPrompt] = useState('');
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const dispatch = useDispatch();

    const selectedNotebook = selectNotebook(uid);

    const adapter = selectedNotebook?.adapter?.notebookPanel?.content;
    const currentIndex = adapter?.activeCellIndex;

    const widgetList = adapter?.widgets.slice(0, currentIndex);
    const widgetMap = widgetList?.map(widget => widget.model);
    const filteredMap = widgetMap?.filter(
        widget => widget.toJSON().cell_type === 'code'
    );

    const cellSelection = filteredMap?.map((item, index) => {
        return {
            idx: index,
            label: `Code Cell ${index + 1}`,
        };
    });

    const handlePromptChange = (event: ChangeEvent<HTMLInputElement>) => {
        setPrompt(event.target.value);
    };

    const handleSubmit = () => {
        try {
            let codePrevious = '';
            // Sort selectedItems array in ascending order
            selectedItems
                .sort((a, b) => a - b)
                .forEach(i => {
                    if (filteredMap && filteredMap[i]) {
                        codePrevious += `\n${filteredMap[i]
                            .toJSON()
                            .source.toString()}\n`;
                    }
                });
            console.log('Prompt: ', prompt);
            dispatch(
                notebookActions.codeGenerate.started({
                    uid: uid,
                    previousCode: codePrevious,
                    codeGeneratePrompt: prompt, // Corrected key name
                })
            );
            onClose();
        } catch (error) {
            console.error('Error generating code: ', error);
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
                Generate Code
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

            {/* Code Cells Selection */}
            <Box sx={{ mt: 3 }}>
                <Typography
                    sx={{
                        fontWeight: 'semibold',
                        fontSize: 12,
                        marginBottom: 1,
                        display: 'flex', // To align the icon vertically
                        alignItems: 'center', // To center the icon vertically
                    }}
                >
                    Code Cells to include in the context. Takes last cell by
                    default (optional)
                    <span
                        data-toggle="tooltip"
                        title="Here you can select which code cells before the current cell you want to include in the context. Often times the LLM needs to interpret code cells beyond the last cell in order to give a more accurate response."
                        style={{ marginLeft: '4px', cursor: 'help' }} // Adjust the spacing and cursor style
                    >
                        <HiMiniQuestionMarkCircle
                            size={16}
                            style={{ color: 'white', marginBottom: -4 }}
                        />
                    </span>
                </Typography>
                <MultipleSelectCheckmarks
                    selection={cellSelection}
                    selectedItems={selectedItems}
                    setSelectedItems={setSelectedItems}
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

export default GenerateCode;

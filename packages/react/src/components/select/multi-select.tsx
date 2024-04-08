import React, { ChangeEvent } from 'react';

import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import { Chip } from '@mui/material';
import Select from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';

const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: 300,
            width: 250,
            backgroundColor: '#1B1B1B', // Background color of dropdown
        },
    },
};

interface MultipleSelectCheckmarksProps {
    selection: any;
    selectedItems: any;
    setSelectedItems: any;
}

export const MultipleSelectCheckmarks: React.FC<
    MultipleSelectCheckmarksProps
> = ({ selection, selectedItems, setSelectedItems }) => {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const {
            target: { value },
        } = event;
        setSelectedItems(value);
    };

    return (
        <div>
            <FormControl sx={{ width: '100%' }}>
                <Select
                    labelId="demo-multiple-checkbox-label"
                    id="demo-multiple-checkbox"
                    multiple
                    value={selectedItems}
                    onChange={handleChange}
                    renderValue={selected => (
                        <div
                            style={{
                                display: 'flex',
                                gap: '3px',
                                overflowX: 'hidden', // Hide horizontal scrollbar
                                borderColor: 'rgba(255,255,255,0.1)',
                                marginLeft: -8,
                            }}
                        >
                            {selected.map((index: number) => (
                                <Chip
                                    key={index}
                                    label={selection[index].label}
                                    sx={{
                                        borderRadius: '5px',
                                        border: '0.5px solid rgba(255,255,255,0.08)',
                                    }}
                                />
                            ))}
                        </div>
                    )}
                    MenuProps={MenuProps}
                    sx={{
                        height: '42px',
                        '& .MuiOutlinedInput-input': {
                            color: '#FFFFFF', // Text color of input
                        },
                        '& .MuiOutlinedInput-root': {
                            borderColor: 'rgba(255, 255, 255, 0.1)', // Border color of the Select
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderStyle: 'none',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderStyle: 'none', // Set to 'solid' to keep the border
                                borderColor: 'rgba(255, 255, 255, 0.1)', // Always maintain this color
                            },
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderStyle: 'solid', // Set to 'solid' to keep the border
                            borderColor: 'rgba(255, 255, 255, 0.1)', // Always maintain this color
                        },
                        '& .MuiChip-root': {
                            backgroundColor: '#161616', // Background color of chips
                            height: '32px', // Adjusted chip height
                            display: 'flex',
                            alignItems: 'center',
                            paddingRight: '1px', // Adjust chip padding
                        },
                        '& .MuiChip-label': {
                            color: '#FFFFFF', // Text color of chips
                        },
                        '& .MuiMenuItem-root': {
                            minHeight: 'auto', // Remove minimum height
                            lineHeight: 'normal', // Reset line height
                            color: '#FFFFFF', // Text color of menu items
                        },
                        '& .MuiSelect-icon': {
                            color: 'rgba(255, 255, 255, 0.5)', // Lighter dropdown arrow color
                        },
                    }}
                >
                    {selection.map((cell: any, index: number) => (
                        <MenuItem
                            sx={{ height: 40, color: 'white' }}
                            key={index}
                            value={index}
                        >
                            <Checkbox
                                checked={selectedItems.indexOf(index) > -1}
                                sx={{ color: '#FFFFFF' }}
                            />
                            {cell.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </div>
    );
};

/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Box, Button, ButtonGroup } from '@primer/react';
import { StopIcon, TrashIcon } from '@primer/octicons-react';

import { cmdIds } from '../../components/notebook/NotebookCommands';
import {
    notebookActions,
    selectNotebook,
    selectSaveRequest,
} from '../../components/notebook/NotebookRedux';

import { IoMdSave } from 'react-icons/io';
import { FaPlay, FaPlayCircle } from 'react-icons/fa';
import { FaWandMagicSparkles } from 'react-icons/fa6';
import { MdOutlineAdd } from 'react-icons/md';
import { Stack, Typography } from '@mui/material';

import AppBar from '@mui/material/AppBar';

export const NotebookToolbarAutoSave = (props: { notebookId: string }) => {
    const { notebookId } = props;
    const [addType, setAddType] = useState('code');
    const dispatch = useDispatch();
    const notebook = selectNotebook(notebookId);
    const saveRequest = selectSaveRequest(notebookId);
    // const notebookstate = useSelector((state: IJupyterReactState) => {
    //   return state.notebook;
    // });
    useEffect(() => {
        notebook?.adapter?.commands.execute(cmdIds.save);
    }, [saveRequest]);

    const handleChangeCellType = (newType: string) => {
        setAddType(newType);
    };
    return (
        <AppBar
            position={'sticky'}
            sx={{
                top: 0,
                height: 50,
                width: '100%',
                flexDirection: 'row',
                borderBottomWidth: 0.5,
                borderBottomColor: 'rgba(255,255,255,0.05)',
                backgroundColor: '#161616',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}
            elevation={2}
        >
            <Stack
                direction="row"
                spacing={0.5}
                style={{
                    alignItems: 'center',
                    width: '50%',
                    paddingLeft: '4vw',
                }}
            >
                <Button
                    style={{ alignItems: 'center', justifyContent: 'center' }}
                    variant="invisible"
                    size="small"
                    aria-label="Save Notebook"
                    title="Save Notebook"
                    sx={{
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)', // Adjust the background color on hover
                        },
                        transition: 'background-color 0.3s', // Add transition for smoother effect
                        color: 'rgba(255,255,255,0.3)',
                    }}
                    onClick={e => {
                        e.preventDefault();
                        dispatch(
                            notebookActions.save.started({
                                uid: notebookId,
                                date: new Date(),
                            })
                        );
                    }}
                >
                    <IoMdSave size={20} style={{ marginBottom: -1 }} />
                </Button>
                <Box
                    sx={{
                        width: 0.1,
                        height: 22,
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        marginX: 3,
                    }}
                />
                <Button
                    variant="invisible"
                    size="small"
                    aria-label="Insert cell"
                    title="Insert cell"
                    sx={{
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)', // Adjust the background color on hover
                        },
                        transition: 'background-color 0.3s', // Add transition for smoother effect
                        color: 'rgba(255,255,255,0.3)',
                    }}
                    onClick={e => {
                        e.preventDefault();
                        dispatch(
                            notebookActions.insertBelow.started({
                                uid: notebookId,
                                cellType: addType,
                            })
                        );
                    }}
                >
                    <MdOutlineAdd size={22} style={{ marginBottom: -1 }} />
                </Button>
                <Button
                    variant="invisible"
                    size="small"
                    aria-label="Delete"
                    title="Delete"
                    sx={{
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)', // Adjust the background color on hover
                        },
                        transition: 'background-color 0.3s', // Add transition for smoother effect
                        color: 'rgba(255,255,255,0.3)',
                    }}
                    onClick={e => {
                        e.preventDefault();
                        dispatch(notebookActions.delete.started(notebookId));
                    }}
                    icon={TrashIcon}
                />
                <Box
                    sx={{
                        width: 0.1,
                        height: 22,
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        marginX: 3,
                    }}
                />
                <Button
                    style={{ alignItems: 'center', justifyContent: 'center' }}
                    variant="invisible"
                    size="small"
                    aria-label="Run cell"
                    title="Run cell"
                    sx={{
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)', // Adjust the background color on hover
                        },
                        transition: 'background-color 0.3s', // Add transition for smoother effect
                        color: 'rgba(255,255,255,0.3)',
                    }}
                    onClick={e => {
                        e.preventDefault();
                        dispatch(notebookActions.run.started(notebookId));
                    }}
                >
                    <FaPlay size={12} />
                </Button>
                {notebook?.kernelStatus === 'idle' ? (
                    <Button
                        style={{
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        variant="invisible"
                        size="small"
                        aria-label="Run all cells"
                        title="Run all cells"
                        sx={{
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.05)', // Adjust the background color on hover
                            },
                            transition: 'background-color 0.3s', // Add transition for smoother effect
                            color: 'rgba(255,255,255,0.3)',
                        }}
                        onClick={e => {
                            e.preventDefault();
                            dispatch(
                                notebookActions.runAll.started(notebookId)
                            );
                        }}
                    >
                        <FaPlayCircle size={16} />
                    </Button>
                ) : (
                    <Button
                        variant="invisible"
                        size="small"
                        aria-label="Interrupt"
                        sx={{
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.05)', // Adjust the background color on hover
                            },
                            transition: 'background-color 0.3s', // Add transition for smoother effect
                            color: 'rgba(255,255,255,0.3)',
                        }}
                        onClick={e => {
                            e.preventDefault();
                            dispatch(
                                notebookActions.interrupt.started(notebookId)
                            );
                        }}
                        icon={StopIcon}
                    />
                )}

                <Box
                    sx={{
                        width: 0.1,
                        height: 22,
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        marginX: 3,
                    }}
                />
                <Button
                    variant="invisible"
                    size="small"
                    aria-label="Generate Code"
                    title="Generate Code"
                    sx={{
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)', // Adjust the background color on hover
                        },
                        transition: 'background-color 0.3s', // Add transition for smoother effect
                    }}
                    // onClick={e => {
                    //     e.preventDefault();
                    //     dispatch(
                    //         notebookActions.codeGenerate.started({
                    //             uid: notebookId,
                    //             cellType: 'code',
                    //         })
                    //     );
                    // }}
                >
                    <Stack
                        spacing={1}
                        direction="row"
                        sx={{ alignItems: 'center' }}
                    >
                        <Typography
                            sx={{ color: 'rgba(255, 255, 255, 0.3)' }}
                            fontSize={13}
                        >
                            Generate
                        </Typography>
                        <FaWandMagicSparkles
                            color="rgba(255, 255, 255, 0.5)"
                            size={17}
                            style={{ marginBottom: -2 }}
                        />
                    </Stack>
                </Button>
            </Stack>
            <Box
                sx={{
                    display: 'flex',
                    width: '50%',
                    paddingRight: '7vw',
                    gap: '0.75vw',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                }}
            >
                <ButtonGroup>
                    <Button
                        variant={addType === 'code' ? 'primary' : 'invisible'}
                        onClick={() => handleChangeCellType('code')}
                        size="small"
                        style={{
                            fontSize: 12,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor:
                                addType === 'code'
                                    ? 'rgba(255,255,255,0.1)'
                                    : 'transparent',
                            backgroundColor:
                                addType === 'code'
                                    ? 'rgba(255,255,255,0.05)'
                                    : 'transparent',
                            color: addType !== 'code' ? 'gray' : undefined, // Set color to gray if not selected
                        }}
                    >
                        Code
                    </Button>
                    <Button
                        variant={
                            addType === 'markdown' ? 'primary' : 'invisible'
                        }
                        onClick={() => handleChangeCellType('markdown')}
                        size="small"
                        style={{
                            fontSize: 12,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor:
                                addType === 'markdown'
                                    ? 'rgba(255,255,255,0.1)'
                                    : 'transparent',
                            marginInline: 2,
                            backgroundColor:
                                addType === 'markdown'
                                    ? 'rgba(255,255,255,0.05)'
                                    : 'transparent',
                            color: addType !== 'markdown' ? 'gray' : undefined, // Set color to gray if not selected
                        }}
                    >
                        Markdown
                    </Button>

                    <Button
                        variant={addType === 'raw' ? 'primary' : 'invisible'}
                        onClick={() => handleChangeCellType('raw')}
                        size="small"
                        style={{
                            fontSize: 12,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor:
                                addType === 'raw'
                                    ? 'rgba(255,255,255,0.1)'
                                    : 'transparent',
                            backgroundColor:
                                addType === 'raw'
                                    ? 'rgba(255,255,255,0.05)'
                                    : 'transparent',
                            color: addType !== 'raw' ? 'gray' : undefined, // Set color to gray if not selected
                        }}
                    >
                        Prompt
                    </Button>
                </ButtonGroup>
            </Box>
        </AppBar>
    );
};

export default NotebookToolbarAutoSave;

import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { PanelLayout } from '@lumino/widgets';
import { ActionMenu, Button, Box } from '@primer/react';
import { FaSyncAlt } from 'react-icons/fa';
import { FaTrash } from 'react-icons/fa';
import { GoTriangleDown } from 'react-icons/go';
import { GoTriangleUp } from 'react-icons/go';
import { FaPlay } from 'react-icons/fa';
import { RiToolsFill } from 'react-icons/ri';
import { FaWandMagicSparkles } from 'react-icons/fa6';
import { notebookActions, selectActiveCell } from '../../NotebookRedux';
import { CellSidebarProps } from './CellSidebarWidget';
import CellMetadataEditor from '../metadata/CellMetadataEditor';
import { DATALAYER_CELL_HEADER_CLASS } from './CellSidebarWidget';
import { Stack, Typography } from '@mui/material';

import ModifyCode from '../../../popover/modify-code';
import GenerateCode from '../../../popover/generate-code';
import FixCode from '../../../popover/fix-code';

import Popover from '@mui/material/Popover';

export const CellSidebar = (props: CellSidebarProps) => {
    const { notebookId, cellId, nbgrader } = props;
    const [visible, setVisible] = useState(false);

    const [anchorGenerate, setAnchorGenerate] =
        useState<HTMLButtonElement | null>(null);
    const [anchorModify, setAnchorModify] = useState<HTMLButtonElement | null>(
        null
    );
    const [anchorFix, setAnchorFix] = useState<HTMLButtonElement | null>(null);

    const handleClickGenerate = (
        event: React.MouseEvent<HTMLButtonElement>
    ) => {
        setAnchorGenerate(event.currentTarget);
    };

    const handleClickModify = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorModify(event.currentTarget);
    };

    const handleClickFix = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorFix(event.currentTarget);
    };

    const handleCloseGenerate = () => {
        setAnchorGenerate(null);
    };

    const handleCloseModify = () => {
        setAnchorModify(null);
    };

    const handleCloseFix = () => {
        setAnchorFix(null);
    };

    const dispatch = useDispatch();
    const activeCell = selectActiveCell(notebookId);
    const layout = activeCell?.layout;
    if (layout) {
        const cellWidget = (layout as PanelLayout).widgets[0];
        if (cellWidget?.node.id === cellId) {
            if (!visible) {
                setVisible(true);
            }
        }
        if (cellWidget?.node.id !== cellId) {
            if (visible) {
                setVisible(false);
            }
        }
    }
    if (!visible) {
        return <div></div>;
    }

    const openGenerate = Boolean(anchorGenerate);
    const idGenerate = openGenerate ? 'generate' : undefined;

    const openModify = Boolean(anchorModify);
    const idModify = openModify ? 'modify' : undefined;

    const openFix = Boolean(anchorFix);
    const idFix = openFix ? 'fix' : undefined;

    return activeCell ? (
        <Box
            className={DATALAYER_CELL_HEADER_CLASS}
            sx={{
                '& p': {
                    marginBottom: '0 !important',
                },
                borderWidth: 0.5,
                borderColor: 'rgba(255,255,255,0.05)',
            }}
        >
            {activeCell.model.type === 'raw' ? (
                <span style={{ display: 'flex' }}>
                    <Button
                        title="Generate"
                        variant="invisible"
                        size="small"
                        sx={{
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.05)', // Adjust the background color on hover
                            },
                            transition: 'background-color 0.3s', // Add transition for smoother effect
                        }}
                        onClick={handleClickGenerate}
                    >
                        <Stack
                            spacing={1}
                            direction="row"
                            sx={{ alignItems: 'center' }}
                        >
                            <FaWandMagicSparkles
                                color="rgba(255, 255, 255, 0.5)"
                                size={15}
                                style={{ marginBottom: -2 }}
                            />
                            <Typography
                                sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                                fontSize={13}
                            >
                                Generate
                            </Typography>
                        </Stack>
                    </Button>
                    <Popover
                        id={idGenerate}
                        open={openGenerate}
                        anchorEl={anchorGenerate}
                        onClose={handleCloseGenerate}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'left',
                        }}
                    >
                        <GenerateCode
                            uid={notebookId}
                            onClose={handleCloseGenerate}
                        />
                    </Popover>
                </span>
            ) : null}

            {activeCell.model.type === 'code' ? (
                <span style={{ display: 'flex' }}>
                    <Button
                        title="Fix"
                        variant="invisible"
                        size="small"
                        sx={{
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.05)', // Adjust the background color on hover
                            },
                            transition: 'background-color 0.3s', // Add transition for smoother effect
                        }}
                        onClick={handleClickFix}
                    >
                        <Stack
                            spacing={1}
                            direction="row"
                            sx={{ alignItems: 'center' }}
                        >
                            <RiToolsFill
                                color="rgba(255, 255, 255, 0.5)"
                                size={19}
                                style={{ marginBottom: -2 }}
                            />
                            <Typography
                                sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                                fontSize={13}
                            >
                                Fix
                            </Typography>
                        </Stack>
                    </Button>
                    <Popover
                        id={idFix}
                        open={openFix}
                        anchorEl={anchorFix}
                        onClose={handleCloseFix}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'left',
                        }}
                    >
                        <FixCode uid={notebookId} onClose={handleCloseFix} />
                    </Popover>
                </span>
            ) : null}

            {activeCell.model.type === 'code' ? (
                <span style={{ display: 'flex' }}>
                    <Button
                        title="Modify"
                        variant="invisible"
                        size="small"
                        sx={{
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.05)', // Adjust the background color on hover
                            },
                            transition: 'background-color 0.3s', // Add transition for smoother effect
                        }}
                        onClick={handleClickModify}
                    >
                        <Stack
                            spacing={1}
                            direction="row"
                            sx={{ alignItems: 'center' }}
                        >
                            <FaWandMagicSparkles
                                color="rgba(255, 255, 255, 0.5)"
                                size={15}
                                style={{ marginBottom: -2 }}
                            />
                            <Typography
                                sx={{
                                    color: 'rgba(255, 255, 255, 0.5)',
                                }}
                                fontSize={13}
                            >
                                Modify
                            </Typography>
                        </Stack>
                    </Button>
                    <Popover
                        id={idModify}
                        open={openModify}
                        anchorEl={anchorModify}
                        onClose={handleCloseModify}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'left',
                        }}
                    >
                        <ModifyCode
                            uid={notebookId}
                            onClose={handleCloseModify}
                        />
                    </Popover>
                </span>
            ) : null}

            {/* Function divider */}
            <Box
                sx={{
                    height: 0.5,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    width: '95%',
                    my: 1,
                }}
            />

            {activeCell.model.type !== 'raw' ? (
                <span style={{ display: 'flex' }}>
                    <Button
                        title="Run cell"
                        variant="invisible"
                        size="small"
                        sx={{
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.05)', // Adjust the background color on hover
                            },
                            transition: 'background-color 0.3s', // Add transition for smoother effect
                        }}
                        onClick={(e: any) => {
                            e.preventDefault();
                            dispatch(notebookActions.run.started(notebookId));
                        }}
                    >
                        <Stack
                            spacing={1}
                            direction="row"
                            sx={{ alignItems: 'center', paddingLeft: 0.5 }}
                        >
                            <FaPlay size={8} color="rgba(255,255,255,0.3)" />
                            <Typography
                                sx={{ color: 'rgba(255, 255, 255, 0.3)' }}
                                fontSize={13}
                            >
                                Run
                            </Typography>
                        </Stack>
                    </Button>
                </span>
            ) : null}

            <span style={{ display: 'flex' }}>
                <Button
                    title="Insert code cell above"
                    variant="invisible"
                    size="small"
                    onClick={(e: any) => {
                        e.preventDefault();
                        dispatch(
                            notebookActions.insertAbove.started({
                                uid: notebookId,
                                cellType: 'code',
                            })
                        );
                    }}
                >
                    <Stack
                        spacing={1}
                        direction="row"
                        sx={{ alignItems: 'center' }}
                    >
                        <GoTriangleUp size={16} color="rgba(255,255,255,0.3)" />
                        <Typography
                            sx={{ color: 'rgba(255, 255, 255, 0.3)' }}
                            fontSize={13}
                        >
                            Code
                        </Typography>
                    </Stack>
                </Button>
            </span>
            <span style={{ display: 'flex' }}>
                <Button
                    title="Insert markdown cell above"
                    variant="invisible"
                    size="small"
                    onClick={(e: any) => {
                        e.preventDefault();
                        dispatch(
                            notebookActions.insertAbove.started({
                                uid: notebookId,
                                cellType: 'markdown',
                            })
                        );
                    }}
                >
                    <Stack
                        spacing={1}
                        direction="row"
                        sx={{ alignItems: 'center' }}
                    >
                        <GoTriangleUp size={16} color="rgba(255,255,255,0.3)" />
                        <Typography
                            sx={{ color: 'rgba(255, 255, 255, 0.3)' }}
                            fontSize={13}
                        >
                            Markdown
                        </Typography>
                    </Stack>
                </Button>
            </span>
            <span style={{ display: 'flex' }}>
                <Button
                    title="Insert prompt cell above"
                    variant="invisible"
                    size="small"
                    onClick={(e: any) => {
                        e.preventDefault();
                        dispatch(
                            notebookActions.insertAbove.started({
                                uid: notebookId,
                                cellType: 'raw',
                            })
                        );
                    }}
                >
                    <Stack
                        spacing={1}
                        direction="row"
                        sx={{ alignItems: 'center' }}
                    >
                        <GoTriangleUp size={16} color="rgba(255,255,255,0.3)" />
                        <Typography
                            sx={{ color: 'rgba(255, 255, 255, 0.3)' }}
                            fontSize={13}
                        >
                            Prompt
                        </Typography>
                    </Stack>
                </Button>
            </span>
            <span style={{ display: 'flex' }}>
                {activeCell.model.type === 'code' ? (
                    <Button
                        title="Convert to markdown cell"
                        variant="invisible"
                        size="small"
                        onClick={(e: any) => {
                            e.preventDefault();
                            dispatch(
                                notebookActions.changeCellType.started({
                                    uid: notebookId,
                                    cellType: 'markdown',
                                })
                            );
                        }}
                    >
                        <Stack
                            spacing={1}
                            direction="row"
                            sx={{ alignItems: 'center', paddingLeft: 0.3 }}
                        >
                            <FaSyncAlt
                                size={12}
                                color="rgba(255,255,255,0.3)"
                            />
                            <Typography
                                sx={{ color: 'rgba(255, 255, 255, 0.3)' }}
                                fontSize={13}
                            >
                                To Markdown
                            </Typography>
                        </Stack>
                    </Button>
                ) : (
                    <Button
                        title="Convert to code cell"
                        variant="invisible"
                        size="small"
                        onClick={(e: any) => {
                            e.preventDefault();
                            dispatch(
                                notebookActions.changeCellType.started({
                                    uid: notebookId,
                                    cellType: 'code',
                                })
                            );
                        }}
                    >
                        <Stack
                            spacing={1}
                            direction="row"
                            sx={{ alignItems: 'center', paddingLeft: 0.3 }}
                        >
                            <FaSyncAlt
                                size={12}
                                color="rgba(255,255,255,0.3)"
                            />
                            <Typography
                                sx={{ color: 'rgba(255, 255, 255, 0.3)' }}
                                fontSize={13}
                            >
                                To Code
                            </Typography>
                        </Stack>
                    </Button>
                )}
            </span>
            <span style={{ display: 'flex' }}>
                <Button
                    title="Insert code cell below"
                    variant="invisible"
                    size="small"
                    onClick={(e: any) => {
                        e.preventDefault();
                        dispatch(
                            notebookActions.insertBelow.started({
                                uid: notebookId,
                                cellType: 'code',
                            })
                        );
                    }}
                >
                    <Stack
                        spacing={1}
                        direction="row"
                        sx={{ alignItems: 'center' }}
                    >
                        <GoTriangleDown
                            size={16}
                            color="rgba(255,255,255,0.3)"
                        />
                        <Typography
                            sx={{ color: 'rgba(255, 255, 255, 0.3)' }}
                            fontSize={13}
                        >
                            Code
                        </Typography>
                    </Stack>
                </Button>
            </span>
            <span style={{ display: 'flex' }}>
                <Button
                    title="Insert markdown cell below"
                    variant="invisible"
                    size="small"
                    onClick={(e: any) => {
                        e.preventDefault();
                        dispatch(
                            notebookActions.insertBelow.started({
                                uid: notebookId,
                                cellType: 'markdown',
                            })
                        );
                    }}
                >
                    <Stack
                        spacing={1}
                        direction="row"
                        sx={{ alignItems: 'center' }}
                    >
                        <GoTriangleDown
                            size={16}
                            color="rgba(255,255,255,0.3)"
                        />
                        <Typography
                            sx={{ color: 'rgba(255, 255, 255, 0.3)' }}
                            fontSize={13}
                        >
                            Markdown
                        </Typography>
                    </Stack>
                </Button>
            </span>
            <span style={{ display: 'flex' }}>
                <Button
                    title="Insert prompt cell below"
                    variant="invisible"
                    size="small"
                    onClick={(e: any) => {
                        e.preventDefault();
                        dispatch(
                            notebookActions.insertBelow.started({
                                uid: notebookId,
                                cellType: 'raw',
                            })
                        );
                    }}
                >
                    <Stack
                        spacing={1}
                        direction="row"
                        sx={{ alignItems: 'center' }}
                    >
                        <GoTriangleDown
                            size={16}
                            color="rgba(255,255,255,0.3)"
                        />
                        <Typography
                            sx={{ color: 'rgba(255, 255, 255, 0.3)' }}
                            fontSize={13}
                        >
                            Prompt
                        </Typography>
                    </Stack>
                </Button>
            </span>
            <span style={{ display: 'flex' }}>
                <Button
                    title="Delete cell"
                    variant="invisible"
                    size="small"
                    onClick={(e: any) => {
                        e.preventDefault();
                        dispatch(notebookActions.delete.started(notebookId));
                    }}
                >
                    <Stack
                        spacing={1}
                        direction="row"
                        sx={{ alignItems: 'center', paddingLeft: 0.3 }}
                    >
                        <FaTrash size={12} color="rgba(255,255,255,0.3)" />
                        <Typography
                            sx={{ color: 'rgba(255, 255, 255, 0.3)' }}
                            fontSize={13}
                        >
                            Delete
                        </Typography>
                    </Stack>
                </Button>
            </span>
            {nbgrader && (
                <ActionMenu>
                    {/*
            <ActionMenu.Anchor>
              <IconButton icon={KebabHorizontalIcon} variant="invisible" aria-label="Open column options" />
            </ActionMenu.Anchor>
            <ActionMenu.Overlay>
            */}
                    <CellMetadataEditor
                        notebookId={notebookId}
                        cell={activeCell}
                        nbgrader={nbgrader}
                    />
                    {/*
            </ActionMenu.Overlay>
            */}
                </ActionMenu>
            )}
        </Box>
    ) : (
        <></>
    );
};

export default CellSidebar;

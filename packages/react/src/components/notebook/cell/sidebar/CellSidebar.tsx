import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { PanelLayout } from '@lumino/widgets';
import { ActionMenu, Button, Box } from '@primer/react';
import { FaSyncAlt } from "react-icons/fa";
import { FaTrash } from "react-icons/fa";
import { GoTriangleDown } from "react-icons/go";
import { GoTriangleUp } from "react-icons/go";
import { FaPlay } from "react-icons/fa";
import { FaWandMagicSparkles } from "react-icons/fa6";
import { notebookActions, selectActiveCell } from '../../NotebookRedux';
import { CellSidebarProps } from './CellSidebarWidget';
import CellMetadataEditor from '../metadata/CellMetadataEditor';
import { DATALAYER_CELL_HEADER_CLASS } from './CellSidebarWidget';
import {Stack, Typography} from '@mui/material'

import { Popover, PopoverContent, PopoverTrigger } from '../../../popover/popover';
import ModifyCode from '../../../popover/modify-code'; 

export const CellSidebar = (props: CellSidebarProps) => {
  const { notebookId, cellId, nbgrader } = props;
  const [visible, setVisible] = useState(false);
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
  return activeCell ? (
    <Box
      className={DATALAYER_CELL_HEADER_CLASS}
      sx={{
        '& p': {
          marginBottom: '0 !important',
        },

      }}
    >

      {activeCell.model.type === 'raw' ?  <span style={{ display: 'flex' }}>
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
          onClick={e => {
            e.preventDefault();
            dispatch(notebookActions.codeGenerate.started({
              uid: notebookId,
              cellType: 'code',
            }));
          }}
        >
          <Stack spacing={1} direction="row" sx={{ alignItems: 'center' }}>
            <FaWandMagicSparkles color="rgba(255, 255, 255, 0.5)" size={15} style={{ marginBottom: -2 }} />
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)' }} fontSize={13}>Generate</Typography>
          </Stack>
        </Button>
      </span> : null}

      {activeCell.model.type === 'code' ?  <span style={{ display: 'flex' }}>
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
          onClick={e => {
            e.preventDefault();
            dispatch(notebookActions.fixCode.started({
              uid: notebookId,
              cellType: 'code',
            }));
          }}
        >
          <Stack spacing={1} direction="row" sx={{ alignItems: 'center' }}>
            <FaWandMagicSparkles color="rgba(255, 255, 255, 0.5)" size={15} style={{ marginBottom: -2 }} />
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)' }} fontSize={13}>Fix</Typography>
          </Stack>
        </Button>
      </span> : null}

      {activeCell.model.type === 'code' ?  <span style={{ display: 'flex' }}>
      <Popover>
        <PopoverTrigger>
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
              onClick={() => {}}
            >
              <Stack spacing={1} direction="row" sx={{ alignItems: 'center' }}>
                <FaWandMagicSparkles color="rgba(255, 255, 255, 0.5)" size={15} style={{ marginBottom: -2 }} />
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)' }} fontSize={13}>Modify</Typography>
              </Stack>
            </Button>
        </PopoverTrigger>

        <PopoverContent
          className="bg-background border-input relative flex max-h-[calc(100vh-60px)] w-[300px] flex-col space-y-4 overflow-auto rounded-lg border-2 p-6 sm:w-[350px] md:w-[400px] lg:w-[500px] dark:border-none"
          align="end"
        >
          <ModifyCode />
        </PopoverContent>
      </Popover>
       
      </span> : null}


      {activeCell.model.type !== 'raw' ? <span style={{ display: 'flex' }}>
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
          <Stack spacing={1} direction="row" sx={{ alignItems: 'center', paddingLeft: 0.5}}>
            <FaPlay size={8} color='rgba(255,255,255,0.3)' />
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.3)' }} fontSize={13}>Run</Typography>
          </Stack>
        </Button>
      </span> : null}
      
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
          <Stack spacing={1} direction="row" sx={{ alignItems: 'center' }}>
            <GoTriangleUp size={16} color='rgba(255,255,255,0.3)' />
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.3)' }} fontSize={13}>Code</Typography>
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
          <Stack spacing={1} direction="row" sx={{ alignItems: 'center' }}>
            <GoTriangleUp size={16} color='rgba(255,255,255,0.3)' />
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.3)' }} fontSize={13}>Markdown</Typography>
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
          <Stack spacing={1} direction="row" sx={{ alignItems: 'center' }}>
            <GoTriangleUp size={16} color='rgba(255,255,255,0.3)' />
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.3)' }} fontSize={13}>Prompt</Typography>
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
            <Stack spacing={1} direction="row" sx={{ alignItems: 'center', paddingLeft: 0.3 }}>
              <FaSyncAlt size={12} color='rgba(255,255,255,0.3)' />
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.3)' }} fontSize={13}>To Markdown</Typography>
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
            <Stack spacing={1} direction="row" sx={{ alignItems: 'center', paddingLeft: 0.3 }}>
              <FaSyncAlt size={12} color='rgba(255,255,255,0.3)' />
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.3)' }} fontSize={13}>To Code</Typography>
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
          <Stack spacing={1} direction="row" sx={{ alignItems: 'center' }}>
            <GoTriangleDown size={16} color='rgba(255,255,255,0.3)' />
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.3)' }} fontSize={13}>Code</Typography>
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
          <Stack spacing={1} direction="row" sx={{ alignItems: 'center' }}>
            <GoTriangleDown size={16} color='rgba(255,255,255,0.3)' />
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.3)' }} fontSize={13}>Markdown</Typography>
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
          <Stack spacing={1} direction="row" sx={{ alignItems: 'center' }}>
            <GoTriangleDown size={16} color='rgba(255,255,255,0.3)' />
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.3)' }} fontSize={13}>Prompt</Typography>
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
          <Stack spacing={1} direction="row" sx={{ alignItems: 'center', paddingLeft: 0.3 }}>
            <FaTrash size={12} color='rgba(255,255,255,0.3)' />
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.3)' }} fontSize={13}>Delete</Typography>
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

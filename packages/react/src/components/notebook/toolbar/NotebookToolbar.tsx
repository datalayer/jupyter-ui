/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState } from 'react';
import { IconButton, Button, ButtonGroup } from '@primer/react';
import { Box } from '@datalayer/primer-addons';
import {
  PlusIcon,
  PlayIcon,
  SquareFillIcon,
  TrashIcon,
  DownloadIcon,
  IterationsIcon,
  CodeIcon,
  MarkdownIcon,
} from '@primer/octicons-react';
import { useNotebookStore } from '../NotebookState';

export type INotebookToolbarProps = {
  notebookId: string;
};

export const NotebookToolbar = (props: INotebookToolbarProps) => {
  const { notebookId } = props;
  const notebookStore = useNotebookStore();
  const [insertType, setInsertType] = useState<'code' | 'markdown'>('code');

  const kernelStatus = notebookStore.selectKernelStatus(notebookId);
  const isBusy = kernelStatus === 'busy';
  const isIdle = kernelStatus === 'idle';

  // ---- Handlers ----
  const handleSave = () =>
    notebookStore.save({ id: notebookId, date: new Date() });
  const handleRun = () => notebookStore.run(notebookId);
  const handleRunAll = () => notebookStore.runAll(notebookId);
  const handleInterrupt = () => notebookStore.interrupt(notebookId);
  const handleDelete = () => notebookStore.delete(notebookId);
  const handleInsert = () => notebookStore.insertBelow(notebookId, insertType);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        px: 3,
        py: '6px',
        borderBottomWidth: 1,
        borderBottomStyle: 'solid',
        borderColor: 'border.default',
        bg: 'canvas.subtle',
        gap: 2,
        minHeight: '36px',
      }}
    >
      {/* ── Left section: primary actions ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Save */}
        <IconButton
          variant="invisible"
          size="small"
          aria-label="Save notebook"
          description="Save notebook (⌘S)"
          onClick={handleSave}
          icon={DownloadIcon}
        />

        {/* Separator */}
        <Box sx={{ width: '1px', height: 16, bg: 'border.default', mx: 1 }} />

        {/* Run cell */}
        <IconButton
          variant="invisible"
          size="small"
          aria-label="Run cell"
          description="Run cell (⇧↵)"
          onClick={handleRun}
          icon={PlayIcon}
          disabled={!isIdle}
          sx={{ color: 'success.fg' }}
        />

        {/* Run all cells */}
        <IconButton
          variant="invisible"
          size="small"
          aria-label="Run all cells"
          description="Run all cells"
          onClick={handleRunAll}
          icon={IterationsIcon}
          disabled={!isIdle}
        />

        {/* Interrupt kernel */}
        <IconButton
          variant="invisible"
          size="small"
          aria-label="Interrupt kernel"
          description="Interrupt kernel (⌘I)"
          onClick={handleInterrupt}
          icon={SquareFillIcon}
          disabled={!isBusy}
          sx={{ color: isBusy ? 'danger.fg' : undefined }}
        />

        {/* Separator */}
        <Box sx={{ width: '1px', height: 16, bg: 'border.default', mx: 1 }} />

        {/* Delete cell */}
        <IconButton
          variant="invisible"
          size="small"
          aria-label="Delete cell"
          description="Delete cell"
          onClick={handleDelete}
          icon={TrashIcon}
        />
      </Box>

      {/* ── Right section: insert cell + type picker ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Insert cell below */}
        <IconButton
          variant="invisible"
          size="small"
          aria-label={`Insert ${insertType} cell below`}
          description={`Insert ${insertType} cell below`}
          onClick={handleInsert}
          icon={PlusIcon}
        />

        {/* Cell type selector */}
        <ButtonGroup>
          <Button
            variant={insertType === 'code' ? 'primary' : 'invisible'}
            size="small"
            onClick={() => setInsertType('code')}
            leadingVisual={CodeIcon}
          >
            Code
          </Button>
          <Button
            variant={insertType === 'markdown' ? 'primary' : 'invisible'}
            size="small"
            onClick={() => setInsertType('markdown')}
            leadingVisual={MarkdownIcon}
          >
            Markdown
          </Button>
        </ButtonGroup>
      </Box>
    </Box>
  );
};

export default NotebookToolbar;

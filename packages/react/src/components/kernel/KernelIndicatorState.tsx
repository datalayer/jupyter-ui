/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { ReactElement } from 'react';
import { Box } from '@primer/react';
import { XCircleFillIcon } from '@primer/octicons-react';
import { PlusCircleIcon } from '@datalayer/icons-react';
import { KernelMessage } from '@jupyterlab/services';
import { ConnectionStatus } from '@jupyterlab/services/lib/kernel/kernel';

export type ExecutionState =
  | 'connecting'
  | 'connected-unknown'
  | 'connected-starting'
  | 'connected-idle'
  | 'connected-busy'
  | 'connected-terminating'
  | 'connected-restarting'
  | 'connected-autorestarting'
  | 'connected-dead'
  | 'disconnected'
  | 'disconnecting'
  | 'undefined';

type KernelStateVisual = {
  color: string;
  kind?: 'dot' | 'ring' | 'plus' | 'x';
  pulse?: boolean;
};

export const KERNEL_STATE_LABELS: Record<ExecutionState, string> = {
  connecting: 'Connecting',
  'connected-unknown': 'Unknown',
  'connected-starting': 'Starting',
  'connected-idle': 'Idle',
  'connected-busy': 'Busy',
  'connected-terminating': 'Terminating',
  'connected-restarting': 'Restarting',
  'connected-autorestarting': 'Auto-restarting',
  'connected-dead': 'Dead',
  disconnected: 'Disconnected',
  disconnecting: 'Disconnecting',
  undefined: 'Undefined',
};

export const KERNEL_STATE_VISUALS: Record<ExecutionState, KernelStateVisual> = {
  connecting: { color: 'accent.fg', kind: 'plus' },
  'connected-unknown': { color: 'fg.muted' },
  'connected-starting': { color: 'attention.fg' },
  'connected-idle': { color: 'success.fg' },
  'connected-busy': { color: 'attention.fg', pulse: true },
  'connected-terminating': { color: 'fg.muted' },
  'connected-restarting': { color: 'accent.fg' },
  'connected-autorestarting': {
    color: 'danger.fg',
    kind: 'ring',
    pulse: true,
  },
  'connected-dead': { color: 'danger.fg' },
  disconnected: { color: 'fg.muted', kind: 'x' },
  disconnecting: { color: 'neutral.emphasis' },
  undefined: { color: 'fg.muted' },
};

const KERNEL_BUSY_PULSE_KEYFRAMES = {
  '0%': {
    opacity: 1,
    transform: 'scale(1)',
    filter: 'saturate(1)',
  },
  '50%': {
    opacity: 0.45,
    transform: 'scale(0.92)',
    filter: 'saturate(0.75)',
  },
  '100%': {
    opacity: 1,
    transform: 'scale(1)',
    filter: 'saturate(1)',
  },
} as const;

export const renderKernelStateGlyph = (state: ExecutionState): ReactElement => {
  const visual = KERNEL_STATE_VISUALS[state];
  const kind = visual.kind ?? 'dot';

  if (kind === 'plus') {
    return (
      <Box as="span" sx={{ display: 'inline-flex', color: visual.color }}>
        <PlusCircleIcon />
      </Box>
    );
  }

  if (kind === 'x') {
    return (
      <Box as="span" sx={{ display: 'inline-flex', color: visual.color }}>
        <XCircleFillIcon size={16} />
      </Box>
    );
  }

  return (
    <Box
      as="span"
      sx={{
        display: 'inline-block',
        width: 10,
        height: 10,
        borderRadius: '50%',
        bg: kind === 'ring' ? 'transparent' : visual.color,
        borderStyle: 'solid',
        borderWidth: kind === 'ring' ? 2 : 1,
        borderColor: visual.color,
        ...(visual.pulse && {
          animation: 'kernel-busy-fade 1.2s ease-in-out infinite',
          '@keyframes kernel-busy-fade': KERNEL_BUSY_PULSE_KEYFRAMES,
        }),
      }}
    />
  );
};

export const KERNEL_STATES: Map<ExecutionState, ReactElement> = new Map(
  (Object.keys(KERNEL_STATE_VISUALS) as ExecutionState[]).map(state => [
    state,
    renderKernelStateGlyph(state),
  ])
);

export const toKernelState = (
  connectionStatus: ConnectionStatus,
  status: KernelMessage.Status
): ExecutionState => {
  if (
    connectionStatus === 'connecting' ||
    connectionStatus === 'disconnected'
  ) {
    return connectionStatus as ExecutionState;
  }
  return (connectionStatus + '-' + status) as ExecutionState;
};

export type KernelIndicatorMetaInput = {
  state?: ExecutionState;
  connectionStatus?: ConnectionStatus;
  status?: KernelMessage.Status;
  envDisplayName?: string;
  kernelId?: string;
  kernelName?: string;
  clientId?: string;
  username?: string;
};

export type KernelIndicatorMeta = {
  state: ExecutionState;
  label: string;
  tooltip: string;
};

export const getKernelIndicatorMeta = (
  input: KernelIndicatorMetaInput
): KernelIndicatorMeta => {
  const resolvedState: ExecutionState =
    input.state ??
    (input.connectionStatus && input.status
      ? toKernelState(input.connectionStatus, input.status)
      : 'undefined');

  const stateLabel = KERNEL_STATE_LABELS[resolvedState] ?? resolvedState;
  const kernelIdLabel = input.kernelId ?? 'no-kernel';

  const label =
    input.connectionStatus && input.status
      ? `${input.connectionStatus} - ${input.status} - ${kernelIdLabel}`
      : `${stateLabel} - ${kernelIdLabel}`;

  const tooltip =
    input.connectionStatus && input.status
      ? [
          `State: ${stateLabel}`,
          `Connection: ${input.connectionStatus}`,
          `Status: ${input.status}`,
          `Environment: ${input.envDisplayName ?? 'unknown-env'}`,
          `Kernel: ${input.kernelName ?? 'unknown-kernel'}`,
          `Kernel ID: ${kernelIdLabel}`,
          `Client ID: ${input.clientId ?? 'unknown-client'}`,
          `User: ${input.username ?? 'unknown-user'}`,
        ].join('\n')
      : [
          `State: ${stateLabel}`,
          `Kernel: ${input.kernelName ?? 'unknown-kernel'}`,
          `Kernel ID: ${kernelIdLabel}`,
          `Client ID: ${input.clientId ?? 'unknown-client'}`,
          `User: ${input.username ?? 'unknown-user'}`,
        ].join('\n');

  return {
    state: resolvedState,
    label,
    tooltip,
  };
};

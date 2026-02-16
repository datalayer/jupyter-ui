/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useEffect, ReactElement } from 'react';
import { Button, Tooltip, Text } from '@primer/react';
import { XCircleFillIcon } from '@primer/octicons-react';
import {
  CircleBlackIcon,
  CircleBrownIcon,
  CircleGreenIcon,
  CircleHollowRedIcon,
  CircleOrangeIcon,
  CirclePurpleIcon,
  CircleRedIcon,
  CircleWhiteIcon,
  CircleYellowIcon,
  CircleCurrentColorIcon,
  PlusCircleIcon,
} from '@datalayer/icons-react';
import { KernelMessage } from '@jupyterlab/services';
import {
  ConnectionStatus,
  IKernelConnection,
} from '@jupyterlab/services/lib/kernel/kernel';
import { Environment } from '../environment/Environment';

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

/**
 * The valid kernel connection states.
 *
 * #### Notes
 * The status states are:
 * * `connected`: The kernel connection is live.
 * * `connecting`: The kernel connection is not live, but we are attempting
 *   to reconnect to the kernel.
 * * `disconnected`: The kernel connection is permanently down, we will not
 *   try to reconnect.
 *
 * When a kernel connection is `connected`, the kernel status should be
 * valid. When a kernel connection is either `connecting` or `disconnected`,
 * the kernel status will be `unknown` unless the kernel status was `dead`,
 * in which case it stays `dead`.
 *
 * Status = 'unknown' | 'starting' | 'idle' | 'busy' | 'terminating' | 'restarting' | 'autorestarting' | 'dead';
 */

export const KERNEL_STATES: Map<ExecutionState, ReactElement> = new Map([
  ['connecting', <PlusCircleIcon key="connecting" />],
  [
    'connected-unknown',
    <CircleCurrentColorIcon key="connected-unknown" color="lightgray" />,
  ],
  ['connected-starting', <CircleYellowIcon key="connected-starting" />],
  ['connected-idle', <CircleGreenIcon key="connected-idle" />],
  ['connected-busy', <CircleOrangeIcon key="connected-busy" />],
  ['connected-terminating', <CircleWhiteIcon key="connected-terminating" />],
  ['connected-restarting', <CirclePurpleIcon key="connected-restarting" />],
  [
    'connected-autorestarting',
    <CircleHollowRedIcon key="connected-autorestarting" />,
  ],
  ['connected-dead', <CircleRedIcon key="connected-dead" />],
  ['disconnected', <XCircleFillIcon key="disconnected" size={16} />],
  ['disconnecting', <CircleBrownIcon key="disconnecting" />],
  ['undefined', <CircleBlackIcon key="undefined" />],
]);

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

export type KernelIndicatorProps = {
  label?: string;
  kernel?: IKernelConnection | null;
  env?: Environment;
};

export const KernelIndicator = (props: KernelIndicatorProps) => {
  const { label = '', kernel, env } = props;
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>();
  const [status, setStatus] = useState<KernelMessage.Status>();
  useEffect(() => {
    if (kernel) {
      setConnectionStatus(kernel?.connectionStatus);
      setStatus(kernel?.status);
      kernel.connectionStatusChanged.connect((_, connectionStatus) => {
        setConnectionStatus(connectionStatus);
      });
      kernel.statusChanged.connect((_, status) => {
        setStatus(status);
      });
    }
  }, [kernel]);
  return connectionStatus && status ? (
    <Tooltip
      text={`${connectionStatus} - ${status} - ${env?.display_name} - ${kernel?.id}`}
    >
      <Button
        variant="invisible"
        sx={{
          p: 1,
          minWidth: 'auto',
          aspectRatio: '1 / 1',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '16px',
            lineHeight: 1,
            verticalAlign: 'middle',
          }}
        >
          {label ? <Text>{label}</Text> : null}
          {KERNEL_STATES.get(toKernelState(connectionStatus, status)) ?? <></>}
        </span>
      </Button>
    </Tooltip>
  ) : (
    <Tooltip text="Undefined state">
      <Button
        variant="invisible"
        sx={{
          p: 1,
          minWidth: 'auto',
          aspectRatio: '1 / 1',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '16px',
            lineHeight: 1,
            verticalAlign: 'middle',
          }}
        >
          {label ? <Text>{label}</Text> : null}
          {KERNEL_STATES.get('undefined') ?? <></>}
        </span>
      </Button>
    </Tooltip>
  );
};

export default KernelIndicator;

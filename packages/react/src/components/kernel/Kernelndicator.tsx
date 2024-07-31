/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useEffect, ReactElement } from 'react';
import { Tooltip } from '@primer/react';
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
  CircledMIcon,
  SquareWhiteLargeIcon
} from '@datalayer/icons-react';
import { KernelMessage } from '@jupyterlab/services';
import { ConnectionStatus, IKernelConnection } from '@jupyterlab/services/lib/kernel/kernel';
import { Environment } from '../environment/Environment';

export type ExecutionState = 
  'connecting' |
  'connected-unknown' |
  'connected-starting' |
  'connected-idle' |
  'connected-busy' |
  'connected-terminating' |
  'connected-restarting' |
  'connected-autorestarting' |
  'connected-dead' |
  'disconnecting' | 
  'undefined'
  ;

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
  ['connecting', <CircleBlackIcon />],
  ['connected-unknown', <CircledMIcon />],
  ['connected-starting', <CircleYellowIcon />],
  ['connected-idle', <CircleGreenIcon />],
  ['connected-busy', <CircleOrangeIcon />],
  ['connected-terminating', <CircleWhiteIcon />],
  ['connected-restarting', <CirclePurpleIcon />],
  ['connected-autorestarting', <CircleHollowRedIcon />],
  ['connected-dead', <CircleRedIcon />],
  ['disconnecting', <CircleBrownIcon />],
  ['undefined', <SquareWhiteLargeIcon />],
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
  return connectionStatus + '-' + status as ExecutionState;
};

type KernelIndicatorProps = {
  kernel?: IKernelConnection | null;
  env?: Environment;
};

export const KernelIndicator = (props: KernelIndicatorProps) => {
  const { kernel, env } = props;
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>();
  const [status, setStatus] = useState<KernelMessage.Status>();
  useEffect(() => {
    if (kernel) {
      setConnectionStatus(kernel?.connectionStatus);
      setStatus(kernel?.status);
      kernel.connectionStatusChanged.connect(
        (_, connectionStatus) => {
          setConnectionStatus(connectionStatus);
        }
      );
      kernel.statusChanged.connect((_, status) => {
        setStatus(status);
      });
    }
  }, [kernel]);
  return connectionStatus && status ? (
    <Tooltip aria-label={`${connectionStatus} - ${status} - ${env?.display_name}`}>
      {KERNEL_STATES.get(toKernelState(connectionStatus, status))}
    </Tooltip>
  ) : (
    <Tooltip aria-label="Undefined state">
      {KERNEL_STATES.get('undefined')}
    </Tooltip>
  );
};

export default KernelIndicator;

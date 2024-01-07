/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useEffect, ReactElement } from 'react';
import { Tooltip } from '@primer/react';
import {
  CircleYellowIcon, CircleGreenIcon, CircleBlackIcon,
  CircleBrownIcon, CircleHollowRedIcon, CircleOrangeIcon,
  CirclePurpleIcon, CircleRedIcon, CircleWhiteIcon, CircledMIcon,
  SquareWhiteLargeIcon
} from '@datalayer/icons-react';
import Kernel from '../../jupyter/kernel/Kernel';
import { KernelMessage } from '@jupyterlab/services';
import { ConnectionStatus } from '@jupyterlab/services/lib/kernel/kernel';

type KernelState = string;

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
export const KERNEL_STATES: Map<KernelState, ReactElement> = new Map([ 
  [ 'connecting', <CircleBlackIcon/> ],
  [ 'connected-unknown', <CircledMIcon/> ],
  [ 'connected-starting', <CircleYellowIcon/> ],
  [ 'connected-idle', <CircleGreenIcon/> ],
  [ 'connected-busy', <CircleOrangeIcon/> ],
  [ 'connected-terminating', <CircleWhiteIcon/> ],
  [ 'connected-restarting', <CirclePurpleIcon/> ],
  [ 'connected-autorestarting', <CircleHollowRedIcon/> ],
  [ 'connected-dead', <CircleRedIcon/> ],
  [ 'disconnecting', <CircleBrownIcon/> ],
  [ 'undefined', <SquareWhiteLargeIcon/> ],
]);

type Props = {
  kernel?: Kernel;
}

export const KernelStatus = (props: Props) => {
  const { kernel } = props;
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>();
  const [status, setStatus] = useState<KernelMessage.Status>();
  const toState = (connectionStatus: ConnectionStatus, status: KernelMessage.Status) => {
    if (connectionStatus === 'connecting' || connectionStatus === 'disconnected') {
      return connectionStatus;
    }
    return connectionStatus + '-' + status;
  }
  useEffect(() => {
    if (kernel && kernel.connection) {
      setConnectionStatus(kernel.connection?.connectionStatus);
      setStatus(kernel.connection?.status);
      kernel.connection.connectionStatusChanged.connect((_, connectionStatus) => {
        setConnectionStatus(connectionStatus);
      });
      kernel.connection.statusChanged.connect((_, status) => {
        setStatus(status);
      });
    }
  }, [kernel, kernel?.connection]);
  return (
    connectionStatus && status ?
    (
      <Tooltip aria-label={`${connectionStatus} - ${status}`}>
        { KERNEL_STATES.get(toState(connectionStatus, status)) }
      </Tooltip>
    )
    :
    (
      <Tooltip aria-label="Undefined state">
        { KERNEL_STATES.get('undefined') }
      </Tooltip>
    )
  )
};

export default KernelStatus;

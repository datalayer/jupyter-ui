/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect, useState } from 'react';
import { Button, Text, Tooltip } from '@primer/react';
import { KernelMessage } from '@jupyterlab/services';
import {
  ConnectionStatus,
  IKernelConnection,
} from '@jupyterlab/services/lib/kernel/kernel';
import { Environment } from '../environment/Environment';
import {
  getKernelIndicatorMeta,
  renderKernelStateGlyph,
  type ExecutionState,
} from './KernelIndicatorState';

export type KernelIndicatorProps = {
  label?: string;
  kernel?: IKernelConnection | null;
  env?: Environment;
  state?: ExecutionState;
  tooltip?: string;
};

export const KernelIndicator = ({
  label = '',
  kernel,
  env,
  state,
  tooltip,
}: KernelIndicatorProps) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>();
  const [status, setStatus] = useState<KernelMessage.Status>();

  useEffect(() => {
    if (!kernel) {
      return;
    }

    setConnectionStatus(kernel.connectionStatus);
    setStatus(kernel.status);

    const handleConnectionChange = (
      _: unknown,
      nextStatus: ConnectionStatus
    ) => {
      setConnectionStatus(nextStatus);
    };

    const handleStatusChange = (
      _: unknown,
      nextStatus: KernelMessage.Status
    ) => {
      setStatus(nextStatus);
    };

    kernel.connectionStatusChanged.connect(handleConnectionChange);
    kernel.statusChanged.connect(handleStatusChange);

    return () => {
      kernel.connectionStatusChanged.disconnect(handleConnectionChange);
      kernel.statusChanged.disconnect(handleStatusChange);
    };
  }, [kernel]);

  const meta = getKernelIndicatorMeta({
    state,
    connectionStatus,
    status,
    envDisplayName: env?.display_name,
    kernelId: kernel?.id,
  });

  return (
    <Tooltip text={tooltip ?? meta.tooltip}>
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
          {renderKernelStateGlyph(meta.state)}
        </span>
      </Button>
    </Tooltip>
  );
};

export default KernelIndicator;

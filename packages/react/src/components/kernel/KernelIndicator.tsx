/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect, useRef, useState } from 'react';
import { Box, Button, Text } from '@primer/react';
import { KernelMessage } from '@jupyterlab/services';
import {
  ConnectionStatus,
  IKernelConnection,
} from '@jupyterlab/services/lib/kernel/kernel';
import { Environment } from '../environment/Environment';
import {
  getKernelIndicatorMeta,
  KERNEL_STATE_LABELS,
  renderKernelStateGlyph,
  type ExecutionState,
} from './KernelIndicatorState';

export type KernelIndicatorProps = {
  label?: string;
  overlayTitle?: string;
  kernel?: IKernelConnection | null;
  env?: Environment;
  state?: ExecutionState;
  environmentName?: string;
  memory?: string;
  cpu?: string;
  gpu?: string;
};

export const KernelIndicator = ({
  label = '',
  overlayTitle = 'Sandbox Details',
  kernel,
  env,
  state,
  environmentName,
  memory,
  cpu,
  gpu,
}: KernelIndicatorProps) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>();
  const [status, setStatus] = useState<KernelMessage.Status>();
  const [showDetails, setShowDetails] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (!showDetails) {
      return;
    }

    const handleDocumentPointerDown = (event: MouseEvent) => {
      const targetNode = event.target as Node | null;
      if (!targetNode) {
        return;
      }
      if (containerRef.current?.contains(targetNode)) {
        return;
      }
      setShowDetails(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowDetails(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentPointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleDocumentPointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showDetails]);

  const resolvedEnvironmentName =
    environmentName || env?.display_name || 'browser-runtime';

  const meta = getKernelIndicatorMeta({
    state,
    connectionStatus,
    status,
    envDisplayName: resolvedEnvironmentName,
    kernelId: kernel?.id,
    kernelName: kernel?.name,
    clientId: kernel?.clientId,
    username: kernel?.username,
  });

  const kernelAny = kernel as unknown as {
    serverSettings?: {
      baseUrl?: string;
      wsUrl?: string;
      appUrl?: string;
    };
    model?: {
      name?: string;
      path?: string;
    };
    session?: {
      path?: string;
    };
    path?: string;
  };

  const runtimeDetails: Array<{ label: string; value: string }> = [
    { label: 'State', value: meta.state },
    { label: 'Connection', value: connectionStatus ?? 'unknown' },
    { label: 'Status', value: status ?? 'unknown' },
  ];

  const environmentDetails: Array<{ label: string; value: string }> = [
    { label: 'Name', value: resolvedEnvironmentName },
    { label: 'CPU', value: cpu ?? 'n/a' },
    { label: 'Memory', value: memory ?? 'n/a' },
    { label: 'GPU', value: gpu ?? 'n/a' },
  ];

  const identityDetails: Array<{ label: string; value: string }> = [
    { label: 'Kernel Name', value: kernel?.name ?? 'unknown-kernel' },
    { label: 'Kernel ID', value: kernel?.id ?? 'no-kernel' },
    { label: 'Client ID', value: kernel?.clientId ?? 'unknown-client' },
    { label: 'User', value: kernel?.username ?? 'unknown-user' },
  ];

  const serverDetails: Array<{ label: string; value: string }> = [
    {
      label: 'Server URL',
      value:
        kernelAny?.serverSettings?.baseUrl ??
        kernelAny?.serverSettings?.appUrl ??
        'unknown-url',
    },
    {
      label: 'WebSocket URL',
      value: kernelAny?.serverSettings?.wsUrl ?? 'unknown-ws-url',
    },
    {
      label: 'Path',
      value:
        kernelAny?.session?.path ??
        kernelAny?.model?.path ??
        kernelAny?.path ??
        'unknown-path',
    },
  ];

  const legendStates: ExecutionState[] = [
    'connecting',
    'connected-unknown',
    'connected-starting',
    'connected-idle',
    'connected-busy',
    'connected-terminating',
    'connected-restarting',
    'connected-autorestarting',
    'connected-dead',
    'disconnecting',
    'disconnected',
    'undefined',
  ];

  return (
    <Box
      ref={containerRef}
      sx={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setShowDetails(true)}
      onFocus={() => setShowDetails(true)}
    >
      <Button
        variant="invisible"
        aria-label="Kernel indicator"
        sx={{
          p: 1,
          minWidth: 'auto',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 0,
          border: '1px solid',
          borderColor: 'border.default',
          borderRadius: 2,
          bg: 'canvas.default',
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

      {showDetails && (
        <Box
          sx={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            minWidth: 560,
            maxWidth: 'min(980px, 96vw)',
            maxHeight: '78vh',
            overflow: 'auto',
            border: '1px solid',
            borderColor: 'border.default',
            borderRadius: 2,
            bg: 'canvas.overlay',
            boxShadow: 'shadow.large',
          }}
          role="dialog"
          aria-label={overlayTitle}
        >
          <Box
            sx={{
              px: 3,
              py: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 1,
              borderBottom: '1px solid',
              borderColor: 'border.default',
              bg: 'canvas.subtle',
            }}
          >
            <Text sx={{ fontSize: 2, fontWeight: 600, color: 'fg.default' }}>
              {overlayTitle}
            </Text>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
              {renderKernelStateGlyph(meta.state)}
              <Text
                sx={{
                  fontSize: 0,
                  fontWeight: 400,
                  color: 'fg.muted',
                  textTransform: 'capitalize',
                }}
              >
                {meta.state}
              </Text>
            </Box>
          </Box>

          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'border.muted',
                borderRadius: 2,
                bg: 'canvas.default',
              }}
            >
              <Text
                sx={{
                  fontSize: 1,
                  color: 'fg.default',
                  fontWeight: 600,
                  mb: 2,
                }}
              >
                Runtime
              </Text>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {runtimeDetails.map(detail => (
                  <Text
                    key={detail.label}
                    sx={{ fontSize: 0, wordBreak: 'break-word' }}
                  >
                    {detail.label}: {detail.value}
                  </Text>
                ))}
              </Box>
            </Box>

            <Box
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'border.muted',
                borderRadius: 2,
                bg: 'canvas.default',
              }}
            >
              <Text
                sx={{
                  fontSize: 1,
                  color: 'fg.default',
                  fontWeight: 600,
                  mb: 2,
                }}
              >
                Environment
              </Text>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {environmentDetails.map(detail => (
                  <Text
                    key={detail.label}
                    sx={{ fontSize: 0, wordBreak: 'break-word' }}
                  >
                    {detail.label}: {detail.value}
                  </Text>
                ))}
              </Box>
            </Box>

            <Box
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'border.muted',
                borderRadius: 2,
                bg: 'canvas.default',
              }}
            >
              <Text
                sx={{
                  fontSize: 1,
                  color: 'fg.default',
                  fontWeight: 600,
                  mb: 2,
                }}
              >
                Identity
              </Text>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {identityDetails.map(detail => (
                  <Text
                    key={detail.label}
                    sx={{ fontSize: 0, wordBreak: 'break-word' }}
                  >
                    {detail.label}: {detail.value}
                  </Text>
                ))}
              </Box>
            </Box>

            <Box
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'border.muted',
                borderRadius: 2,
                bg: 'canvas.default',
              }}
            >
              <Text
                sx={{
                  fontSize: 1,
                  color: 'fg.default',
                  fontWeight: 600,
                  mb: 2,
                }}
              >
                Server
              </Text>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {serverDetails.map(detail => (
                  <Text
                    key={detail.label}
                    sx={{ fontSize: 0, wordBreak: 'break-word' }}
                  >
                    {detail.label}: {detail.value}
                  </Text>
                ))}
              </Box>
            </Box>

            <Box
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'border.muted',
                borderRadius: 2,
                bg: 'canvas.default',
              }}
            >
              <Text
                sx={{
                  fontSize: 1,
                  color: 'fg.default',
                  fontWeight: 600,
                  mb: 2,
                }}
              >
                State Legend
              </Text>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: 2,
                }}
              >
                {legendStates.map(legendState => (
                  <Box
                    key={legendState}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    {renderKernelStateGlyph(legendState)}
                    <Text sx={{ fontSize: 0, color: 'fg.default' }}>
                      {KERNEL_STATE_LABELS[legendState]}
                    </Text>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default KernelIndicator;

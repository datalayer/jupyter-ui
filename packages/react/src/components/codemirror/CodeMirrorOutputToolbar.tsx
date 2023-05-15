import { useEffect, useState, useMemo } from 'react';
import { useTheme, ActionMenu, ActionList, IconButton, Box } from '@primer/react'
import { KebabHorizontalIcon, ArrowRightIcon, StopIcon, PaintbrushIcon } from '@primer/octicons-react';
import { Kernel as JupyterKernel, KernelMessage } from '@jupyterlab/services';
import { EditorView } from 'codemirror';
import OutputAdapter from '../output/OutputAdapter';
import Kernel from '../../jupyter/services/kernel/Kernel';

type Props = {
  editorView?: EditorView;
  codePre?: string;
  kernel: Kernel;
  outputAdapter: OutputAdapter;
  executeCode: (editorView?: EditorView, code?: string) => void;
}

const CodeMirrorOutputToolbarMenu = (props: Props) => {
  const {executeCode, outputAdapter, editorView} = props;
  return (
    <ActionMenu>
      <ActionMenu.Anchor>
        <IconButton aria-labelledby="" icon={KebabHorizontalIcon} variant="invisible"/>
      </ActionMenu.Anchor>
      <ActionMenu.Overlay>
        <ActionList>
          <ActionList.Item onSelect={ e => { e.preventDefault(); executeCode(editorView) }}>
            <ActionList.LeadingVisual>
              <ArrowRightIcon />
            </ActionList.LeadingVisual>
            <ActionList.TrailingVisual>⇧ ↵</ActionList.TrailingVisual>
            Run code
          </ActionList.Item>
          <ActionList.Item onSelect={ e => { e.preventDefault(); outputAdapter.interrupt() }}>
            <ActionList.LeadingVisual>
              <StopIcon />
            </ActionList.LeadingVisual>
            Interrupt kernel
          </ActionList.Item>
          <ActionList.Item variant="danger" onClick={ e => { e.preventDefault(); outputAdapter.clearOutput() }}>
            <ActionList.LeadingVisual>
              <PaintbrushIcon />
            </ActionList.LeadingVisual>
            Clear outputs
          </ActionList.Item>
        </ActionList>
      </ActionMenu.Overlay>
    </ActionMenu>
  )
}

const KernelStatus: React.FC<{color: string}> = ({color}) => (
  <Box sx={{backgroundColor: color, width: '14px', height: '14px', borderRadius: 3}} />
)

export const CodeMirrorOutputToolbar = (props: Props) => {
  const { executeCode, editorView, kernel, codePre } = props;
  const { theme } = useTheme();
  const okColor = useMemo(() => theme?.colorSchemes.light.colors.success.muted, []);
  const nokColor = useMemo(() => theme?.colorSchemes.light.colors.severe.muted, []);
  const [kernelStatus, setKernelStatus] = useState<KernelMessage.Status>('unknown');
  useEffect(() => {
    if (kernel) {
      kernel.connection.then((kernelConnection: JupyterKernel.IKernelConnection) => {
        if (codePre) {
          executeCode(editorView, codePre);
        }
        setKernelStatus(kernelConnection.status);
        kernelConnection.statusChanged.connect((kernelConnection, status) => {
          setKernelStatus(status);
        });
      });
    }
  }, [kernel]);
  const getKernelStatusColor = (status: KernelMessage.Status) => {
    if (status === "idle") {
      return okColor;
    }
    return nokColor;
  }
  return (
    <Box display="flex">
      <Box flexGrow={1} />
      <Box sx={{paddingTop: '6px'}}>
        <KernelStatus color={getKernelStatusColor(kernelStatus)} />
      </Box>
      <Box>
        <CodeMirrorOutputToolbarMenu {...props} />
      </Box>
    </Box>
  )
}

export default CodeMirrorOutputToolbar;

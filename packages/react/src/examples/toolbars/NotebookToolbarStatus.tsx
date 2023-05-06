import { selectKernelStatus } from '../../components/notebook/NotebookState';

const NotebookToolbarStatus = (props: { notebookId: string }) => {
  const { notebookId } = props;
  const kernelStatus = selectKernelStatus(notebookId);
  return (
    <>
      Kernel Status: {kernelStatus}
    </>
  )
}

export default NotebookToolbarStatus;

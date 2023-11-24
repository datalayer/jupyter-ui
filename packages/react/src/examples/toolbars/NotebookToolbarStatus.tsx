import { selectKernelStatus } from '../../components/notebook/NotebookRedux';

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

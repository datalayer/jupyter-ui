/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import useNotebookStore from '../../components/notebook/NotebookState';

const NotebookToolbarStatus = (props: { notebookId: string }) => {
  const { notebookId } = props;
  const notebookStore = useNotebookStore();
  const kernelStatus = notebookStore.selectKernelStatus(notebookId);
  return <>Kernel Status: {kernelStatus}</>;
};

export default NotebookToolbarStatus;

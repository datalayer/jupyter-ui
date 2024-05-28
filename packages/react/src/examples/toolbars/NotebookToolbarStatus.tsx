/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { selectKernelStatus } from '../../components/notebook/NotebookState';

const NotebookToolbarStatus = (props: { notebookId: string }) => {
  const { notebookId } = props;
  const kernelStatus = selectKernelStatus(notebookId);
  return <>Kernel Status: {kernelStatus}</>;
};

export default NotebookToolbarStatus;

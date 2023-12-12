/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

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

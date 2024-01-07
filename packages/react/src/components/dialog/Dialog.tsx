/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useEffect } from 'react';
import LuminoDetached from '../lumino/LuminoDetached';
import DialogAdapter from './DialogAdapter';

export const Dialog = () => {
  const [dialogAdapter, _] = useState(new DialogAdapter());
  useEffect(() => {
    dialogAdapter.dialog.launch().then(success => success);
  }, []);
  return <LuminoDetached>{dialogAdapter.dialog}</LuminoDetached>;
};

export default Dialog;

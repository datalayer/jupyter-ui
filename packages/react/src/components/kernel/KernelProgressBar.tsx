/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useEffect } from 'react';
import { ProgressBar } from '@primer/react';

export const KernelProgressBar = () => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((oldValue: number) => {
        let newValue = oldValue + 1;
        if (newValue > 100) {
          newValue = 0;
        }
        return newValue;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);
  return <ProgressBar progress={progress} barSize="small" />;
};

export default KernelProgressBar;

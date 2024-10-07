/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

export type IDatalayerConfig = {
  /**
   * Datalayer RUN URL.
   */
  runUrl: string;
  /**
   * Datalayer Token.
   */
  token: string;
  /**
   * CPU Environment.
   */
  cpuEnvironment: string;
  /**
   * GPU Environment.
   */
  gpuEnvironment: string;
};

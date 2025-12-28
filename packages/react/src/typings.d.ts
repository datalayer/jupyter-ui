/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

declare module '*.json' {
  const value: any;
  export default value;
}

declare module '*?text' {
  const value: string;
  export default value;
}

declare module '*.jpg' {
  const value: any;
  export default value;
}

declare module '*.jpeg' {
  const value: any;
  export default value;
}

declare module '*.png' {
  const value: any;
  export default value;
}

declare module '*.gif' {
  const value: any;
  export default value;
}

declare module '*.svg' {
  const value: any;
  export default value;
}

declare module '*.whl' {
  const res: string;
  export default res;
}

declare module '*/style/index.js' {
  const value: any;
  export default value;
}

declare module '*/variables.css' {
  const value: any;
  export default value;
}

declare module '*/variables.css?raw' {
  const value: string;
  export default value;
}

declare module '*/theme.css' {
  const value: any;
  export default value;
}

declare module '*/base.css' {
  const value: any;
  export default value;
}

declare module '*/index.css' {
  const value: any;
  export default value;
}

declare module '*/widgets-base.css' {
  const value: any;
  export default value;
}

declare module '@primer/primitives/dist/css/*' {
  const value: any;
  export default value;
}

declare module 'jupyterlab-plotly/lib/jupyterlab-plugin' {
  const value: any;
  export default value;
}

declare module 'jupyterlab-plotly/lib/plotly-renderer' {
  const value: any;
  export default value;
}

declare module 'localforage-memoryStorageDriver' {
  import { LocalForageDriver } from 'localforage';
  const memoryStorageDriver: LocalForageDriver;
  export default memoryStorageDriver;
}

/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import IPyWidgetsAttached from './ipywidgets/IPyWidgetsAttached';

import './OutputIPyWidgets.css';

export type OutputIPyWidgetsProps = {
  view: any;
  state: any;
};

export const OutputIPyWidgets = (props: OutputIPyWidgetsProps) => {
  const { view, state } = props;
  return (
    <>
      <IPyWidgetsAttached view={view} state={state} />
    </>
  );
};

export default OutputIPyWidgets;

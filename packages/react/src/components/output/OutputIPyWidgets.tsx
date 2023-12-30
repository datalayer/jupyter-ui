/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import IPyWidgetsAttached from './ipywidgets/IPyWidgetsAttached';

import './OutputIPyWidgets.css';

type Props = {
  view: any;
  state: any;
};

export const OutputIPyWidgets = (props: Props) => {
  const { view, state } = props;
  return (
    <>
      <IPyWidgetsAttached view={view} state={state} />
    </>
  );
};

export default OutputIPyWidgets;

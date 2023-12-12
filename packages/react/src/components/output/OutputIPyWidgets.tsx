/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import IPyWidgetsAttached from '../../jupyter/ipywidgets/IPyWidgetsAttached';

import './OutputIPyWidgets.css';

type Props = {
  view: any,
  state: any,
}

export const OutputIPyWidgets = (props: Props) => {
  const { view, state } = props;
  return (
    <>
      <IPyWidgetsAttached view={view} state={state} />
    </>
  )
}

export default OutputIPyWidgets;

/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { OutputIPyWidgets } from '../../../components/output';
import {
  view,
  state,
} from './../../../examples/notebooks/OutputIPyWidgetsExample';

export const IPyWidgetsComponent = () => {
  return (
    <>
      <OutputIPyWidgets view={view} state={state} />
    </>
  );
};

export default IPyWidgetsComponent;

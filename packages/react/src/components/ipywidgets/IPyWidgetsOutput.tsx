import IPyWidgetsAttached from '../../jupyter/lumino/IPyWidgetsAttached';

import './IPyWidgetsOutput.css';

type Props = {
  view: any,
  state: any,
}

export const IPyWidgetsOutput = (props: Props) => {
  const { view, state } = props;
  return (
    <>
      <IPyWidgetsAttached view={view} state={state} />
    </>
  )
}

export default IPyWidgetsOutput;

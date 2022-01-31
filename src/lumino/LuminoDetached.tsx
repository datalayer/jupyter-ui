import React from 'react';

/**
 * The LuminoDetached class allows to render a Lumino
 * Widget not being mounted in the React.js tree.
 */
class LuminoDetached extends React.Component {
  render() {
    return <div ref={ref => {}}></div>;
  }
}

export default LuminoDetached;

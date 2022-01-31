import React from 'react';
import { Widget } from '@lumino/widgets';

/**
 * The LuminoAttached class allows to render a Lumino
 * Widget being mounted in the React.js tree.
 */
class LuminoAttached extends React.Component {
  render() {
    return <div ref={ref => {
      if (ref) {
        const widget = this.props.children as Widget;
        if (widget.isAttached) {
          // Widget is already attached, skipping...
          return;
        }
        Widget.attach(this.props.children as Widget, ref as HTMLElement);
      }
    }}/>;
  }
}

export default LuminoAttached;

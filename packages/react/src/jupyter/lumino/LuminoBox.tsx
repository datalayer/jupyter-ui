import { useRef, useEffect } from 'react';
import { unmountComponentAtNode } from 'react-dom';
import { Widget, BoxPanel } from '@lumino/widgets';
import { Box } from '@primer/react';

type LuminoBoxProps = {
  id?: string;
  height: number | string;
  children: Widget;
}

export const LuminoBox = (props: LuminoBoxProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { id, height, children } = props;
  useEffect(() => {
    if (ref && ref.current) {
      const boxPanel = new BoxPanel();
      boxPanel.spacing = 0;
      boxPanel.addWidget(children);
      try {
        Widget.attach(boxPanel, ref.current);
      } catch(e) {
        console.warn('Exception while attaching Lumino widget.', e);
      }
      return () => {
        try {
          unmountComponentAtNode(boxPanel.node);
          if (boxPanel.isAttached || boxPanel.node.isConnected) {
            boxPanel.dispose();
            Widget.detach(boxPanel);
          }
        } catch(e) {
          // no-op.
//          console.debug('Exception while detaching Lumino widget.', e);
        }
      }
    }
  }, [ref, children]);
  return (
    <Box
      style={{
        height,
        minHeight: height,
        width: '100%',
      }}
    >
      <div id={id} ref={ref}/>
    </Box>
  )
}

LuminoBox.defaultProps = {
  id: "lumino-box-id",
  height: "100%",
}

export default LuminoBox;

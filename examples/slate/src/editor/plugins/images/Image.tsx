import { RenderElementProps, useSelected, useFocused } from 'slate-react';
import { css } from '@emotion/css';
import { ImageElement } from '../../../slate';

const Image = ({attributes, children, element}: RenderElementProps) => {
  const selected = useSelected();
  const focused = useFocused();
  return (
    <div {...attributes}>
      <div contentEditable={false}>
        <img
          src={(element as ImageElement).url}
          className={css`
            display: block;
            max-width: 100%;
            max-height: 20em;
            box-shadow: ${selected && focused ? '0 0 0 3px #B4D5FF' : 'none'};
          `}
        />
      </div>
      {children}
    </div>
  );
}

export default Image;

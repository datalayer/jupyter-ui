import { RenderElementProps } from 'slate-react';
import { Kernel } from '@datalayer/jupyter-react';
import Image from './../plugins/images/Image';
import JupyterCell from './../plugins/jupyter/JupyterCell';
import JupyterFileBrowser from './../plugins/jupyter/JupyterFileBrowser';

export type RenderJupyterProps = RenderElementProps & { kernel: Kernel };

const Element = (props: RenderJupyterProps) => {
  const { attributes, children, element } = props;
  switch (element.type) {
    case 'paragraph':
      return <p {...attributes}>{children}</p>;
    case 'h1':
      return <h1 {...attributes}>{children}</h1>
    case 'h2':
      return <h2 {...attributes}>{children}</h2>
    case 'h3':
      return <h3 {...attributes}>{children}</h3>
    case 'image':
      return <Image {...props} />;
    case 'jupyter-cell':
      return <JupyterCell {...props} />;
    case 'jupyter-filebrowser':
      return <JupyterFileBrowser {...props} />;
    default:
      return <p {...attributes}>Unkown element type: {element.type}</p>;
  }
}

export default Element;

import { NodeKey } from "lexical";
import { JupyterCellComponent } from "./../components/JupyterCellComponent";

type Props = {
  nodeKey: NodeKey;
  data: any;
}

export const CustomComponent = ({ nodeKey, data }: Props) => {
  return (
    <>
      <JupyterCellComponent/>
    </>
  );
}

export default CustomComponent;

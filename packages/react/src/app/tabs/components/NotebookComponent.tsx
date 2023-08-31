import { Jupyter } from '../../../jupyter/Jupyter';
// import Notebook from '../../../components/notebook/Notebook';
// import CellSidebarNew from "../../../components/notebook/cell/sidebar/CellSidebarNew";

const NotebookComponent = () => {
  return (
    <>
      <Jupyter>
       {/* 
        <Notebook
          path="ipywidgets.ipynb"
          uid="notebook-uid"
          externalIPyWidgets={[
            { name: "bqplot", version: "0.5.42" },
            { name: "jupyter-matplotlib", version: "0.11.3" },
            { name: "@widgetti/jupyter-react", version: "0.3.0" },
          ]}
          cellSidebarMargin={60}
          height='calc(100vh - 2.6rem)' // (Height - Toolbar Height).
          CellSidebar={CellSidebarNew}
        />
        */}
      </Jupyter>
    </>
  )
}

export default NotebookComponent;


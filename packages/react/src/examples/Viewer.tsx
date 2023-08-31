import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { INotebookContent } from '@jupyterlab/nbformat';
import { Box, ActionMenu, ActionList } from '@primer/react';
import { NetworkIcon, JupyterBaseIcon, JupiterIcon, ScientistIcon } from '@datalayer/icons-react';
import Jupyter from '../jupyter/Jupyter';
import Viewer from '../components/viewer/Viewer';

type NotebookExample = {
  title: string,
  url: string,
}

const visualisations: NotebookExample[] = [
  {
    title: "Plotly Presentation",
    url: "https://raw.githubusercontent.com/jstac/quantecon_nyu_2016/master/lecture9/Plotly_Presentation.ipynb",
  },
  {
    title: "Matplotlib",
    url: "https://raw.githubusercontent.com/anissa111/matplotlib-tutorial/main/notebooks/01-basic-matplotlib-tutorial.ipynb",
  },
  {
    title: "Bicycle Control",
    url: "https://raw.githubusercontent.com/plotly/IPython-plotly/master/notebooks/bicycle_control/bicycle_control.ipynb",
  },
  {
    title: "IPyWidgets Example",
    url: " https://raw.githubusercontent.com/jupyter-widgets/ipywidgets/main/docs/source/examples/Widget%20Basics.ipynb",
  }, 
]

const dataSciences: NotebookExample[] = [
  {
    title: "Fair Experiment",
    url: "https://raw.githubusercontent.com/datalayer-courses/foundations-of-data-science-with-python/main/04-probability1/fair-experiments.ipynb",
  },
  {
    title: "Text Vectorization",
    url: "https://raw.githubusercontent.com/datalayer-courses/python-text-mining-intro/main/4-text-vectorization.ipynb",
  },
  {
    title: "Survival Analysis",
    url: "https://raw.githubusercontent.com/plotly/IPython-plotly/master/notebooks/survival_analysis/survival_analysis.ipynb",
  },
]

const astronomies: NotebookExample[] = [
  {
    title: "Center of Mass",
    url: "https://raw.githubusercontent.com/JuanCab/AstroInteractives/master/Interactives/Center_of_Mass.ipynb",
  },
  /*
  {
    title: "Propagation Effects",
    url: "https://raw.githubusercontent.com/ratt-ru/fundamentals_of_interferometry/master/7_Observing_Systems/7_7_propagation_effects.ipynb",
  },
  */
]

type MenuLineProps = {
  notebookExample: NotebookExample,
  setNotebookExample: React.Dispatch<React.SetStateAction<NotebookExample>>,
  icon: JSX.Element,
}

const MenuLine = (props: MenuLineProps) => {
  const { notebookExample, setNotebookExample, icon } = props;
  return (
    <ActionList.Item onSelect={event => setNotebookExample(notebookExample)}>
    <ActionList.LeadingVisual>
      {icon}
    </ActionList.LeadingVisual>
    <ActionList.Description variant="block">
      {notebookExample.url}
    </ActionList.Description>
    {notebookExample.title}
  </ActionList.Item>
  )
}

const ViewerExample = () => {
  const [notebookExample, setNotebookExample] = useState<NotebookExample>(visualisations[0]);
  const [nbformat, setNbformat] = useState<INotebookContent>();
  useEffect(() => {
    fetch(notebookExample.url)
      .then(response => {
        return response.text();
      })
      .then(nb => {
        const nbformat = nb.replaceAll('\\n', '');
        setNbformat(JSON.parse(nbformat));
      });
  }, [notebookExample]);

  return (
    <>
      <Box m={3}>
        <Jupyter>
          <ActionMenu>
            <ActionMenu.Button leadingVisual={() => <JupyterBaseIcon colored/>}>
              Jupyter Viewer
            </ActionMenu.Button>
            <ActionMenu.Overlay>
              <ActionList showDividers>
                <ActionList.Group title="Visualisations">
                  {visualisations.map(visualisation => 
                    <MenuLine notebookExample={visualisation} icon={<NetworkIcon colored/>} setNotebookExample={setNotebookExample} />)}
                </ActionList.Group>                <ActionList.Group title="Data Science">
                  {dataSciences.map(dataScience => 
                    <MenuLine notebookExample={dataScience} icon={<ScientistIcon colored/>} setNotebookExample={setNotebookExample} />)}
                </ActionList.Group>
                <ActionList.Group title="Astronomy">
                  {astronomies.map(astronomy => 
                    <MenuLine notebookExample={astronomy} icon={<JupiterIcon colored/>} setNotebookExample={setNotebookExample} />)}
                </ActionList.Group>
              </ActionList>
            </ActionMenu.Overlay>
          </ActionMenu>
          { nbformat && <Viewer nbformat={nbformat} outputs={true} /> }
        </Jupyter>
      </Box>
    </>
  )
}

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div)

root.render(
  <ViewerExample/>
);

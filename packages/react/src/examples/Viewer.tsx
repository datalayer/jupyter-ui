/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { INotebookContent } from '@jupyterlab/nbformat';
import { Box, ActionMenu, ActionList } from '@primer/react';
import { NetworkIcon, JupyterBaseIcon, JupiterIcon, ScientistIcon } from '@datalayer/icons-react';
import Jupyter from '../jupyter/Jupyter';
import Viewer from '../components/viewer/Viewer';

import("./../jupyter/lab/JupyterLabCssImports");

type NotebookExample = {
  title: string;
  url: string;
}

const visualisationExamples: NotebookExample[] = [
  {
    title: "Plotly Daily Stocks",
    url: "https://raw.githubusercontent.com/datalayer-examples/notebooks/main/daily-stock.ipynb",
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

const dataScienceExamples: NotebookExample[] = [
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

const astronomyExamples: NotebookExample[] = [
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
  notebookExample: NotebookExample;
  setNotebookExample: React.Dispatch<React.SetStateAction<NotebookExample>>;
  icon: JSX.Element;
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
  const [notebookExample, setNotebookExample] = useState<NotebookExample>(visualisationExamples[0]);
  const [nbformat, setNbformat] = useState<INotebookContent>();
  useEffect(() => {
    fetch(notebookExample.url)
      .then(response => {
        return response.text();
      })
      .then(nbformat => {
//        const nbformat = nb.replaceAll('\\n', '');
        setNbformat(JSON.parse(nbformat));
      });
  }, [notebookExample]);
  return (
    <>
      <Box m={3}>
        <Jupyter startDefaultKernel={false} disableCssLoading={true}>
          <ActionMenu>
            <ActionMenu.Button leadingVisual={() => <JupyterBaseIcon colored/>}>
              Jupyter Viewer
            </ActionMenu.Button>
            <ActionMenu.Overlay>
              <ActionList showDividers>
                <ActionList.Group title="Visualisation">
                  {visualisationExamples.map(example =>
                    <MenuLine notebookExample={example} icon={<NetworkIcon colored/>} setNotebookExample={setNotebookExample} key={example.url} />)}
                </ActionList.Group>
                <ActionList.Group title="Data Science">
                  {dataScienceExamples.map(example =>
                    <MenuLine notebookExample={example} icon={<ScientistIcon colored/>} setNotebookExample={setNotebookExample} key={example.url} />)}
                </ActionList.Group>
                <ActionList.Group title="Astronomy">
                  {astronomyExamples.map(example =>
                    <MenuLine notebookExample={example} icon={<JupiterIcon colored/>} setNotebookExample={setNotebookExample} key={example.url} />)}
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

import { createRoot } from 'react-dom/client';
import { IOutput } from '@jupyterlab/nbformat';
import { Text } from '@primer/react';
import Jupyter from '../jupyter/Jupyter';
import { useJupyter } from '../jupyter/JupyterContext';
import Output from "../components/output/Output";

const SOURCE_1 = '1+1'

const SOURCE_1_OUTPUTS: IOutput[] = [
  {
    "data": {
      "text/plain": [
        "2"
      ]
    },
    "execution_count": 1,
    "metadata": {},
    "output_type": "execute_result"
  }
];

const OutputWithoutEditor = () => {
  return (
    <>
      <Text as="h1">Output without Editor</Text>
      <Output
        showEditor={false}
        outputs={SOURCE_1_OUTPUTS}
      />
    </>
  )
}

const OutputWithEditor = () => {
  const { defaultKernel } = useJupyter();
  return (
    <>
      <Text as="h1">Output with Editor</Text>
      <Output
        showEditor={true}
        autoRun={false}
        kernel={defaultKernel}
        code={SOURCE_1}
        outputs={SOURCE_1_OUTPUTS}
      />
    </>
  )
}

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div)

root.render(
  <Jupyter>
    <OutputWithoutEditor />
    <OutputWithEditor />
  </Jupyter>
);

import { createRoot } from 'react-dom/client';
import { IOutput } from '@jupyterlab/nbformat';
import Jupyter from '../jupyter/Jupyter';
import { useJupyter } from '../jupyter/JupyterContext';
import Output from "../components/output/Output";

import "./../../style/index.css";

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

const Outputs = () => {
  const { defaultKernel } = useJupyter();
  return (
    <>
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
  <Jupyter lite={false} terminals={true}>
    <Outputs />
  </Jupyter>
);

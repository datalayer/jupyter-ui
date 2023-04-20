import { useMemo } from 'react';
import { IOutput } from '@jupyterlab/nbformat';
import { useJupyter, Kernel, Output } from '@datalayer/jupyter-react';

import "./../index.css";

const SOURCE_IPYWIDGET = `import ipywidgets as widgets
widgets.IntSlider(
    value=7,
    min=0,
    max=10,
    step=1
)`
/*
const OUTPUT_1 = (
  [
    {
    "data": {
      "application/vdom.v1+json": {
      "attributes": {},
      "children": [
        {
        "attributes": {},
        "children": [
          "Our Incredibly Declarative Example"
        ],
        "tagName": "h1"
        },
        {
        "attributes": {},
        "children": [
          "Can you believe we wrote this ",
          {
          "attributes": {},
          "children": [
            "in Python"
          ],
          "tagName": "b"
          },
          "?"
        ],
        "tagName": "p"
        },
        {
        "attributes": {
          "src": "https://media.giphy.com/media/xUPGcguWZHRC2HyBRS/giphy.gif"
        },
        "children": [],
        "tagName": "img"
        },
        {
        "attributes": {},
        "children": [
          "What will  ",
          {
          "attributes": {},
          "children": [
            "you"
          ],
          "tagName": "b"
          },
          " create next?"
        ],
        "tagName": "p"
        }
      ],
      "tagName": "div"
      },
      "text/html": [
      "<div><h1>Our Incredibly Declarative Example</h1><p>Can you believe we wrote this <b>in Python</b>?</p><img src=\"https://media.giphy.com/media/xUPGcguWZHRC2HyBRS/giphy.gif\"></img><p>What will <b>you</b> create next?</p></div>"
      ],
      "text/plain": [
      "<div><h1>Our Incredibly Declarative Example</h1><p>Can you believe we wrote this <b>in Python</b>?</p><img src=\"https://media.giphy.com/media/xUPGcguWZHRC2HyBRS/giphy.gif\"></img><p>What will <b>you</b> create next?</p></div>"
      ]
    },
    "metadata": {},
    "output_type": "display_data"
    }
  ]
 ) as any;
*/
const OUTPUT_2: IOutput[] = [
    {
     "data": {
      "application/json": {
       "array": [
        1,
        2,
        3
       ],
       "bool": true,
       "object": {
        "foo": "bar"
       },
       "string": "string"
      },
      "text/plain": [
       "<IPython.core.display.JSON object>"
      ]
     },
     "execution_count": 8,
     "metadata": {
      "application/json": {
       "expanded": false,
       "root": "root"
      }
     },
     "output_type": "execute_result"
    }
  ];
/*
const OUTPUT_3 = [
  {
   "data": {
    "application/vnd.jupyter.widget-view+json": {
     "model_id": "8a70de37cd284b289ac4a54ae95ef622",
     "version_major": 2,
     "version_minor": 0
    },
    "text/plain": [
     "Dropdown(description='Number:', index=1, options=('1', '2', '3'), value='2')"
    ]
   },
   "execution_count": 3,
   "metadata": {},
   "output_type": "execute_result"
  }
];
*/
/**
 * A simple example for the React Editor.
 */
export const OutputsComponents = () => {
  const { kernelManager } = useJupyter();
  const kernel = useMemo(() => {
    if (kernelManager) return new Kernel({ kernelManager, kernelName: 'python3' });
  }, [kernelManager]);
  return  <>
    <h3>Simple Output</h3>
    <Output
      autoRun={true}
      kernel={kernel}
      code={"print('Hello Datalayer 👍')"}
    />
    <h3>IPyWidget Output</h3>
    <Output
      autoRun={true}
      kernel={kernel}
      code={SOURCE_IPYWIDGET}
    />
    <h3>JSON Output</h3>
    <Output
      outputs={OUTPUT_2}
      autoRun={false}
      kernel={kernel}
    />
  </>
}

export default OutputsComponents;

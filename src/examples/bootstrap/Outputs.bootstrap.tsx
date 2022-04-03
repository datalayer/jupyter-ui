import { useState } from 'react';
import { render } from 'react-dom';
import { ThemeProvider } from '@mui/material/styles';
import muiLightTheme from '../theme/Theme';
import { useJupyter } from '../../jupyter/JupyterContext';
import Jupyter from '../../jupyter/Jupyter';
import Kernel from '../../services/kernel/Kernel';
import Layers from '../theme/Layers';
import OutputsControl from '../controls/OutputsControl';
import OutputLumino from '../../components/outputs/OutputLumino';

const SOURCE_1 = `import ipywidgets as widgets
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
const OUTPUT_2 = (
  [
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
  ]
);
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
const Example = () => {
  const { baseUrl, wsUrl } = useJupyter();
  const [kernel,] = useState(new Kernel({ baseUrl, wsUrl }));
  return  <>
    <OutputsControl/>
    <OutputLumino
      initialOutput={OUTPUT_2 as any}
      showEditor={false}
      autoRun={false}
      kernel={kernel}
    />
    <h3>Simple Output</h3>
    <OutputLumino
      showEditor={true}
      autoRun={true}
      kernel={kernel}
      code={"print('Hello Datalayer 👍')"}
    />
    <h3>IPyWidget Output</h3>
    <OutputLumino 
      showEditor={true}
      autoRun={true}
      kernel={kernel}
      code={SOURCE_1}
    />
  </>
}

const div = document.createElement('div');
document.body.appendChild(div);

render(
  <ThemeProvider theme={muiLightTheme}>
    <Jupyter collaborative={false} terminals={false}>
      <Layers />
      <Example />
    </Jupyter>
  </ThemeProvider>
  ,
  div
);

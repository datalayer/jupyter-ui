/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { IOutput } from '@jupyterlab/nbformat';
import AnsiToHtml from 'ansi-to-html';

const ansiConverter = new AnsiToHtml({
  fg: '#000',
  bg: '#fff',
  newline: false,
  escapeXML: false,
});

export type OutputRendererProps = {
  output: IOutput;
};
/*
{
    "execution_count": 2,
    "output_type": "execute_result",
    "data": {
        "text/plain": "IntSlider(value=7, max=10)",
        "application/vnd.jupyter.widget-view+json": {
            "version_major": 2,
            "version_minor": 0,
            "model_id": "cf2eac02dda44b08befe1657e1de73a2"
        }
    },
    "metadata": {}
}
{
    "name": "stdout",
    "text": "1\n1\n",
    "output_type": "stream"
}
{
    "traceback": [
        "\u001b[0;36m  Input \u001b[0;32mIn [4]\u001b[0;36m\u001b[0m\n\u001b[0;31m    x=1sdfsq\u001b[0m\n\u001b[0m      ^\u001b[0m\n\u001b[0;31mSyntaxError\u001b[0m\u001b[0;31m:\u001b[0m invalid decimal literal\n"
    ],
    "ename": "SyntaxError",
    "evalue": "invalid decimal literal (2376046737.py, line 1)",
    "output_type": "error"
}
{
  "cell_type": "code",
  "execution_count": 1,
  "id": "7e5deaa8-6f0e-4b70-b5af-4b70b53ea130",
  "metadata": {},
  "outputs": [
  {
    "name": "stdout",
    "output_type": "stream",
    "text": [
    "1\n",
    "2\n"
    ]
  }
  ],
  "source": [
  "from time import sleep\n",
  "for i in range(1, 3):\n",
  "      sleep(i)\n",
  "      print(i)"
  ]
},
*/
export const OutputRenderer = (props: OutputRendererProps) => {
  const { output } = props;
  let plain: string | undefined;
  let html: string | undefined;
  let img: string | undefined;
  switch (output.output_type) {
    case 'error': {
      // Convert ANSI escape codes to HTML for colored error output
      const tracebackText = (output.traceback as string[]).join('\n');
      html = ansiConverter.toHtml(tracebackText);
      plain = tracebackText;
      break;
    }
    case 'stream': {
      const t = output.text;
      if (typeof t === 'string') {
        plain = t;
      } else if (typeof t === 'boolean') {
        plain = t ? 'true' : 'false';
      } else if (Array.isArray(t)) {
        plain = (t as string[]).join('\n');
      } else {
        plain = t?.toString();
      }
      break;
    }
    case 'display_data': {
      const data = output.data as any;
      if (data) {
        const image_png = data['image/png'];
        if (image_png) {
          img = image_png;
        }
      }
      break;
    }
    case 'execute_result': {
      const data = output.data as any;
      if (data) {
        const text_plain = data['text/plain'];
        if (text_plain) {
          if (typeof text_plain === 'string') {
            plain = text_plain;
          } else if (Array.isArray(text_plain)) {
            plain = text_plain.join('\n');
          } else {
            plain = text_plain.toString();
          }
        }
        const text_html = data['text/html'];
        if (text_html) {
          if (typeof text_html === 'string') {
            html = text_html;
          } else {
            html = text_html.join('\n');
          }
        }
      }
      break;
    }
  }
  return (
    <>
      {plain && (
        <pre
          style={{
            color: 'black',
            backgroundColor: 'white',
          }}
        >
          {plain}
        </pre>
      )}
      {html && (
        <div>
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      )}
      {img && (
        <div>
          <img src={`data:image/png;base64,${img}`} />
        </div>
      )}
    </>
  );
};

export default OutputRenderer;

import {render} from 'react-dom';
import NotebookSidebarComponent from './NotebookSidebarComponent';

import './../index.css';

const div = document.createElement('div');
document.body.appendChild(div);

render(<NotebookSidebarComponent />, div);

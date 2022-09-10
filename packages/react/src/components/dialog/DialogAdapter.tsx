import { Dialog as JupyerLabDialog } from '@jupyterlab/apputils';

import './DialogAdapter.css';

export class DialogAdapter {
  public dialog: JupyerLabDialog<any>;

  public constructor() {
    this.dialog = new JupyerLabDialog({
      title: 'Dialog Title',
      body: 'This is the body of the dialog...',
      buttons: [
        JupyerLabDialog.cancelButton(),
        JupyerLabDialog.okButton(),
      ]
    });
  }

}

export default DialogAdapter;

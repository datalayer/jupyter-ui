import { Dialog as JPDialog } from '@jupyterlab/apputils';

import '@jupyterlab/apputils/style/index.css';
import '@jupyterlab/theme-light-extension/style/theme.css';
import '@jupyterlab/theme-light-extension/style/variables.css';
 
import './DialogAdapter.css';

class DialogAdapter {
  public dialog: JPDialog<any>;
  public constructor() {
    this.dialog = new JPDialog({
      title: 'Dialog Title',
      body: 'This is the body of the dialog...',
      buttons: [
        JPDialog.cancelButton(),
        JPDialog.okButton(),
      ]
    });
  }
}

export default DialogAdapter;

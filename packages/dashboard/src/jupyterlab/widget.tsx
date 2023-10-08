import { ReactWidget } from '@jupyterlab/apputils';
import DashboardHome from '../Dashboard';

export class DashboardHomeWidget extends ReactWidget {
  constructor() {
    super();
    this.addClass('dla-Container');
  }

  render(): JSX.Element {
    return <DashboardHome />;
  }
}

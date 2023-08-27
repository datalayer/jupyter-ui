import { ReactWidget } from '@jupyterlab/apputils';
import DashboardHome from './DashboardHome';

export class DashboardHomeWidget extends ReactWidget {
  constructor() {
    super();
    this.addClass('dla-Container');
  }

  render(): JSX.Element {
    return <DashboardHome />;
  }
}

import { LabIcon } from '@jupyterlab/ui-components';

import whiteDashboardSvgstr from '../style/icons/dashboard_icon_filled_white.svg';
import greyDashboardSvgstr from '../style/icons/dashboard_icon_filled_grey.svg';
import blueDashboardSvgstr from '../style/icons/dashboard_icon_filled_blue.svg';
import whiteDashboardOutlineSvgstr from '../style/icons/dashboard_icon_outline_white.svg';
import greyDashboardOutlineSvgstr from '../style/icons/dashboard_icon_outline_grey.svg';
import tealDashboardSvgstr from '../style/icons/dashboard_icon_filled_teal.svg';
import redoIcon from '../style/icons/redo.svg';
import fullscreenIcon from '../style/icons/fullscreen.svg';
import statusIcon from '../style/icons/dummy.svg';
import resizerSvgstr from '../style/icons/mdi_drag_indicator.svg';
import editSvgstr from '../style/icons/edit.svg';
import viewSvgstr from '../style/icons/view.svg';
import resizer2Svgstr from '../style/icons/drag indicator lines.svg';

/**
 * Dashboard icons
 */
export namespace DashboardIcons {
  export const tealDashboard = new LabIcon({
    name: 'pr-icons:teal-dashboard',
    svgstr: tealDashboardSvgstr
  });

  export const whiteDashboard = new LabIcon({
    name: 'pr-icons:white-dashboard',
    svgstr: whiteDashboardSvgstr
  });

  export const greyDashboard = new LabIcon({
    name: 'pr-icons:grey-dashboard',
    svgstr: greyDashboardSvgstr
  });

  export const blueDashboard = new LabIcon({
    name: 'pr-icons:blue-dashboard',
    svgstr: blueDashboardSvgstr
  });

  export const whiteDashboardOutline = new LabIcon({
    name: 'pr-icons:white-dashboard-outline',
    svgstr: whiteDashboardOutlineSvgstr
  });

  export const greyDashboardOutline = new LabIcon({
    name: 'pr-icons:grey-dashboard-outline',
    svgstr: greyDashboardOutlineSvgstr
  });

  export const redo = new LabIcon({
    name: 'pr-icons:redo',
    svgstr: redoIcon
  });

  export const fullscreen = new LabIcon({
    name: 'pr-icons:fullscreen',
    svgstr: fullscreenIcon
  });

  export const status = new LabIcon({
    name: 'pr-icons:status',
    svgstr: statusIcon
  });

  export const resizer = new LabIcon({
    name: 'pr-icons:resizer',
    svgstr: resizerSvgstr
  });

  export const view = new LabIcon({
    name: 'pr-icons:view',
    svgstr: viewSvgstr
  });

  export const edit = new LabIcon({
    name: 'pr-icons:edit',
    svgstr: editSvgstr
  });

  export const resizer2 = new LabIcon({
    name: 'pr-icons:resizer2',
    svgstr: resizer2Svgstr
  });
}

export default DashboardIcons;

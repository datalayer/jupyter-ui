/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

declare let __webpack_public_path__: string;
__webpack_public_path__ = (window as any).__jupyter_widgets_assets_path__ || __webpack_public_path__;

/*
import '@fortawesome/fontawesome-free/css/all.min.css';
import '@fortawesome/fontawesome-free/css/v4-shims.min.css';
import '@lumino/widgets/style/index.css';
import '@jupyter-widgets/controls/css/widgets-base.css';
// If lab variables are not found, we set them (we don't want to reset the variables if they are already defined)
if (getComputedStyle(document.documentElement).getPropertyValue('--jp-layout-color0') === '') {
  require('@jupyter-widgets/controls/css/labvariables.css');
}
*/
import Ajv from 'ajv';
import { IManagerState } from '@jupyter-widgets/base-manager';
import { HTMLManager } from './classic/htmlmanager';

import * as widget_state_schema from '@jupyter-widgets/schema/v2/state.schema.json';
import * as widget_view_schema from '@jupyter-widgets/schema/v2/view.schema.json';
/*
interface IViewState {
  version_major: number;
  version_minor: number;
  model_id: string;
}
*/
const ajv = new Ajv();
const model_validate = ajv.compile(widget_state_schema);
const view_validate = ajv.compile(widget_view_schema);

/**
 * Render the inline widgets inside a DOM element.
 *
 * @param managerFactory A function that returns a new HTMLManager
 * @param element (default document.documentElement) The document element in which to process for widget state.
 */
export async function renderWidgets(
  managerFactory: () => HTMLManager,
  element: HTMLElement = document.documentElement
): Promise<void> {
  const tags = element.querySelectorAll(
    'script[type="application/vnd.jupyter.widget-state+json"]'
  );
  await Promise.all(
    Array.from(tags).map(async (t) =>
      renderManager(element, JSON.parse(t.innerHTML), managerFactory)
    )
  );
}

/**
 * Create a widget manager for a given widget state.
 *
 * @param element The DOM element to search for widget view state script tags
 * @param widgetState The widget manager state
 *
 * #### Notes
 *
 * Widget view state should be in script tags with type
 * "application/vnd.jupyter.widget-view+json". Any such script tag containing a
 * model id the manager knows about is replaced with a rendered view.
 * Additionally, if the script tag has a prior img sibling with class
 * 'jupyter-widget', then that img tag is deleted.import { HTMLManager } from './classic/htmlmanager';

 */
async function renderManager(
  element: HTMLElement,
  widgetState: unknown,
  managerFactory: () => HTMLManager
): Promise<void> {
  const valid = model_validate(widgetState);
  if (!valid) {
    throw new Error(`Model state has errors: ${model_validate.errors}`);
  }
  const manager = managerFactory();
  const models = await manager.set_state(widgetState as IManagerState);
  const tags = element.querySelectorAll(
    'script[type="application/vnd.jupyter.widget-view+json"]'
  );
  await Promise.all(
    Array.from(tags).map(async (viewtag) => {
      const widgetViewObject = JSON.parse(viewtag.innerHTML);
      const valid = view_validate(widgetViewObject);
      if (!valid) {
        throw new Error(`View state has errors: ${view_validate.errors}`);
      }
      const model_id: string = (widgetViewObject as any).model_id;
      const model = models.find((item) => item.model_id == model_id);
      if (model !== undefined && viewtag.parentElement !== null) {
        const prev = viewtag.previousElementSibling;
        if (
          prev &&
          prev.tagName === 'img' &&
          prev.classList.contains('jupyter-widget')
        ) {
          viewtag.parentElement.removeChild(prev);
        }
        const widgetTag = document.createElement('div');
        widgetTag.className = 'widget-subarea';
        viewtag.parentElement.insertBefore(widgetTag, viewtag);
        const view = await manager.create_view(model);
        manager.display_view(view, widgetTag);
      }
    })
  );
}

/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import { IJupyterWidgetRegistry } from "@jupyter-widgets/base";
import { MODULE_NAME, MODULE_VERSION } from "./Version";

/**
 * Activate the widget extension.
 */
export function activatePlotlyWidgetExtension(
  registry: IJupyterWidgetRegistry
): void {
  registry.registerWidget({
    name: MODULE_NAME,
    version: MODULE_VERSION,
    exports: () => import("./index"),
  });
}

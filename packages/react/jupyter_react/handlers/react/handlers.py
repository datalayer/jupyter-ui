# Copyright (c) 2021-2023 Datalayer, Inc.
#
# MIT License

import os

from jupyter_server.base.handlers import JupyterHandler
from jupyter_server.extension.handler import (
    ExtensionHandlerMixin,
    ExtensionHandlerJinjaMixin,
)


class ReactBaseTemplateHandler(ExtensionHandlerJinjaMixin, ExtensionHandlerMixin, JupyterHandler):
    pass


class ReactPlotlyHandler(ReactBaseTemplateHandler):
    plotly_js = ""

    def get(self):
        if self.plotly_js == "":
            f = open(
                os.path.join(
                    os.path.dirname(__file__), "./../static/plotly-2.3.0.min.js"
                ),
                "r",
            )
            self.plotly_js = f.read()
        self.set_header("Content-Type", 'text/javascript; charset="utf-8"')
        self.write(self.plotly_js)

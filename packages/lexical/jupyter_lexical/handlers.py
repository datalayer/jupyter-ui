# Copyright (c) 2021-2023 Datalayer, Inc.
#
# MIT License

import json

import tornado

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join


class JupyterLexicalHandler(APIHandler):

    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the Jupyter server
    @tornado.web.authenticated
    def get(self):
        self.finish(json.dumps({
            "data": "This is /jupyter_lexical/config endpoint!"
        }))


def setup_handlers(web_app):
    host_pattern = ".*$"
    base_url = web_app.settings["base_url"]
    route_pattern = url_path_join(base_url, "jupyter_lexical", "config")
    handlers = [(route_pattern, JupyterLexicalHandler)]
    web_app.add_handlers(host_pattern, handlers)

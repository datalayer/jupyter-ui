# Copyright (c) 2021-2023 Datalayer, Inc.
#
# MIT License

"""Config handler."""

import json

import tornado

from jupyter_server.base.handlers import APIHandler
from jupyter_server.extension.handler import ExtensionHandlerMixin

from ..._version import __version__


# pylint: disable=W0223
class ConfigHandler(ExtensionHandlerMixin, APIHandler):
    """The handler for configurations."""

    @tornado.web.authenticated
    def get(self):
        """Returns the configurations of the server extensions."""
        res = json.dumps({
            "extension": "jupyter_react",
            "version": __version__
        })
        self.finish(res)

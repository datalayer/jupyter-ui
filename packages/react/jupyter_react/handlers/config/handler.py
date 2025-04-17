# Copyright (c) 2021-2023 Datalayer, Inc.
#
# MIT License

"""Config handler."""

import json

import tornado

from jupyter_server.base.handlers import APIHandler
from jupyter_server.extension.handler import ExtensionHandlerMixin

from jupyter_react.__version__ import __version__


class ConfigHandler(ExtensionHandlerMixin, APIHandler):
    """The handler for configurations."""

    @tornado.web.authenticated
    def get(self):
        """Returns the configurations of the server extensions."""
        res = json.dumps({
            "extension": self.name,
            "version": __version__,
            "configuration": {
                "launcher": self.config["launcher"].to_dict()
            }
        })
        self.finish(res)

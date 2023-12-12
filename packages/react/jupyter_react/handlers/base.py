# Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
#
# MIT License

"""Base handler."""

from jupyter_server.base.handlers import JupyterHandler
from jupyter_server.extension.handler import ExtensionHandlerMixin, ExtensionHandlerJinjaMixin


# pylint: disable=W0223
class BaseTemplateHandler(ExtensionHandlerJinjaMixin, ExtensionHandlerMixin, JupyterHandler):
    """The Base handler for the templates."""

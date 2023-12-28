# Copyright (c) 2021-2023 Datalayer, Inc.
#
# MIT License

"""The Jupyter React Server application."""

import os

from jupyter_server.utils import url_path_join
from jupyter_server.extension.application import ExtensionApp, ExtensionAppJinjaMixin

from ._version import __version__

from .handlers.index.handler import IndexHandler
from .handlers.config.handler import ConfigHandler


DEFAULT_STATIC_FILES_PATH = os.path.join(os.path.dirname(__file__), "./static")

DEFAULT_TEMPLATE_FILES_PATH = os.path.join(os.path.dirname(__file__), "./templates")


class JupyterReactExtensionApp(ExtensionAppJinjaMixin, ExtensionApp):
    """The Jupyter React Server extension."""

    name = "jupyter_react"

    extension_url = "/jupyter_react"

    load_other_extensions = True

    static_paths = [DEFAULT_STATIC_FILES_PATH]
    template_paths = [DEFAULT_TEMPLATE_FILES_PATH]

    def initialize_settings(self):
        self.log.debug("Jupyter React Config {}".format(self.config))

    def initialize_templates(self):
        self.serverapp.jinja_template_vars.update({"jupyter_react_version" : __version__})

    def initialize_handlers(self):
        self.log.debug("Jupyter React Config {}".format(self.settings['jupyter_react_jinja2_env']))
        handlers = [
            ("jupyter_react", IndexHandler),
            (url_path_join("jupyter_react", "config"), ConfigHandler),
        ]
        self.handlers.extend(handlers)


# -----------------------------------------------------------------------------
# Main entry point
# -----------------------------------------------------------------------------

main = launch_new_instance = JupyterReactExtensionApp.launch_instance

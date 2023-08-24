"""The Jupyter Dashboard Server application."""

import os

from traitlets import Unicode

from jupyter_server.utils import url_path_join
from jupyter_server.extension.application import ExtensionApp, ExtensionAppJinjaMixin

from ._version import __version__

from .handlers.index.handler import IndexHandler
from .handlers.config.handler import ConfigHandler


DEFAULT_STATIC_FILES_PATH = os.path.join(os.path.dirname(__file__), "./static")

DEFAULT_TEMPLATE_FILES_PATH = os.path.join(os.path.dirname(__file__), "./templates")


class DatalayerExampleExtensionApp(ExtensionAppJinjaMixin, ExtensionApp):
    """The Jupyter Dashboard Server extension."""

    name = "jupyter_dashboard"

    extension_url = "/jupyter_dashboard"

    load_other_extensions = True

    static_paths = [DEFAULT_STATIC_FILES_PATH]
    template_paths = [DEFAULT_TEMPLATE_FILES_PATH]

    config_a = Unicode("", config=True, help="Config A example.")
    config_b = Unicode("", config=True, help="Config B example.")
    config_c = Unicode("", config=True, help="Config C example.")

    def initialize_settings(self):
        self.log.debug("Jupyter Dashboard Config {}".format(self.config))

    def initialize_templates(self):
        self.serverapp.jinja_template_vars.update({"jupyter_dashboard_version" : __version__})

    def initialize_handlers(self):
        self.log.debug("Jupyter Dashboard Config {}".format(self.settings['jupyter_dashboard_jinja2_env']))
        handlers = [
            ("jupyter_dashboard", IndexHandler),
            (url_path_join("jupyter_dashboard", "config"), ConfigHandler),
        ]
        self.handlers.extend(handlers)


# -----------------------------------------------------------------------------
# Main entry point
# -----------------------------------------------------------------------------

main = launch_new_instance = DatalayerExampleExtensionApp.launch_instance

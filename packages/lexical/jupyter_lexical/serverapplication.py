# Copyright (c) 2021-2023 Datalayer, Inc.
#
# MIT License

"""The Jupyter Lexical Server application."""

import os

from traitlets import default, CInt, Instance, Unicode
from traitlets.config import Configurable

from jupyter_server.utils import url_path_join
from jupyter_server.extension.application import ExtensionApp, ExtensionAppJinjaMixin

from jupyter_lexical.__version__ import __version__

from jupyter_lexical.handlers.index.handler import IndexHandler
from jupyter_lexical.handlers.config.handler import ConfigHandler


DEFAULT_STATIC_FILES_PATH = os.path.join(os.path.dirname(__file__), "./static")

DEFAULT_TEMPLATE_FILES_PATH = os.path.join(os.path.dirname(__file__), "./templates")


class JupyterLexicalExtensionApp(ExtensionAppJinjaMixin, ExtensionApp):
    """The Jupyter Lexical Server extension."""

    name = "jupyter_lexical"

    extension_url = "/jupyter_lexical"

    load_other_extensions = True

    static_paths = [DEFAULT_STATIC_FILES_PATH]

    template_paths = [DEFAULT_TEMPLATE_FILES_PATH]


    class Launcher(Configurable):
        """Jupyter Lexical launcher configuration"""

        def to_dict(self):
            return {
                "category": self.category,
                "name": self.name,
                "icon_svg_url": self.icon_svg_url,
                "rank": self.rank,
            }

        category = Unicode(
            "",
            config=True,
            help=("Application launcher card category."),
        )

        name = Unicode(
            "Jupyter Kubernetes",
            config=True,
            help=("Application launcher card name."),
        )

        icon_svg_url = Unicode(
            None,
            allow_none=True,
            config=True,
            help=("Application launcher card icon."),
        )

        rank = CInt(
            0,
            config=True,
            help=("Application launcher card rank."),
        )

    launcher = Instance(Launcher)

    @default("launcher")
    def _default_launcher(self):
        return JupyterLexicalExtensionApp.Launcher(parent=self, config=self.config)


    def initialize_settings(self):
        self.log.debug("Jupyter Lexical Config {}".format(self.config))

    def initialize_templates(self):
        self.serverapp.jinja_template_vars.update({"jupyter_lexical_version" : __version__})

    def initialize_handlers(self):
        self.log.debug("Jupyter Lexical Config {}".format(self.settings['jupyter_lexical_jinja2_env']))
        handlers = [
            ("jupyter_lexical", IndexHandler),
            (url_path_join("jupyter_lexical", "config"), ConfigHandler),
        ]
        self.handlers.extend(handlers)


# -----------------------------------------------------------------------------
# Main entry point
# -----------------------------------------------------------------------------

main = launch_new_instance = JupyterLexicalExtensionApp.launch_instance

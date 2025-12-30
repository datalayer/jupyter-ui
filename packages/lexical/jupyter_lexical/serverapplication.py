# Copyright (c) 2021-2023 Datalayer, Inc.
#
# MIT License

"""The Jupyter Lexical Server application."""

import os

from traitlets import default, CInt, Instance, Unicode
from traitlets.config import Configurable

from jupyter_server.utils import url_path_join
from jupyter_server.extension.application import ExtensionApp, ExtensionAppJinjaMixin
from jupyter_server.base.handlers import FileFindHandler

from jupyterlab_server.config import get_page_config

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
        page_config = self.serverapp.web_app.settings.setdefault("page_config_data", {})
        page_config.update(get_page_config(
            labextensions_path=self.serverapp.web_app.settings.get("labextensions_path", []),
            logger=self.log
        ))
        httpUrl = self.serverapp.public_url.rstrip('/')
        wsUrl = httpUrl.replace('https://', 'wss://').replace('http://', 'ws://')
        fullStaticUrl = url_path_join(self.serverapp.base_url, "static", self.name)
        page_config.setdefault("token", self.serverapp.identity_provider.token)
        page_config.setdefault("baseUrl", self.serverapp.base_url)
        page_config.setdefault("httpUrl", httpUrl)
        page_config.setdefault("wsUrl", wsUrl)
        page_config.setdefault("fullStaticUrl", fullStaticUrl)
        self.serverapp.jinja_template_vars.update({
            "jupyter_lexical_version": __version__,
            "page_config": page_config,
        })

    def initialize_handlers(self):
        self.log.debug("Jupyter Lexical Config {}".format(self.settings['jupyter_lexical_jinja2_env']))
        handlers = [
            (url_path_join(self.name, "config"), ConfigHandler),
            (r"/jupyter_lexical/(.+)$", IndexHandler),
            (r"/jupyter_lexical/?", IndexHandler),
            # Serve static files at /static/jupyter_lexical/ to match vite publicPath
            (
                url_path_join("static", self.name, "(.*)"),
                FileFindHandler,
                {"path": DEFAULT_STATIC_FILES_PATH, "no_cache_paths": ["/"]},
            ),
        ]
        self.handlers.extend(handlers)


# -----------------------------------------------------------------------------
# Main entry point
# -----------------------------------------------------------------------------

main = launch_new_instance = JupyterLexicalExtensionApp.launch_instance

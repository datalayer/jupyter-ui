"""Traitlets configuration loader."""

import sys

from jupyter_core.application import JupyterApp


class ConfLoader(JupyterApp):
    """Configuration loader."""
    def __init__(self, name, path, argv):
        """Construct a loader with a name, a path and argv."""
        super(JupyterApp, self).__init__()
        self.name = name
        self.config_dir = str(path)
        self.load_config_file()
        self.parse_command_line(argv)


def load_config(conf_name, path="."):
    """Load a configuration by name with an optional path."""
    conf = ConfLoader(conf_name, path, sys.argv)
    return conf.config

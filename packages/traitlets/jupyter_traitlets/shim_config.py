
""""""

import warnings

from jupyter_core.application import JupyterApp
from traitlets.config.loader import Config


class ConfLoader(JupyterApp):
    """Rely on the JupyterApp class hierarchy to generated a 
    well constructed configuration object based on the given name."""

    def __init__(self, name, argv):
        """"""
        self.name = name
        self.load_config_file()
        self.parse_command_line(argv)


def load_config(conf_name, argv):
    """Returns a Config object based on the given name."""
    conf = ConfLoader(conf_name, argv)
    return conf.config


def merge_notebook_configs(notebook_config_name=None, server_config_name=None, other_config_name=None, argv=None):
    """Merge the notebook, server and your extension configurations and prints warnings in case
    the notebook configuration still contains NotebookApp traits.
  
        Parameters:
            notebook_config_name (string): the name of the notebook configuration (e.g. jupyter_notebook)
            server_config_name (string): the name of the notebook configuration (e.g. servrer_notebook)
            ext_config_name (string): the name of the notebook configuration (e.g. lab)
          
        Returns:
            Config: A configuration object with the merged value."""

    notebook_config = load_config(notebook_config_name, argv)
    server_config = load_config(server_config_name, argv)
    other_config = load_config(other_config_name, argv)

    _print_warnings(notebook_config)

    merged_config = Config()
    merged_config.ServerApp = notebook_config.NotebookApp
    merged_config.merge(notebook_config)
    merged_config.merge(server_config)
    merged_config.merge(other_config)
    
    return merged_config


def _print_warnings(notebook_config):
    """Print warnings if the notebooik_config still contains traits."""
    deprecated = list(notebook_config.NotebookApp.keys())
    if deprecated:
        print("==============================================================================================")
        print("You are using NotebookApp settings that will be deprecated at the next major notebook release.")
        print("Please migrate following settings from NotebookApp to ServerApp:")
        print("  {}".format(deprecated))
        print("Read more on https://jupyter-server.readthedocs.io/en/latest/migrate-from-notebook.html")
        print("==============================================================================================")
        warnings.warn(
            "NotebookApp configuration is deprecated. Migrate them to ServerApp",
            DeprecationWarning, stacklevel=2,
        )

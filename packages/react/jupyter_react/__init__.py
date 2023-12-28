# Copyright (c) 2021-2023 Datalayer, Inc.
#
# MIT License

from typing import Any, Dict, List

from ._version import __version__
from .serverapplication import JupyterReactExtensionApp


def _jupyter_server_extension_points() -> List[Dict[str, Any]]:
    return [{
        "module": "jupyter_react",
        "app": JupyterReactExtensionApp,
    }]


def _jupyter_labextension_paths() -> List[Dict[str, str]]:
    return [{
        "src": "labextension",
        "dest": "@datalayer/jupyter-react"
    }]

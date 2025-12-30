# Copyright (c) 2021-2023 Datalayer, Inc.
#
# MIT License

from typing import Any, Dict, List

from .__version__ import __version__
from .serverapplication import JupyterLexicalExtensionApp


def _jupyter_server_extension_points() -> List[Dict[str, Any]]:
    return [{
        "module": "jupyter_lexical",
        "app": JupyterLexicalExtensionApp,
    }]

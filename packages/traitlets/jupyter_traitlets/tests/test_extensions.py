"""Test extensions."""

from jupyter_server.extension.application import ExtensionApp
from jupyter_server.extension.serverextension import _get_extmanager_for_context


def test_extensions_loading():
    """Test the extensions loading."""
    extensions = {}
    configurations = (
        {"user": True, "sys_prefix": True},
        {"user": True, "sys_prefix": False},
        {"user": False, "sys_prefix": True},
        {"user": False, "sys_prefix": False}
    )
    for option in configurations:
        _, ext_manager = _get_extmanager_for_context(**option)
        for extname, extapps in ext_manager.extension_apps.items():
            print(f"{extname} {extapps}")
            for extapp in extapps:
                if isinstance(extapp, ExtensionApp):
                    extensions[extname] = extapp
    print(extensions)

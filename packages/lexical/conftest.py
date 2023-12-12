# Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
#
# MIT License

import pytest

pytest_plugins = ("jupyter_server.pytest_plugin", )


@pytest.fixture
def jp_server_config(jp_server_config):
    return {"ServerApp": {"jpserver_extensions": {"jupyter_lexical": True}}}

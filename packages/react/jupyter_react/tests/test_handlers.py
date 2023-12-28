# Copyright (c) 2021-2023 Datalayer, Inc.
#
# MIT License

import json

from .._version import __version__


async def test_config(jp_fetch):
    # When
    response = await jp_fetch("jupyter_react", "get_example")
    # Then
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == {
        "extension": "jupyter_react",
        "version": __version__
    }

# Copyright (c) 2021-2023 Datalayer, Inc.
#
# MIT License

import json


async def test_get_example(jp_fetch):
    # When
    response = await jp_fetch("jupyter_lexical", "get_example")

    # Then
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == {
        "data": "This is /jupyter_lexical/get_example endpoint!"
    }
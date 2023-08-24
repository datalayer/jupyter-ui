import json

from .._version import __version__


async def test_config(jp_fetch):
    # When
    response = await jp_fetch("jupyter_dashboard", "config")
    # Then
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == {
        "extension": "jupyter_dashboard",
        "version": __version__
    }

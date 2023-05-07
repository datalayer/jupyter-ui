import json


async def test_get_example(jp_fetch):
    # When
    response = await jp_fetch("jupyter_ux", "get_example")

    # Then
    assert response.code == 200
    payload = json.loads(response.body)
    print(payload)
    assert payload == {
        "data": "This is /jupyter_ux/get_example endpoint!"
    }
"""Test genson."""

import json

from genson import SchemaBuilder


def test_genson():
    """Test genson."""
    builder = SchemaBuilder()
    builder.add_object({"hi": "there"})
    builder.add_schema({"type": "object", "properties": { "hello": {"type": "string", "default": "world", "maxLength": 9} }})
    builder.add_schema({"type": "object", "properties": { "counter": {"type": "integer", "title": "The Counter", "default": 3} }})
    schema = builder.to_schema()
    schema["required"] = ["hi"]
    schema_str = json.dumps(schema, indent=2)
    print(schema_str)

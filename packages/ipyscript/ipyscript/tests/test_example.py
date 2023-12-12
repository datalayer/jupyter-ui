#!/usr/bin/env python
# coding: utf-8
# Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
#
# MIT License


# Copyright (c) Datalayer.
# Distributed under the terms of the Modified BSD License.

import pytest

from ..example import ExampleWidget


def test_example_creation_blank():
    w = ExampleWidget()
    assert w.value == 'Hello World'

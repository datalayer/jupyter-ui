#!/usr/bin/env python
# coding: utf-8
# Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
#
# MIT License


# Copyright (c) Datalayer.
# Distributed under the terms of the Modified BSD License.


def test_nbextension_path():
    # Check that magic function can be imported from package root:
    from ipyreactive import _jupyter_nbextension_paths
    # Ensure that it can be called without incident:
    path = _jupyter_nbextension_paths()
    # Some sanity checks:
    assert len(path) == 1
    assert isinstance(path[0], dict)

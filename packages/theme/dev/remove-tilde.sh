#!/usr/bin/env bash
# Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
#
# MIT License


find ./node_modules/\@jupyterlab -name "*.*" -exec sed -ie "s|url('~|url('|g" {} \;
find ./node_modules/\@lumino -name "*.*" -exec sed -ie "s|url('~|url('|g" {} \;

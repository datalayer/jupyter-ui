#!/usr/bin/env bash

find ./node_modules/\@blueprintjs -name "*.*" -exec sed -ie "s|url('~|url('|g" {} \;
find ./node_modules/\@jupyterlab -name "*.*" -exec sed -ie "s|url('~|url('|g" {} \;
find ./node_modules/\@lumino -name "*.*" -exec sed -ie "s|url('~|url('|g" {} \;

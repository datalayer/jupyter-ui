#!/usr/bin/env bash

# Copyright (c) Datalayer, Inc. https://datalayer.io
# Distributed under the terms of the MIT License.

python main.py \
  --ip=0.0.0.0 \
  --ServerApp.port=8686 \
  --ServerApp.token=60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6 \
  --ServerApp.base_url='example' \
  --ServerApp.allow_origin='*' \
  --ServerApp.disable_check_xsrf=True \
  --LabApp.collaborative=True \
  --no-browser

# function kill {
#   pkill -f "bash ./start-jupyter.sh"
# }
# trap kill EXIT

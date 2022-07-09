#!/usr/bin/env bash

# Copyright (c) Datalayer, Inc. https://datalayer.io
# Distributed under the terms of the MIT License.

echo -e "\x1b[34m\x1b[43mStarting Jupyter Server\x1b[0m"
echo

export CURR_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

source $(conda info --base)/etc/profile.d/conda.sh
conda activate jupyter-react
jupyter server \
  --config=${CURR_DIR}/../config/jupyter_server_config.py

#!/usr/bin/env bash

# Copyright (c) Datalayer, Inc. https://datalayer.io
# Distributed under the terms of the MIT License.

# pkill -f "jupyter" || true
# pkill -f "python main.py" || true
# pkill -f "bash ./start-jupyter-server.sh authenticated" || true

function killport() {
    lsof -i TCP:$1 | grep LISTEN | awk '{print $2}' | xargs kill -9
}

# killport 8686

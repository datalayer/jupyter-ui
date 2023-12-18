#!/usr/bin/env bash
# Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
#
# MIT License


# Copyright (c) Datalayer, Inc. https://datalayer.io
# Distributed under the terms of the MIT License.

uname_out="$(uname -s)"

case "${uname_out}" in
    Linux*)     export OS=LINUX;;
    Darwin*)    export OS=MACOS;;
#    CYGWIN*)    OS=CYGWIND;;
#    MINGW*)     OS=MINGW;;
    *)          export OS="UNSUPPORTED:${unameOut}"
esac

function kill_port() {
    case "${OS}" in
        LINUX)     fuser -k $1/tcp;;
        MACOS)     lsof -i TCP:$1 | grep LISTEN | awk '{print $2}' | xargs kill -9;;
        *)         echo "Unsupported operating system ${OS}"
    esac    
}

kill_port 3208
kill_port 8686
kill_port 8888


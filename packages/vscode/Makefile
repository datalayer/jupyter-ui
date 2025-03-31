# Copyright (c) 2021-2023 Datalayer, Inc.
#
# MIT License

SHELL=/bin/bash

.PHONY: help

help: ## display this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

default: help ## default target is help

watch: ## watch
	npm run watch

package: ## package
	npm run package

vsix: ## vsix
	npm run vsix

jupyter-server: ## start the jupyter server
	./../../dev/sh/kill.sh || true
	cd ./../../dev/sh && ./start-jupyter-server.sh

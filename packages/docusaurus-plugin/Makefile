# Copyright (c) 2021-2023 Datalayer, Inc.
#
# MIT License

# Copyright (c) Datalayer, Inc. https://datalayer.io
# Distributed under the terms of the MIT License.

SHELL=/bin/bash

CONDA=source $$(conda info --base)/etc/profile.d/conda.sh
CONDA_ACTIVATE=source $$(conda info --base)/etc/profile.d/conda.sh ; conda activate
CONDA_DEACTIVATE=source $$(conda info --base)/etc/profile.d/conda.sh ; conda deactivate
CONDA_REMOVE=source $$(conda info --base)/etc/profile.d/conda.sh ; conda remove -y --all -n

ENV_NAME=datalayer

.PHONY: help typedoc typedoc-publish

help: ## display this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

default: help ## default target is help

clean: ## clean
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
		npm run clean )

build: ## build
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
		npm run build )

build-prod: ## build-prod
	git clean -fdx
	python -m build

publish: clean build ## publish
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
		npm publish )
	echo open https://www.npmjs.com/package/@datalayer/jupyter-docusaurus-plugin

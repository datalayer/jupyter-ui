# Copyright (c) Datalayer, Inc. https://datalayer.io
# Distributed under the terms of the MIT License.

SHELL=/bin/bash

.DEFAULT_GOAL := default

CONDA_ACTIVATE=source $$(conda info --base)/etc/profile.d/conda.sh ; conda activate ; conda activate
CONDA_DEACTIVATE=source $$(conda info --base)/etc/profile.d/conda.sh ; conda deactivate
CONDA_REMOVE=source $$(conda info --base)/etc/profile.d/conda.sh ; conda remove -y --all -n

ENV_NAME=datalayer

.SILENT: init install

.PHONY: build publish

help: ## display this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

default: help ## default target is help

clean: ## clear
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
	  yarn clear )

install: ## install
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
	  yarn install )

start: ## start
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
	  yarn start )

build: ## build
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
	  yarn build )

publish: build ## publish
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
	  aws s3 cp \
		./build \
		s3://datalayer-jupyter-ui/ \
		--recursive \
		--profile datalayer && \
	  aws cloudfront create-invalidation \
		--distribution-id E1PM85T96GGH8P \
		--paths "/*" \
		--profile datalayer && \
	echo open ✨  https://jupyter-ui.datalayer.tech )

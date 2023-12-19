# Copyright (c) Datalayer, Inc. https://datalayer.io
# Distributed under the terms of the MIT License.

SHELL=/bin/bash

.DEFAULT_GOAL := default

CONDA=source ~/.bash_profile
CONDA_ACTIVATE=eval $(micromamba shell hook --shell=bash); micromamba activate
CONDA_DEACTIVATE=micromamba deactivate
CONDA_REMOVE=micromamba remove -y --all -n

ENV_NAME=datalayer

.SILENT: init

.PHONY: build publish

help: ## display this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

default: help ## default target is help

start: ## start
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
	  yarn storybook )

build: ## build
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
	  yarn build-storybook )

publish: build ## publish to s3
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
	  aws s3 rm \
		s3://datalayer-jupyter-ui-storybook/ \
		--recursive \
		--profile datalayer && \
	  aws s3 cp \
		./storybook-static \
		s3://datalayer-jupyter-ui-storybook/ \
		--recursive \
		--profile datalayer && \
	  aws cloudfront create-invalidation \
		--distribution-id E1FS3TTXFD6GQX \
		--paths "/*" \
		--profile datalayer && \
	echo open ✨ https://jupyter-ui-storybook.datalayer.tech )

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

.PHONY: help

help: ## display this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

default: help ## default target is help

start-storybook: ## start-storybook
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
	  npm storybook )

build-storybook: ## build-storybook
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
	  npm run build:storybook )

deploy: build-storybook ## publish to s3
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
		mkdir -p ./storybook-static/api/contents && \
		cp ./storybook-static/pypi/all.json ./storybook-static/api/contents/all.json && \
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

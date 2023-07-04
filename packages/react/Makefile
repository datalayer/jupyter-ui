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
		yarn clean )

build: ## build
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
		yarn build )

publish: clean build ## publish
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
		npm publish )
	echo open https://www.npmjs.com/package/@datalayer/jupyter-react

typedoc: ## generate typedoc
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
		rm -fr typedoc && \
		yarn typedoc --tsconfig ./tsconfig.json && \
		open typedoc/index.html )

publish-typedoc: typedoc ## deploy typedoc
	aws s3 rm \
		s3://datalayer-typedoc/datalayer/jupyter-react/0.5.0/ \
		--recursive \
		--profile datalayer
	aws s3 cp \
		typedoc \
		s3://datalayer-typedoc/datalayer/jupyter-react/0.5.0/ \
		--recursive \
		--profile datalayer
	aws cloudfront create-invalidation \
		--distribution-id E1CPG9FNSQJESH \
		--paths /datalayer/jupyter-react/0.3.0/ \
		--profile datalayer
	echo open ✨  https://typedoc.datalayer.tech/datalayer/jupyter-react/0.5.0

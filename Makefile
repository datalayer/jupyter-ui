# Copyright (c) Datalayer, Inc. https://datalayer.io
# Distributed under the terms of the MIT License.

SHELL=/bin/bash

CONDA=source $$(conda info --base)/etc/profile.d/conda.sh
CONDA_ACTIVATE=source $$(conda info --base)/etc/profile.d/conda.sh ; conda activate ; conda activate
CONDA_DEACTIVATE=source $$(conda info --base)/etc/profile.d/conda.sh ; conda deactivate
CONDA_REMOVE=source $$(conda info --base)/etc/profile.d/conda.sh ; conda remove -y --all -n

ENV_NAME=jupyter-react

.PHONY: help typedoc

default: help ## default target is help

all: clean install build

build: ## build all modules
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
		yarn build )

kill: ## kill
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
		yarn kill )

start: ## start
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
		yarn start )

publihs: ## publish
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
		npm publish )
	echo open https://www.npmjs.com/package/@datalayer/jupyter-react

clean: ## deletes node_modules, lib, build... folders and other generated info, lock, log... files
	find . -name node_modules | xargs rm -fr {} || true
	find . -name dist | xargs rm -fr {} || true
	find . -name lib | xargs rm -fr {} || true
	find . -name build | xargs rm -fr {} || true
	find . -name yarn.lock | xargs rm {} || true
	find . -name yarn-error.log | xargs rm {} || true
	find . -name tsconfig.tsbuildinfo | xargs rm {} || true

help: ## display this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

env-rm: ## create a conda environment
	($(CONDA); \
		conda deactivate && \
			conda remove -y --all -n ${ENV_NAME} )

env: ## create a conda environment
	($(CONDA); \
		conda env create -f environment.yml )

install: ## Install yarn dependencies and link the theme from the storybook
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
		yarn && \
		rm -fr */node_modules/react && \
		rm -fr */node_modules/react-dom && \
		rm -fr */*/node_modules/react && \
		rm -fr */*/node_modules/react-dom && \
		echo "The following sed is tested on MacOS - For other OS, you may need to fix the widget.d.ts file manually" \
		sed -i.bu "s|showDoc: boolean \| null|showDoc: boolean|g" node_modules/\@jupyterlab/completer/lib/widget.d.ts )

typedoc: ## generate typedoc
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
		yarn typedoc --tsconfig ./tsconfig.json && \
		open typedoc/index.html )

typedoc-deploy: ## deploy typedoc
	aws s3 rm \
		s3://datalayer-typedoc/datalayer/jupyter-react/0.0.2/ \
		--recursive \
		--profile datalayer
	aws s3 cp \
		typedoc \
		s3://datalayer-typedoc/datalayer/jupyter-react/0.0.2/ \
		--recursive \
		--profile datalayer
	echo open ✨  https://typedoc.datalayer.io/datalayer/jupyter-react/0.0.2

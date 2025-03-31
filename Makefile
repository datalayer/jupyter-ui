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

all: clean install build publish

build: ## build all modules
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
		npm run build )

kill: ## kill
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
		./dev/sh/kill.sh )

start: ## start
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
		npm run start )

clean: ## deletes node_modules, lib, build... folders and other generated info, lock, log... files
	find . -name node_modules | xargs rm -fr {} || true
	find . -name dist | xargs rm -fr {} || true
	find . -name lib | xargs rm -fr {} || true
	find . -name build | xargs rm -fr {} || true
	find . -name yarn.lock | xargs rm {} || true
	find . -name yarn-error.log | xargs rm {} || true
	find . -name tsconfig.tsbuildinfo | xargs rm {} || true

env-rm: ## create a conda environment
	($(CONDA); \
		conda deactivate && \
			conda remove -y --all -n ${ENV_NAME} )

env: ## create a conda environment 
	($(CONDA); \
		conda env create -f environment.yml )

install: ## install npm dependencies
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
		npm )

start-jupyter-server: ## start the jupyter server
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
		./dev/sh/kill.sh || true )
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
		cd ./dev/sh && ./start-jupyter-server.sh )

define release_package
	echo $1
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
		cd $1 && rm tsconfig.tsbuildinfo && npm run build && npm publish --access public )
endef

publish: # publish the npm packages
	@exec $(call release_package,packages/react)

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
		yarn build )

kill: ## kill
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
		./dev/sh/kill-jupyter-server.sh && \
		./dev/sh/kill-webpack.sh )

start: ## start
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
		yarn start )

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
		yarn )
	echo "Temporary fixes tested on MacOS. For other OS, you may need to fix manually..."
	sed -i.bu "s|get changed(): ISignal<this, T>;|get changed(): ISignal<this, any>;|g" node_modules/\@jupyterlab/shared-models/lib/ymodels.d.ts

start-jupyter-server: ## start the jupyter server
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
		./dev/sh/kill-jupyter-server.sh || true )
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
		cd ./dev/sh && ./start-jupyter-server.sh )

define release_package
	echo $1
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
		cd $1 && rm tsconfig.tsbuildinfo && yarn build && npm publish --access public )
endef

publish: # publish the npm packages
	@exec $(call release_package,patches/jupyterlite-settings)
	@exec $(call release_package,patches/jupyterlite-session)
	@exec $(call release_package,patches/jupyterlite-server)
	@exec $(call release_package,patches/jupyterlite-server-extension)
	@exec $(call release_package,patches/jupyterlite-kernel)
	@exec $(call release_package,patches/jupyterlite-ipykernel)
	@exec $(call release_package,patches/jupyterlite-ipykernel-extension)
	@exec $(call release_package,packages/react)

# Copyright (c) Datalayer, Inc. https://datalayer.io
# Distributed under the terms of the MIT License.

SHELL=/bin/bash

CONDA=source $$(conda info --base)/etc/profile.d/conda.sh
CONDA_ACTIVATE=source $$(conda info --base)/etc/profile.d/conda.sh ; conda activate
CONDA_DEACTIVATE=source $$(conda info --base)/etc/profile.d/conda.sh ; conda deactivate
CONDA_REMOVE=source $$(conda info --base)/etc/profile.d/conda.sh ; conda remove -y --all -n

ENV_NAME=datalayer

.DEFAULT_GOAL := default

.SILENT: init

.PHONY: port-forward storybook

help: ## display this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

default: help ## default target is help

clean: ui-clean services-clean ## clean

install: ui-install services-install ## install

build: ui-build services-build ## build

backend: services-clean services-build services-install ## api

services-clean: ## services-clean
	find . -name *.egg-info | xargs rm -fr {} || true
	find . -name __pycache__ | xargs rm -fr {} || true
	find . -name dist | xargs rm -fr {} || true

services-install: ## services-install
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
	  ./../bin/dla env-dev plane )

services-build: ## services-build
	echo Done.

env: warning ## env
	($(CONDA); \
		SLUGIFY_USES_TEXT_UNIDECODE=yes conda env create -n datalayer -f ${DLAHOME}/src/environment.yml )
	@exec echo "You can now populate the datalayer environment."
	@exec echo "-------------------------------------------------------"
	@exec echo "conda activate datalayer"
	@exec echo "make env-dev"
	@exec echo "-------------------------------------------------------"

define init_ext
	@exec echo
	@exec echo -----------------------
	@exec echo ${DLAHOME}/src/${2}
	@exec echo
	cd ${DLAHOME}/src/${2} && \
		git init || true && \
		git checkout -b main || true && \
		git remote add origin https://github.com/datalayer/${1}.git || true && \
		git add -A || true && \
		git commit -am "big bang" || true && \
		git push origin main
endef

env-dev: ## env-dev
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
		./../bin/dla env-dev all )

env-rm: warning ## env-rm
	($(CONDA); \
		conda deactivate && \
		conda remove -y --name ${ENV_NAME} --all || true )

env-status: ## env-status
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
		./../bin/dla env-status )

kill:
	./dev/sh/kill-jupyter-server.sh
	./dev/sh/kill-webpack.sh

warning:
	echo "\x1b[34m\x1b[43mEnsure you have run \x1b[1;37m\x1b[41m conda deactivate \x1b[22m\x1b[34m\x1b[43m before invoking this.\x1b[0m"

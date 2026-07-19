# Copyright (c) 2021-Present Datalayer, Inc.
#
# MIT License

# Copyright (c) Datalayer, Inc. https://datalayer.io
# Distributed under the terms of the MIT License.

SHELL=/bin/bash

ENV_NAME=datalayer

.PHONY: help typedoc typedoc-publish

help: ## display this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

default: help ## default target is help

clean: ## clean
	($(CONDA_ACTIVATE) ${ENV_NAME}; \
		npm run clean )

build: ## build
	npm run build

build-prod: ## build-prod
	git clean -fdx
	python -m build

examples: ## examples
	npm run start:webpack

publish-npm: clean build ## publish-npm
	npm publish
	echo open https://www.npmjs.com/package/@datalayer/jupyter-lexical

typedoc: ## generate typedoc
	rm -fr typedoc && \
	npm run typedoc --tsconfig ./tsconfig.json && \
	open typedoc/index.html

typedoc-publish: typedoc ## publish typedoc
	aws s3 rm \
		s3://datalayer-typedoc/datalayer/jupyter-lexical/0.0.1/ \
		--recursive \
		--profile datalayer
	aws s3 cp \
		typedoc \
		s3://datalayer-typedoc/datalayer/jupyter-lexical/0.0.1/ \
		--recursive \
		--profile datalayer
	aws cloudfront create-invalidation \
		--distribution-id E1CPG9FNSQJESH \
		--paths "/*" \
		--profile datalayer
	echo open ✨  https://typedoc.datalayer.tech/datalayer/jupyter-lexical/0.1.1

publish-pypi: # publish the pypi package
	git clean -fdx && \
		python -m build
	@exec echo
	@exec echo twine upload ./dist/*-py3-none-any.whl
	@exec echo
	@exec echo https://pypi.org/project/jupyter-lexical/#history

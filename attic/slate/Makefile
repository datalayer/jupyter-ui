# Copyright (c) 2021-2023 Datalayer, Inc.
#
# MIT License

# Copyright (c) Datalayer, Inc. https://datalayer.io
# Distributed under the terms of the MIT License.

SHELL=/bin/bash

.PHONY: typedoc typedoc-deploy

all: typedoc typedoc-deploy

typedoc: ## generated typedoc
	npm run typedoc

typedoc-deploy: ## deploy typedoc
	aws s3 cp \
		typedoc \
		s3://datalayer-typedoc/datalayer-jupyter/0.0.4/editor/ \
		--recursive \
		--profile datalayer
	echo open ✨  https://typedoc.datalayer.io/datalayer-jupyter/0.0.4/editor

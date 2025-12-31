# Copyright (c) 2021-2023 Datalayer, Inc.
#
# MIT License

SHELL=/bin/bash

CONDA=source $$(conda info --base)/etc/profile.d/conda.sh
CONDA_ACTIVATE=source $$(conda info --base)/etc/profile.d/conda.sh ; conda activate
CONDA_DEACTIVATE=source $$(conda info --base)/etc/profile.d/conda.sh ; conda deactivate
CONDA_REMOVE=source $$(conda info --base)/etc/profile.d/conda.sh ; conda remove -y --all -n

ENV_NAME=datalayer

.DEFAULT_GOAL := help

.PHONY: help
help: ## display help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Build

.PHONY: install
install: ## install dependencies
	@echo -e "\033[1;32m⚡ Installing dependencies...\033[0m"
	npm install

.PHONY: build
build: ## build the package (lib + dist)
	@echo -e "\033[1;32m🔨 Building package...\033[0m"
	npm run build

.PHONY: build-lib
build-lib: ## build TypeScript to lib/
	@echo -e "\033[1;32m📚 Building TypeScript library...\033[0m"
	npm run build:lib

.PHONY: build-dist
build-dist: ## build browser bundles to dist/
	@echo -e "\033[1;32m📦 Building browser bundles...\033[0m"
	npm run build:dist

.PHONY: build-prod
build-prod: ## clean and build production
	@echo -e "\033[1;32m🚀 Building production...\033[0m"
	npm run build:prod

.PHONY: clean
clean: ## remove build artifacts
	@echo -e "\033[1;32m🧹 Cleaning build artifacts...\033[0m"
	npm run clean

##@ Development

.PHONY: dev
dev: ## start development server
	@echo -e "\033[1;32m🔥 Starting development server...\033[0m"
	npm run dev

.PHONY: watch
watch: ## watch and rebuild TypeScript
	@echo -e "\033[1;32m👀 Watching TypeScript files...\033[0m"
	npm run watch

.PHONY: lint
lint: ## lint and fix code
	@echo -e "\033[1;32m✨ Linting code...\033[0m"
	npm run lint

.PHONY: lint-check
lint-check: ## check linting without fixing
	@echo -e "\033[1;32m🔍 Checking code style...\033[0m"
	npm run lint:check

##@ Examples

.PHONY: example
example: build ## build and serve examples
	@echo -e "\033[1;32m🌐 Building and serving examples on http://localhost:3456...\033[0m"
	@echo -e "\033[1;33m💡 Make sure you have a Jupyter server running on http://localhost:8888\033[0m"
	@echo -e "\033[1;33m   Run: jupyter lab --NotebookApp.token='test-secret' --NotebookApp.allow_origin='*'\033[0m"
	@mkdir -p examples/dist
	@cp -r dist/* examples/dist/
	npm run example

.PHONY: example-dev
example-dev: ## serve examples in development mode
	@echo -e "\033[1;32m🌐 Starting example development server...\033[0m"
	@echo -e "\033[1;33m💡 Make sure you have a Jupyter server running on http://localhost:8888\033[0m"
	npm run example:dev

.PHONY: jupyter
jupyter: ## start Jupyter server for examples
	@echo -e "\033[1;32m🪐 Starting Jupyter server...\033[0m"
	@echo -e "\033[1;33m   Server URL: http://localhost:8888\033[0m"
	@echo -e "\033[1;33m   Token: test-secret\033[0m"
	jupyter lab --NotebookApp.token='test-secret' --NotebookApp.allow_origin='*' --port=8888

.PHONY: run
run: build ## start both Jupyter server and examples (use Ctrl+C to stop both)
	@echo -e "\033[1;32m🚀 Starting Jupyter server and examples...\033[0m"
	@echo -e "\033[1;33m   Jupyter: http://localhost:8888 (token: test-secret)\033[0m"
	@echo -e "\033[1;33m   Examples: http://localhost:3456\033[0m"
	@echo -e "\033[1;33m   Press Ctrl+C to stop both servers\033[0m"
	@echo ""
	@mkdir -p examples/dist
	@cp -r dist/* examples/dist/
	@trap 'kill 0' SIGINT; \
	jupyter lab --NotebookApp.token='test-secret' --NotebookApp.allow_origin='*' --port=8888 --no-browser & \
	sleep 3 && \
	npx serve examples -p 3456 & \
	wait

##@ Testing

.PHONY: test
test: ## run tests
	@echo -e "\033[1;32m🧪 Running tests...\033[0m"
	npm run test

##@ Documentation

.PHONY: typedoc
typedoc: ## generate TypeDoc documentation
	@echo -e "\033[1;32m📖 Generating API documentation...\033[0m"
	npm run typedoc

##@ Publishing

.PHONY: publish
publish: build-prod ## publish to npm (requires auth)
	@echo -e "\033[1;32m📤 Publishing to npm...\033[0m"
	@echo -e "\033[1;33m⚠️  Make sure you're logged in: npm login\033[0m"
	npm publish

.PHONY: publish-dry
publish-dry: build-prod ## dry run publish to npm
	@echo -e "\033[1;32m📋 Dry run npm publish...\033[0m"
	npm publish --dry-run

##@ Utilities

.PHONY: preview
preview: build ## preview production build
	@echo -e "\033[1;32m🔍 Previewing production build...\033[0m"
	npm run preview

.PHONY: all
all: clean install build test ## clean, install, build, and test
	@echo -e "\033[1;32m✅ All tasks completed!\033[0m"

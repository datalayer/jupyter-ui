# Copyright (c) 2021-Present Datalayer, Inc.
#
# MIT License

SHELL=/bin/bash

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

.PHONY: build-all
build-all: build-prod ## build all formats (IIFE + ESM + Lazy chunked)
	@echo -e "\033[1;32m📦 Building ESM version...\033[0m"
	npm run build:esm
	@echo -e "\033[1;32m📦 Building Lazy chunked version...\033[0m"
	npm run build:lazy

.PHONY: build-lazy
build-lazy: ## build lazy-loading chunked version
	@echo -e "\033[1;32m📦 Building lazy-loading chunked version...\033[0m"
	npm run build:lazy

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
example: build-lazy ## build lazy and serve examples
	@echo
	@echo -e "\033[1;32m🌐 Building and serving examples on http://localhost:3456...\033[0m"
	@echo
	@echo -e "\033[1;32m🌐 Building and serving examples on http://localhost:3456/index-lazy...\033[0m"
	@echo
	@echo -e "\033[1;33m💡 Examples use hosted Jupyter server at https://prod1.datalayer.run/api/jupyter-server\033[0m"
	@echo
	@cp dist-lazy/jupyter-embed.lazy.js examples/
	@cp -r dist-lazy/chunks examples/
	npx serve examples -p 3456

.PHONY: example-dev
example-dev: ## serve examples in development mode
	@echo -e "\033[1;32m🌐 Starting example development server...\033[0m"
	@echo -e "\033[1;33m💡 Examples use hosted Jupyter server at https://prod1.datalayer.run/api/jupyter-server\033[0m"
	npm run example:dev

.PHONY: example-esm
example-esm: ## build ESM and serve chunked example
	@echo -e "\033[1;32m📦 Building ESM chunked version...\033[0m"
	npm run build:esm
	@echo -e "\033[1;32m🌐 Serving ESM example on http://localhost:3456...\033[0m"
	@echo
	@echo -e "\033[1;33m💡 Open http://localhost:3456/index-esm.html to test chunked loading\033[0m"
	@echo
	@cp -r dist-esm/* examples/
	npx serve examples -p 3456

.PHONY: example-lazy
example-lazy: ## build lazy and serve code-split example
	@echo -e "\033[1;32m📦 Building lazy-loading chunked version...\033[0m"
	npm run build:lazy
	@echo
	@echo -e "\033[1;32m🌐 Serving lazy example on http://localhost:3456...\033[0m"
	@echo
	@echo -e "\033[1;33m💡 Open http://localhost:3456/index-lazy.html to test lazy loading\033[0m"
	@echo
	@cp dist-lazy/jupyter-embed.lazy.js examples/
	@cp -r dist-lazy/chunks examples/
	npx serve examples -p 3456

.PHONY: run-lazy
run-lazy: build-lazy ## build lazy version and serve from dist-lazy
	@echo -e "\033[1;32m🚀 Serving lazy-loading version on http://localhost:3456...\033[0m"
	@echo
	@echo -e "\033[1;33m💡 Open http://localhost:3456 to test lazy loading\033[0m"
	@echo -e "\033[1;33m💡 Examples use hosted Jupyter server at https://prod1.datalayer.run/api/jupyter-server\033[0m"
	@echo
	@cp examples/index-lazy.html dist-lazy/index.html
	@sed -i 's|src="./jupyter-embed.lazy.js"|src="./jupyter-embed.lazy.js"|g' dist-lazy/index.html
	npx serve dist-lazy -p 3456

.PHONY: run
run: build ## build and serve examples
	@echo -e "\033[1;32m🚀 Building and serving examples on http://localhost:3456...\033[0m"
	@echo -e "\033[1;33m💡 Examples use hosted Jupyter server at https://prod1.datalayer.run/api/jupyter-server\033[0m"
	@cp dist/jupyter-embed.js examples/
	npx serve examples -p 3456

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

##@ Deploy

.PHONY: deploy-build
deploy-build: build-lazy ## prepare artifacts for deployment
	@echo -e "\033[1;32m📦 Preparing deployment artifacts...\033[0m"
	@rm -rf build
	@mkdir -p build
	@# Copy lazy-loading build as the main version
	@cp dist-lazy/jupyter-embed.lazy.js build/
	@cp -r dist-lazy/chunks build/
	@# Copy both example HTML files
	@cp examples/index.html build/
	@cp examples/index-lazy.html build/
	@echo -e "\033[1;32m✅ Artifacts ready in ./build\033[0m"

.PHONY: deploy
deploy: deploy-build ## build and deploy to CDN
	@echo -e "\033[1;32m🚀 Deploying to CDN...\033[0m"
	aws s3 cp \
		./build \
		s3://datalayer-jupyter-embed/ \
		--recursive \
		--profile datalayer && \
	aws cloudfront create-invalidation \
		--distribution-id E2GVE84L6ODMKY \
		--paths "/*" \
		--profile datalayer
	@echo -e "\033[1;32m✨ Deployed to https://jupyter-embed.datalayer.tech\033[0m"
	@echo -e "\033[1;32m✨ Deployed to https://jupyter-embed.datalayer.tech/index-lazy\033[0m"

##@ Utilities

.PHONY: preview
preview: build ## preview production build
	@echo -e "\033[1;32m🔍 Previewing production build...\033[0m"
	npm run preview

.PHONY: all
all: clean install build test ## clean, install, build, and test
	@echo -e "\033[1;32m✅ All tasks completed!\033[0m"

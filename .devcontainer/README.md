# Build a custom Devcontainer

You can build the Docker image removing `image` and adding `build` in the `devcontainer.json`.

```json
-	"image": "datalayer/vsc-ui-c607b5d12e1c12f7410cdc6a20c79a6bd12ffdc35082cf83557fad53f42bbcb9:latest",
	"build": {
		"dockerfile": "Dockerfile",
		"context": ".",
		"args": {
		}
	},
```

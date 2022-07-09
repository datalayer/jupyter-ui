[![Datalayer](https://assets.datalayer.design/datalayer-25.svg)](https://datalayer.io)

# Literate Notebook CSS

```bash
yarn && \
  yarn build && \
  yarn css
```

package.json

```
    "prepublishOnly": "npm test && npm run lint",
    "preversion": "npm run lint",
    "version": "npm run format && git add -A src",
    "postversion": "git push && git push --tags"
```

[![Datalayer](https://assets.datalayer.tech/datalayer-25.svg)](https://datalayer.io)

[![Become a Sponsor](https://img.shields.io/static/v1?label=Become%20a%20Sponsor&message=%E2%9D%A4&logo=GitHub&style=flat&color=1ABC9C)](https://github.com/sponsors/datalayer)

# 🪐 ⚛️ Jupyter React Vite Example

Example to run [Jupyter React](https://github.com/datalayer/jupyter-ui/tree/main/packages/react) in a [Vite.js](https://vitejs.dev) Web application.

```bash
npm i
npm run dev
```

Ensure to add the following script in the head of your HTML.

```html
    <!-- Needed for ipywidgets -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.4/require.min.js"></script>
    <script type="module">
      globalThis.__webpack_public_path__ = "";
    </script>
```

To create a production build, you first need to patch `@jupyter-widgets/controls` to avoid issues with early loadings via `require.js`.

```patch
diff --git a/node_modules/@jupyter-widgets/controls/lib/index.js b/node_modules/@jupyter-widgets/controls/lib/index.js
index 0063f69..ade0862 100644
--- a/node_modules/@jupyter-widgets/controls/lib/index.js
+++ b/node_modules/@jupyter-widgets/controls/lib/index.js
@@ -22,5 +22,5 @@ export * from './widget_tagsinput';
 export * from './widget_string';
 export * from './widget_description';
 export * from './widget_upload';
-export const version = require('../package.json').version;
+export const version = "0.1.0";
 //# sourceMappingURL=index.js.map
\ No newline at end of file
diff --git a/node_modules/@jupyter-widgets/controls/src/index.ts b/node_modules/@jupyter-widgets/controls/src/index.ts
index 912458d..5edaa11 100644
--- a/node_modules/@jupyter-widgets/controls/src/index.ts
+++ b/node_modules/@jupyter-widgets/controls/src/index.ts
@@ -24,4 +24,4 @@ export * from './widget_string';
 export * from './widget_description';
 export * from './widget_upload';
 
-export const version = (require('../package.json') as any).version;
+export const version = "5.0.12";
```

Then run the following command to build and test the artifacts in the `dist` folder.

```bash
# make run
npm run build
cd dist
python -m http.server 8675 # Or any other local server.
open http://localhost:8675
```

<div align="center" style="text-align: center">
  <img alt="Jupyter React Gallery" src="https://datalayer-jupyter-examples.s3.amazonaws.com/jupyter-react-gallery.gif" />
</div>

## ⚖️ License

Copyright (c) 2025 Datalayer, Inc.

Released under the terms of the MIT license (see [LICENSE](https://github.com/datalayer/jupyter-ui/blob/main/LICENSE).

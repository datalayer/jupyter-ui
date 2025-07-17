[![Datalayer](https://assets.datalayer.tech/datalayer-25.svg)](https://datalayer.io)

[![Become a Sponsor](https://img.shields.io/static/v1?label=Become%20a%20Sponsor&message=%E2%9D%A4&logo=GitHub&style=flat&color=1ABC9C)](https://github.com/sponsors/datalayer)

# Jupyter UI for Next.js

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

<div align="center" style="text-align: center">
  <img alt="Jupyter UI Next.js" src="https://datalayer-jupyter-examples.s3.amazonaws.com/jupyter-react-nextjs.png" />
</div>

Read more on the [documentation website](https://jupyter-ui.datalayer.tech/docs/examples/next-js) (ensure you have tne needed [development environment](https://jupyter-ui.datalayer.tech/docs/develop/setup)).

## Getting Started

First, run the development server.

```bash
npm i
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Production Build

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

You can create a static version of the application that you will find under the `out` folder.

```bash
npm run build
npm start
```

## ⚖️ License

Copyright (c) 2025 Datalayer, Inc.

Released under the terms of the MIT license (see [LICENSE](https://github.com/datalayer/jupyter-ui/blob/main/LICENSE).

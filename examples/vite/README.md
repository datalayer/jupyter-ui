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

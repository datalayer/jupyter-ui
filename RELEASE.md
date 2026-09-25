# Making a release

Releases are published by the [`release.yml`](.github/workflows/release.yml)
workflow when a `v*` tag is pushed. It publishes to npm and PyPI with trusted
publishing (OIDC): no token is stored in the repository.

## Release steps

1. Bump the versions of the packages you want to release, in a pull request:
   - npm: `version` in `packages/react/package.json` and
     `packages/lexical/package.json` (and `packages/docusaurus-plugin/package.json`
     when it changed). Update the `@datalayer/jupyter-react` and
     `@datalayer/jupyter-lexical` ranges of the packages that depend on them:
     `packages/lexical`, `packages/docusaurus-plugin`, `packages/embed`,
     `examples/*` and `storybook`.
   - PyPI: `__version__` in `packages/react/jupyter_react/__version__.py` and
     `packages/lexical/jupyter_lexical/__version__.py`.
2. Merge the pull request to `main`.
3. Tag `main` with the `@datalayer/jupyter-react` version and push the tag:

   ```bash
   git checkout main && git pull
   git tag vX.Y.Z && git push origin vX.Y.Z
   ```

   The tag must equal the `version` of `packages/react/package.json`
   (`v2.0.16` for `2.0.16`), or the workflow stops before publishing anything.

## What gets published

| Registry | Package                                | Built from                   |
| -------- | -------------------------------------- | ---------------------------- |
| npm      | `@datalayer/jupyter-react`             | `packages/react`             |
| npm      | `@datalayer/jupyter-lexical`           | `packages/lexical`           |
| npm      | `@datalayer/jupyter-docusaurus-plugin` | `packages/docusaurus-plugin` |
| PyPI     | `jupyter-react`                        | `packages/react`             |
| PyPI     | `jupyter-lexical`                      | `packages/lexical`           |

The workflow builds the repository as CI does (`npm install`, `npm run build`),
packs the npm packages with `npm pack`, and builds each Python package (sdist
and wheel) with `python -m build`, which bundles the Vite application into the
server extension.

**A package whose exact version is already published is skipped.** Only the
`@datalayer/jupyter-react` version is tied to the tag, so one tag releases
whatever was bumped, and leaves the rest alone. A re-run of the workflow for
the same tag publishes only what is still missing.

`@datalayer/jupyter-embed`, the storybook and the examples are not published.

## One-time setup

Trusted publishing needs each registry to trust this repository's workflow.

### PyPI

For each project, `jupyter-react` and `jupyter-lexical`, open
_Manage project → Publishing → Add a new publisher → GitHub_ on
[pypi.org](https://pypi.org/manage/projects/) and enter:

- Owner: `datalayer`
- Repository name: `jupyter-ui`
- Workflow name: `release.yml`
- Environment name: `pypi`

The `pypi` environment exists in the repository settings
(_Settings → Environments_). Protection rules added there, such as required
reviewers, gate every PyPI upload.

### npm

For each package, `@datalayer/jupyter-react`, `@datalayer/jupyter-lexical` and
`@datalayer/jupyter-docusaurus-plugin`, open _Settings → Trusted publishing_
on [npmjs.com](https://www.npmjs.com/) and add a GitHub Actions publisher:

- Organization or user: `datalayer`
- Repository: `jupyter-ui`
- Workflow filename: `release.yml`
- Environment: leave empty

Trusted publishing only applies to a package that already exists on npm. A new
package needs a first manual `npm publish` before it can be added here and to
the workflow's `NPM_WORKSPACES`.

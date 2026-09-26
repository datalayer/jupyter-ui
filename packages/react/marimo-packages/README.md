# marimo workspace packages

`@marimo-team/frontend` is published with three dependencies on the `workspace:*`
protocol — `@marimo-team/marimo-api`, `@marimo-team/smart-cells` and
`@marimo-team/llm-info` — which only resolve inside marimo's own pnpm monorepo:
none of the three is on npm, and npm exits without a message when it meets
them. The packages here are those three, taken from
https://github.com/marimo-team/marimo at tag `0.25.0` (`packages/openapi`,
`packages/smart-cells`, `packages/llm-info`; Apache-2.0, see LICENSE), and the
root `package.json` points the three names at them through `overrides`.
`llm-info/data/generated` is the output of its `codegen` script.

They exist so that marimo's sources compile: marimo-api is its OpenAPI client
types, smart-cells its cell-language parsers, llm-info its model catalogue.
Keep them at the version `@marimo-team/frontend` is pinned to. The frontend is
a development dependency and the bundle it builds ships in `lib/`, so a
consumer installing `@datalayer/jupyter-react` needs none of this.

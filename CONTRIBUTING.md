# How to contribute?

If you are reading this file, you have some ideas to improve this code; thanks a lot for that.

Datalayer welcomes all contributions: issue reporting, documentation improvements, bug fixes
or code enhancements.

## Development

We will focus here on the `packages/react` folder that is the corner stone of jupyter-ui; aka
providing Jupyter React components.

### Installation

To install it in dev mode, you first must install:
- [node.js](https://nodejs.org) (preferably the LTS version)

Then execute the following commands in the `packages/react` folder:

```sh
# Install npm - https://yarnpkg.com/getting-started/install
corepack enable
npm install
npm run build
```

### Code changes

The best way to test your changes is to use the storybook - a third-party tool allowing to
interact with an isolated component.  
To start it, execute

```sh
npm storybook
```

It should open a web browser tab pointing to `http://localhost:6006` in which you will
be able to pick a story in the left sidebar.

You can now change the code of the component and the storybook will get updated right
away when you save the source code.

**FAQ**:

- *No story available* for a component?  
  You can create a story for a component by adding a new file `*.stories.tsx` in the folder `packages/react/stories`.
  Hint: start by copying the file `Console.stories.tsx`

### Linting the code

The code follows some rules for format and prevent bad practices.
To check that and apply auto fixes, you must execute:

```sh
npm lint
```

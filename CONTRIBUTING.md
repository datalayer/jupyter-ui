# Contributing to Jupyter UI

Thank you for your interest in contributing to Jupyter UI! We welcome all contributions: issue reporting, documentation improvements, bug fixes, or code enhancements.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 20.0.0 (preferably the LTS version)
- **npm** >= 8.0.0
- **Python** >= 3.9 (for running Jupyter server)
- **Git** >= 2.0.0

## 🚀 Development Setup

This is a monorepo managed by Lerna with multiple packages. Here's how to get started:

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/datalayer/jupyter-ui.git
cd jupyter-ui

# Install dependencies for all packages
npm install

# Build all packages
npm run build

# Start the Jupyter server (required for development)
npm run jupyter:server
```

The Jupyter server will run on port 8686 with a predefined token for development.

## 📦 Project Structure

```
jupyter-ui/
├── packages/              # Core library packages
│   ├── react/            # Main React components (@datalayer/jupyter-react)
│   ├── lexical/          # Rich text editor (@datalayer/jupyter-lexical)
│   ├── docusaurus-plugin/# Docusaurus integration
│   └── vscode/           # VS Code extension
├── examples/             # Example implementations
│   ├── vite/            # Vite example
│   ├── next-js/         # Next.js example
│   ├── docusaurus/      # Docusaurus example
│   └── lexical/         # Lexical editor example
├── storybook/           # Component showcase and testing
├── docs/                # Documentation site
└── dev/                 # Development utilities
```

## 🛠️ Development Workflow

### 1. Working with Components

The best way to test your changes is using Storybook:

```bash
# Start Storybook (runs on http://localhost:6006)
npm run storybook
```

Storybook provides:

- Isolated component development
- Hot module replacement
- Interactive props testing
- Visual regression testing

### 2. Running Examples

Test your changes with different frameworks:

```bash
# Vite example
npm run jupyter:ui:vite

# Next.js example
npm run jupyter:ui:nextjs

# Lexical editor example
npm run jupyter:ui:lexical
```

### 3. Creating New Components

When adding a new component:

1. Create the component in `packages/react/src/components/`
2. Export it from the appropriate index file
3. Add a story in `storybook/src/stories/`
4. Add tests if applicable
5. Update documentation

Example story creation:

```tsx
// storybook/src/stories/YourComponent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { YourComponent } from '@datalayer/jupyter-react';

const meta: Meta<typeof YourComponent> = {
  title: 'Components/YourComponent',
  component: YourComponent,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // your props
  },
};
```

## 📝 Code Quality Standards

### ESLint & Prettier

We use ESLint (v9 flat config) and Prettier for code quality:

```bash
# Check for linting issues (errors only)
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting without fixing
npm run format:check
```

### TypeScript

Type checking is enforced:

```bash
# Run type checking
npm run type-check
```

### Combined Checks

For convenience, you can run all checks at once:

```bash
# Run all checks (format, lint, type-check)
npm run check

# Run all checks with auto-fix where possible
npm run check:fix
```

### Pre-commit Hooks

We use Husky and lint-staged for pre-commit checks:

- ESLint validation
- Prettier formatting
- TypeScript type checking
- Conventional commit messages

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new notebook toolbar
fix: resolve kernel connection issue
docs: update README with examples
chore: update dependencies
test: add cell component tests
```

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Storybook Tests

```bash
# Test all stories
npm run test:storybook

# Test MDX documentation
npm run test:mdx

# Run all Storybook tests
npm run test:all
```

## 📚 Documentation

### Adding Documentation

1. **Component Documentation**: Add JSDoc comments to your components
2. **Storybook Stories**: Create stories with MDX documentation
3. **API Documentation**: Update TypeDoc comments
4. **User Documentation**: Update files in `docs/` folder

### Building Documentation

```bash
# Build documentation site
cd docs
npm run build

# Start documentation dev server
npm run start
```

## 🐛 Reporting Issues

When reporting issues, please include:

1. **Description**: Clear description of the problem
2. **Reproduction**: Steps to reproduce the issue
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: Node version, OS, browser
6. **Screenshots**: If applicable

## 🚢 Submitting Pull Requests

### Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Run tests: `npm test`
5. Run code quality checks: `npm run check`
6. Commit with conventional message: `git commit -m "feat: add feature"`
7. Push to your fork: `git push origin feature/your-feature`
8. Open a Pull Request

### PR Guidelines

- **Title**: Use conventional commit format
- **Description**: Explain what and why (not how)
- **Tests**: Include tests for new features
- **Documentation**: Update relevant documentation
- **Screenshots**: Add for UI changes
- **Breaking Changes**: Clearly mark if any

### Review Process

1. CI checks must pass
2. Code review by maintainers
3. Address review feedback
4. Merge when approved

## 🔧 Troubleshooting

### Common Issues

**Dependencies Issues**

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

**Build Issues**

```bash
# Clean and rebuild
npm run clean
npm run build
```

**Jupyter Server Issues**

```bash
# Check server is running
curl http://localhost:8686/api

# Restart server
npm run jupyter:server
```

## 📬 Getting Help

- **Documentation**: https://jupyter-ui.datalayer.tech
- **Issues**: https://github.com/datalayer/jupyter-ui/issues
- **Discussions**: https://github.com/datalayer/jupyter-ui/discussions
- **Storybook**: https://jupyter-ui-storybook.datalayer.tech

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

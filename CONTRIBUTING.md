# Contributing to KALDRIX Mini-Testnet

We welcome contributions to the KALDRIX Mini-Testnet project! This document provides guidelines and instructions for contributors.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Standards](#code-standards)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Reporting Issues](#reporting-issues)
- [Feature Requests](#feature-requests)

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Python 3.7+ (for configuration scripts)
- Git

### Fork the Repository

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/blocktest.git
   cd blocktest
   ```

3. Add the original repository as upstream:
   ```bash
   git remote add upstream https://github.com/ancourn/blocktest.git
   ```

### Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a development branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. Set up your development environment:
   ```bash
   npm run dev
   ```

## Code Standards

### TypeScript Guidelines

- Use TypeScript for all new code
- Enable strict mode in `tsconfig.json`
- Provide proper type annotations
- Avoid `any` type when possible
- Use interfaces for object shapes

### JavaScript Guidelines

- Use ES6+ features
- Prefer `const` and `let` over `var`
- Use arrow functions for callbacks
- Use template literals for string interpolation
- Use destructuring for objects and arrays

### React Guidelines

- Use functional components with hooks
- Keep components small and focused
- Use TypeScript interfaces for props
- Follow the Hooks rules strictly
- Use useCallback and useMemo for performance optimization

### Naming Conventions

- **Files**: Use kebab-case for filenames (e.g., `my-component.tsx`)
- **Components**: Use PascalCase for component names (e.g., `MyComponent`)
- **Variables**: Use camelCase for variables (e.g., `myVariable`)
- **Constants**: Use UPPER_SNAKE_CASE for constants (e.g., `MAX_CONNECTIONS`)
- **Functions**: Use camelCase for functions (e.g., `calculateTPS`)
- **Classes**: Use PascalCase for classes (e.g., `BlockchainNode`)
- **Interfaces**: Use PascalCase with `I` prefix (e.g., `INodeConfig`)

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Use trailing commas in multi-line structures
- Use semicolons at the end of statements
- Keep lines under 100 characters
- Use meaningful variable and function names

### Comments

- Use JSDoc comments for functions and classes
- Use inline comments for complex logic
- Keep comments up-to-date
- Avoid obvious comments

Example:
```typescript
/**
 * Calculates transactions per second (TPS) based on transaction count and time period
 * @param transactionCount - Number of transactions processed
 * @param timePeriod - Time period in milliseconds
 * @returns TPS value rounded to 2 decimal places
 */
export function calculateTPS(transactionCount: number, timePeriod: number): number {
  if (timePeriod <= 0) return 0;
  return Math.round((transactionCount / (timePeriod / 1000)) * 100) / 100;
}
```

## Pull Request Process

### 1. Create a Branch

Create a new branch for your feature or bugfix:
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-fix-name
```

### 2. Make Changes

- Make your changes following the code standards
- Test your changes thoroughly
- Update documentation if needed
- Keep commits small and focused

### 3. Commit Your Changes

Use conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build process or auxiliary tool changes

**Examples:**
```
feat(api): add websocket endpoint for real-time metrics

fix(node): resolve memory leak in failover manager

docs(readme): update installation instructions

test(reliability): add unit tests for failure simulator
```

### 4. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 5. Create Pull Request

1. Go to the original repository on GitHub
2. Click "New Pull Request"
3. Select your branch from the dropdown
4. Fill in the PR template:
   - **Title**: Clear and descriptive
   - **Description**: Detailed explanation of changes
   - **Related Issues**: Link to any related GitHub issues
   - **Testing**: Describe how you tested your changes
   - **Breaking Changes**: Note any breaking changes
   - **Documentation**: Mention any documentation updates

### 6. Review Process

- Your PR will be reviewed by maintainers
- Address any feedback or requested changes
- Ensure all CI checks pass
- Wait for approval before merging

## Testing Guidelines

### Unit Tests

- Write unit tests for all new functions and components
- Use Jest and Vitest for testing
- Aim for high code coverage (80%+ minimum)
- Mock external dependencies

Example:
```typescript
import { calculateTPS } from './tps-calculator';

describe('calculateTPS', () => {
  it('should calculate TPS correctly', () => {
    const result = calculateTPS(1000, 1000);
    expect(result).toBe(1000);
  });

  it('should handle zero time period', () => {
    const result = calculateTPS(1000, 0);
    expect(result).toBe(0);
  });
});
```

### Integration Tests

- Test component interactions
- Test API endpoints
- Test WebSocket connections
- Use real dependencies when possible

### End-to-End Tests

- Test user workflows
- Test dashboard functionality
- Use Playwright or Cypress
- Test across different browsers

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e

# Run with coverage
npm run test:coverage
```

## Documentation

### Code Documentation

- Use JSDoc comments for all public functions
- Document parameters and return values
- Include usage examples for complex functions
- Keep documentation in sync with code changes

### README Updates

- Update README for new features
- Update installation instructions
- Update configuration examples
- Add new environment variables

### API Documentation

- Update API.md for new endpoints
- Document request/response formats
- Include example requests
- Note any breaking changes

### Guides and Tutorials

- Create step-by-step guides
- Include screenshots where helpful
- Provide code examples
- Link to related documentation

## Reporting Issues

### Bug Reports

When reporting bugs, please include:

1. **Environment Information**
   - Operating system and version
   - Node.js version
   - Browser version (if applicable)
   - KALDRIX version

2. **Bug Description**
   - Clear description of the issue
   - Expected behavior
   - Actual behavior
   - Steps to reproduce

3. **Error Messages**
   - Full error messages
   - Stack traces
   - Log files

4. **Minimal Reproducible Example**
   - Code that reproduces the issue
   - Configuration files
   - Test data

### Issue Template

```markdown
## Environment
- OS: [e.g., Ubuntu 20.04]
- Node.js: [e.g., 18.17.0]
- KALDRIX: [e.g., 1.0.0]

## Bug Description
[Clear description of the bug]

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Steps to Reproduce
1. [First step]
2. [Second step]
3. [Third step]

## Error Messages
```
[Paste error messages here]
```

## Additional Context
[Any additional information]
```

## Feature Requests

### Request Format

When requesting features, please:

1. **Use the Feature Request Template**
2. **Provide Clear Description**
   - What problem does this solve?
   - Who would benefit from this feature?
   - How would it work?

3. **Include Examples**
   - Use cases
   - Mockups or diagrams
   - Code examples

### Feature Request Template

```markdown
## Feature Description
[Clear description of the feature]

## Problem Statement
[What problem does this solve?]

## Proposed Solution
[How would this feature work?]

## Use Cases
[Who would use this and how?]

## Alternatives Considered
[What other approaches did you consider?]

## Additional Context
[Any other information]
```

## Development Workflow

### 1. Planning

- Create an issue for the feature/bug
- Discuss the approach with maintainers
- Break down large tasks into smaller ones
- Estimate effort and timeline

### 2. Development

- Create a feature branch
- Write code following standards
- Add tests for new functionality
- Update documentation

### 3. Testing

- Run all tests locally
- Test manually in different scenarios
- Check performance impact
- Verify documentation accuracy

### 4. Code Review

- Self-review your code
- Address any obvious issues
- Ensure tests pass
- Check documentation

### 5. Submission

- Create pull request
- Fill in PR template completely
- Respond to review feedback
- Make necessary revisions

### 6. Merge

- Ensure CI checks pass
- Get approval from maintainers
- Resolve any conflicts
- Merge to main branch

## Community Guidelines

### Be Respectful

- Treat everyone with respect
- Use inclusive language
- Be constructive in feedback
- Welcome newcomers

### Be Collaborative

- Work together on solutions
- Share knowledge freely
- Help others when possible
- Credit contributors appropriately

### Be Professional

- Keep discussions focused
- Stay on topic
- Use appropriate language
- Follow GitHub terms of service

## Getting Help

### Documentation

- [README](../README.md)
- [Installation Guide](./INSTALLATION.md)
- [API Documentation](./API.md)
- [Wiki](https://github.com/ancourn/blocktest/wiki)

### Community Support

- [GitHub Discussions](https://github.com/ancourn/blocktest/discussions)
- [GitHub Issues](https://github.com/ancourn/blocktest/issues)
- [Discord Server](https://discord.gg/kaldrix)

### Maintainer Contact

For urgent issues or questions, you can reach out to the maintainers:
- Create a GitHub issue with the "question" label
- Mention @maintainers in your issue
- Use Discord for real-time chat

## Recognition

Contributors will be recognized in:
- README contributors section
- Release notes
- GitHub contributors page
- Project documentation

Thank you for contributing to KALDRIX Mini-Testnet! 🚀
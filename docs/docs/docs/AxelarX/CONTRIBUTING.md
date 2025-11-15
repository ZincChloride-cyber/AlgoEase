# Contributing to AxelarX

We're thrilled that you're interested in contributing to AxelarX! This document provides guidelines and information for contributors.

## 🌟 Ways to Contribute

### Code Contributions
- **Smart Contracts**: Improve existing contracts or add new features
- **Frontend**: Enhance the user interface and experience
- **Backend Services**: Optimize indexers, relayers, and APIs
- **Testing**: Add comprehensive test coverage
- **Documentation**: Improve guides, tutorials, and API docs

### Non-Code Contributions
- **Bug Reports**: Help us identify and fix issues
- **Feature Requests**: Suggest new functionality
- **Community Support**: Help other users in Discord/forums
- **Content Creation**: Write tutorials, blog posts, or videos
- **Design**: Improve UI/UX designs and assets

## 🚀 Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/your-username/axelarx.git
cd axelarx

# Add upstream remote
git remote add upstream https://github.com/axelarx/axelarx.git
```

### 2. Set Up Development Environment

```bash
# Copy environment file
cp env.example .env.local

# Install dependencies
npm install

# Set up local Linera network
./scripts/deploy-local.sh
```

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

## 📝 Development Guidelines

### Code Style

#### Rust (Smart Contracts)
- Follow the official [Rust Style Guide](https://doc.rust-lang.org/1.0.0/style/)
- Use `cargo fmt` for formatting
- Use `cargo clippy` for linting
- Document all public functions and modules

```rust
/// Calculates the total value of an order
/// 
/// # Arguments
/// * `price` - The price per unit
/// * `quantity` - The number of units
/// 
/// # Returns
/// The total value as a fixed-point number
pub fn calculate_total(price: Price, quantity: Quantity) -> Amount {
    // Implementation
}
```

#### TypeScript/JavaScript (Frontend)
- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Use functional components with hooks
- Document complex functions with JSDoc

```typescript
/**
 * Custom hook for managing market data
 * @param symbol - Trading pair symbol (e.g., "BTC/USDT")
 * @returns Market data and loading state
 */
export function useMarketData(symbol: string): MarketDataResult {
  // Implementation
}
```

#### CSS/Styling
- Use Tailwind CSS utility classes
- Create reusable component classes in globals.css
- Follow mobile-first responsive design
- Use semantic color names from the design system

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(orderbook): add limit order cancellation
fix(trading): resolve price calculation overflow
docs(api): update GraphQL schema documentation
```

### Testing

#### Smart Contracts
```bash
# Run all contract tests
cargo test

# Run specific contract tests
cd contracts/orderbook
cargo test

# Run with coverage
cargo test --coverage
```

#### Frontend
```bash
cd frontend

# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

#### Integration Tests
```bash
# Start local network
./scripts/deploy-local.sh

# Run integration tests
npm run test:integration
```

### Documentation

- Update README.md if adding new features
- Add JSDoc/rustdoc comments for public APIs
- Update DEVELOPMENT.md for development changes
- Create tutorials for complex features

## 🔍 Pull Request Process

### 1. Before Submitting

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] Commit messages follow convention
- [ ] Branch is up to date with main

```bash
# Update your branch
git fetch upstream
git rebase upstream/main
```

### 2. Pull Request Template

Use our PR template and include:

- **Description**: What does this PR do?
- **Type**: Feature, bug fix, documentation, etc.
- **Testing**: How was this tested?
- **Screenshots**: For UI changes
- **Breaking Changes**: Any breaking changes?
- **Checklist**: Complete the provided checklist

### 3. Review Process

1. **Automated Checks**: CI/CD must pass
2. **Code Review**: At least one maintainer approval
3. **Testing**: Verify functionality works
4. **Documentation**: Ensure docs are complete

### 4. After Approval

- Maintainers will merge using "Squash and merge"
- Your contribution will be included in the next release
- You'll be added to our contributors list

## 🐛 Bug Reports

### Before Reporting

1. Search existing issues
2. Check if it's already fixed in main
3. Try to reproduce with minimal steps

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. macOS 12.0]
- Browser: [e.g. Chrome 95]
- Node.js: [e.g. 18.0.0]
- Linera CLI: [e.g. 0.1.0]

**Additional context**
Any other context about the problem.
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions you've considered.

**Additional context**
Any other context or screenshots.
```

## 🏆 Recognition

### Contributors

All contributors are recognized in:
- README.md contributors section
- Release notes
- Annual contributor highlights

### Rewards

- **First-time contributors**: Welcome package
- **Regular contributors**: Special Discord role
- **Major contributors**: Invited to contributor calls
- **Core contributors**: Governance participation

## 📞 Getting Help

### Community Channels

- **Discord**: [Join our server](https://discord.gg/axelarx)
- **GitHub Discussions**: For general questions
- **GitHub Issues**: For bugs and feature requests
- **Twitter**: [@AxelarX_io](https://twitter.com/AxelarX_io)

### Maintainer Contact

- **Technical Questions**: Discord #dev channel
- **Security Issues**: security@axelarx.io
- **Partnership**: partnerships@axelarx.io

## 📋 Contributor Checklist

### First Time Setup
- [ ] Fork and clone the repository
- [ ] Set up development environment
- [ ] Join our Discord server
- [ ] Read the development guide
- [ ] Make a test contribution

### For Each Contribution
- [ ] Create feature branch
- [ ] Write code following guidelines
- [ ] Add/update tests
- [ ] Update documentation
- [ ] Test locally
- [ ] Commit with conventional messages
- [ ] Submit pull request
- [ ] Address review feedback

## 🔒 Security

### Reporting Security Issues

**DO NOT** create public GitHub issues for security vulnerabilities.

Instead:
1. Email security@axelarx.io
2. Include detailed reproduction steps
3. Wait for acknowledgment before disclosure

### Security Guidelines

- Never commit private keys or secrets
- Use environment variables for sensitive data
- Follow smart contract security best practices
- Audit external dependencies

## 📜 Code of Conduct

### Our Pledge

We pledge to make participation in our community a harassment-free experience for everyone, regardless of age, body size, visible or invisible disability, ethnicity, sex characteristics, gender identity and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Positive behavior:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior:**
- Trolling, insulting/derogatory comments, and personal attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

### Enforcement

Community leaders are responsible for clarifying and enforcing standards of acceptable behavior and will take appropriate corrective action in response to any behavior that they deem inappropriate, threatening, offensive, or harmful.

Report violations to: conduct@axelarx.io

## 🎉 Thank You!

Thank you for contributing to AxelarX! Your efforts help build the future of decentralized finance. Every contribution, no matter how small, makes a difference.

**Happy coding!** 🚀

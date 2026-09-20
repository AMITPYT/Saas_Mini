# Contributing Guide

Thank you for considering contributing to the Mini SaaS Application!

## Development Setup

### Prerequisites

- Node.js 18 or higher
- MongoDB 6 or higher
- Redis 7 or higher
- npm or yarn

### Getting Started

1. Fork and clone the repository
2. Install dependencies:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```
3. Copy environment variables:
   ```bash
   cp .env.example .env
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```
4. Start the development servers:
   ```bash
   # Terminal 1: Backend
   cd server && npm run dev

   # Terminal 2: Frontend
   cd client && npm run dev
   ```

## Code Style

### TypeScript
- Use TypeScript for all new code
- Enable strict mode
- Define proper types for all function parameters and return values
- Avoid using `any` type

### Naming Conventions
- **Files**: kebab-case (e.g., `user-service.ts`)
- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Functions/Variables**: camelCase (e.g., `getUserById`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`)
- **Types/Interfaces**: PascalCase with prefix (e.g., `IUser`, `TUserResponse`)

### Code Organization

**Backend**:
```
src/
├── controllers/   # Request handlers
├── services/      # Business logic
├── models/        # Database models
├── routes/        # API routes
├── middlewares/   # Express middlewares
├── validators/    # Zod schemas
└── utils/         # Utility functions
```

**Frontend**:
```
src/
├── components/    # React components
├── pages/         # Page components
├── hooks/         # Custom hooks
├── store/         # Zustand stores
├── services/      # API services
├── lib/           # Utilities
└── types/         # TypeScript types
```

## Git Workflow

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates

### Commit Messages
Follow conventional commits:
```
type(scope): description

[optional body]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

Examples:
```
feat(auth): add password reset functionality
fix(board): resolve drag and drop position bug
docs(readme): update installation instructions
```

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with appropriate tests
3. Ensure all tests pass:
   ```bash
   npm test
   ```
4. Ensure code follows style guidelines:
   ```bash
   npm run lint
   ```
5. Update documentation if needed
6. Submit a pull request with:
   - Clear description of changes
   - Link to related issue (if any)
   - Screenshots for UI changes

## Testing

### Backend Tests
```bash
cd server
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm test -- --coverage   # With coverage
```

### Frontend Tests
```bash
cd client
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm test -- --coverage   # With coverage
```

### Test Requirements
- Maintain minimum 60% code coverage
- Write unit tests for all new functions
- Write integration tests for API endpoints
- Write component tests for React components

## API Guidelines

### Response Format
All API responses should follow this format:

**Success**:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error**:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]
}
```

### Error Handling
- Use the `ApiError` class for throwing errors
- Always validate input with Zod schemas
- Return appropriate HTTP status codes

## Security Guidelines

- Never commit secrets or credentials
- Use environment variables for sensitive data
- Validate and sanitize all user input
- Use parameterized queries
- Implement proper access control
- Keep dependencies updated

## Questions?

If you have questions, please:
1. Check existing documentation
2. Search closed issues
3. Open a new issue with the `question` label

Thank you for contributing!

# BugSnap API - Testing Documentation

## Overview

This project uses **Vitest** as the testing framework for unit and integration tests. The test suite covers:
- ✅ API Endpoints (Routes)
- ✅ Service Layer (Business Logic)
- ✅ Utility Functions
- ✅ Authentication Logic
- ✅ Data Validation Schemas

## Test Structure

```
apps/api/src/__tests__/
├── setup.ts                          # Test setup and global configuration
├── routes/
│   ├── auth.test.ts                  # Authentication endpoint tests
│   └── reports.test.ts               # Bug report endpoint tests
├── services/
│   ├── authService.test.ts           # Authentication service tests
│   └── reportService.test.ts         # Report service tests
└── utils/
    └── errors.test.ts                # Error utility tests

packages/shared/src/__tests__/
└── schemas.test.ts                   # Validation schema tests
```

## Running Tests

### Run all tests
```bash
npm run test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

## Coverage Thresholds

The project aims for **80% code coverage** across:
- Lines: 80%
- Functions: 80%
- Branches: 80%
- Statements: 80%

Coverage reports are generated in the `coverage/` directory and can be viewed in your browser by opening `coverage/index.html`.

## Test Categories

### 1. Validation Schema Tests
Location: `packages/shared/src/__tests__/schemas.test.ts`

Tests all Zod validation schemas including:
- Environment data schema
- Bug report creation/update schemas
- Comment schema
- Authentication schemas (register, login)
- Team schema

### 2. Error Utility Tests
Location: `apps/api/src/__tests__/utils/errors.test.ts`

Tests custom error classes:
- `AppError` (base error class)
- `ValidationError` (400)
- `UnauthorizedError` (401)
- `ForbiddenError` (403)
- `NotFoundError` (404)
- `ConflictError` (409)
- `InternalError` (500)

### 3. Authentication Service Tests
Location: `apps/api/src/__tests__/services/authService.test.ts`

Tests authentication business logic:
- User registration
- User login
- Password hashing and verification
- User profile retrieval
- Profile updates
- Password changes

### 4. Report Service Tests
Location: `apps/api/src/__tests__/services/reportService.test.ts`

Tests bug report business logic:
- Creating bug reports
- Retrieving reports by ID
- Listing reports with filters
- Updating reports
- Deleting reports
- Team access verification

### 5. Authentication Route Tests
Location: `apps/api/src/__tests__/routes/auth.test.ts`

Tests authentication API endpoints:
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user

### 6. Bug Report Route Tests
Location: `apps/api/src/__tests__/routes/reports.test.ts`

Tests bug report API endpoints:
- `POST /reports` - Create bug report
- `GET /reports/:id` - Get bug report
- `PATCH /reports/:id` - Update bug report
- `DELETE /reports/:id` - Delete bug report
- `GET /reports/teams/:teamId` - List team reports

## Test Patterns

### Mocking Prisma
```typescript
vi.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));
```

### Mocking Services
```typescript
vi.mock('../../services/authService', () => ({
  authService: {
    register: vi.fn(),
    login: vi.fn(),
    getUserById: vi.fn(),
  },
}));
```

### Testing API Endpoints
```typescript
const response = await app.inject({
  method: 'POST',
  url: '/auth/login',
  payload: {
    email: 'test@example.com',
    password: 'password123',
  },
});

expect(response.statusCode).toBe(200);
```

### Testing with Authentication
```typescript
const token = app.jwt.sign({
  id: 'user-123',
  email: 'test@example.com',
  role: 'member',
});

const response = await app.inject({
  method: 'GET',
  url: '/reports/report-123',
  headers: {
    authorization: `Bearer ${token}`,
  },
});
```

## Installation

Before running tests, ensure all dependencies are installed:

```bash
# In the apps/api directory
npm install

# This will install:
# - vitest
# - @vitest/coverage-v8
# - @types/supertest
# - supertest
```

## Configuration

The Vitest configuration is located in [`vitest.config.ts`](./vitest.config.ts):
- Uses Node.js environment
- Includes setup file for global test configuration
- Configures coverage thresholds
- Excludes non-source files from coverage

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on other tests
2. **Clear Naming**: Test names should clearly describe what is being tested
3. **AAA Pattern**: Arrange, Act, Assert
4. **Mock External Dependencies**: Mock database calls, external APIs, etc.
5. **Test Edge Cases**: Test both success and failure scenarios
6. **Keep Tests Fast**: Use mocks to avoid slow operations

## Continuous Integration

Tests should be run in CI/CD pipelines before deployment:
```bash
npm run test:coverage
```

This ensures all tests pass and coverage thresholds are met before merging code.

## Troubleshooting

### Tests failing due to missing dependencies
```bash
npm install
```

### Coverage not meeting thresholds
Run coverage report to identify gaps:
```bash
npm run test:coverage
```

### Database connection errors
Ensure test environment variables are set in the setup file.

## Future Improvements

- [ ] Add integration tests with test database
- [ ] Add E2E tests
- [ ] Add performance tests
- [ ] Implement test data factories
- [ ] Add API contract tests
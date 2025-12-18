# Integration Testing Documentation

This document describes the integration testing setup for the Ticket-Sell Next.js project, following patterns from the STQA codes repository.

## Reference Source

The integration tests are implemented based on patterns from:
- **GitHub Repository**: [FrostyVin/stqa_codes](https://github.com/FrostyVin/stqa_codes)
- **Modules 02-09**: Test fixtures, factories, mocking, TDD, and BDD patterns

## Test Structure

```
__tests__/
├── integration/
│   ├── fixtures/
│   │   └── testData.ts          # Test data and factories
│   ├── adminActions.integration.test.ts
│   ├── authFlow.integration.test.ts
│   ├── concertCrud.integration.test.ts
│   ├── orderManagement.integration.test.ts
│   ├── signupApi.integration.test.ts
│   └── userManagement.integration.test.ts
├── createOrderAction.test.ts     # Existing unit tests
├── factories.ts                  # Existing factories
├── ForgotPasswordForm.test.tsx
├── LoginForm.test.tsx
└── UserList.test.tsx
```

## Testing Patterns Used

### 1. Test Fixtures (from 03_test_fixtures_coverage)

```typescript
// Load test data
export const CONCERT_DATA = [
  { title: "Rock Night 2025", ... },
  { title: "Jazz Evening", ... },
];

// Setup/Teardown pattern
beforeAll(() => { /* Connect to test database */ });
afterAll(() => { /* Cleanup */ });
beforeEach(() => { /* Reset state */ });
afterEach(() => { /* Clear mocks */ });
```

### 2. Factories and Fakes (from 04_factories_and_fakes)

```typescript
// Factory functions for creating test data
export function buildConcert(overrides = {}): Concert {
  return {
    id: `concert-${idCounter++}`,
    title: "Default Concert",
    // ... default values
    ...overrides,
  };
}

// Usage in tests
const concert = buildConcert({ available_tickets: 0 });
```

### 3. Mocking Objects (from 05_mocking_objects)

```typescript
// Mock external dependencies
jest.mock("@/app/lib/supabaseServer", () => ({
  supabaseServer: {
    from: jest.fn(),
    // ... mock implementation
  },
}));

// Mock authentication
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));
```

### 4. TDD Case Study Pattern (from 06_TDD_case_study)

```typescript
// CRUD operation tests following REST patterns
describe("createConcert", () => {
  it("should create and return 201", async () => {
    // Arrange
    const data = CONCERT_DATA[0];
    
    // Act
    await createConcert(data);
    
    // Assert
    expect(mockInsert).toHaveBeenCalledWith(data);
  });
});
```

### 5. BDD with Behave Pattern (from 07_BDD_behave)

```typescript
describe("Scenario: User purchases concert tickets", () => {
  /**
   * Given I am logged in as a user
   * And a concert with available tickets exists
   * When I create an order for tickets
   * Then the order should be created
   * And the available tickets should be decremented
   */
  it("should create order when user is authenticated", async () => {
    // Given
    mockSession.mockResolvedValue(MOCK_USER_SESSION);
    
    // When
    const result = await createOrderAction(concertId, 2);
    
    // Then
    expect(result.status).toBe("success");
  });
});
```

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### With Coverage Report
```bash
npm run test:coverage
```

### Watch Mode (Development)
```bash
npm run test:watch
```

### Verbose Output
```bash
npm run test:verbose
```

## Test Categories

### Unit Tests (`__tests__/*.test.ts`)
- Component rendering tests
- Isolated function tests
- UI interaction tests

### Integration Tests (`__tests__/integration/*.test.ts`)
- Server action tests
- API route tests
- Database interaction tests (mocked)
- Authentication flow tests
- Multi-component workflow tests

## Mock Session Examples

```typescript
// Regular user session
export const MOCK_USER_SESSION = {
  user: {
    id: "user-1",
    email: "user@example.com",
    role: "user",
  },
};

// Admin session
export const MOCK_ADMIN_SESSION = {
  user: {
    id: "admin-1",
    email: "admin@example.com",
    role: "admin",
  },
};
```

## Coverage Requirements

The project has the following coverage thresholds configured:

| Metric     | Threshold |
|------------|-----------|
| Branches   | 50%       |
| Functions  | 50%       |
| Lines      | 50%       |
| Statements | 50%       |

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Clear Naming**: Use descriptive test names that explain the scenario
3. **Setup/Teardown**: Use beforeEach/afterEach to reset state
4. **Mocking**: Mock external dependencies to ensure predictable behavior
5. **BDD Style**: Use Given/When/Then comments to document scenarios
6. **Factory Pattern**: Use factories to create test data with sensible defaults

## Adding New Tests

1. Create test file in `__tests__/integration/` folder
2. Import fixtures from `./fixtures/testData`
3. Setup mocks for external dependencies
4. Follow BDD pattern for test scenarios
5. Run tests to verify they pass

## Troubleshooting

### Tests timing out
- Ensure mocks are properly configured
- Check for unresolved promises

### Mock not working
- Verify jest.mock() is at the top of the file
- Check mock path matches import path

### Coverage not increasing
- Verify file is included in collectCoverageFrom
- Check for untested branches/conditions

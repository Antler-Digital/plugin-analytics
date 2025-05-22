# Testing Procedures

This document outlines the testing procedures for the Payload Analytics Plugin to ensure reliable functionality and performance.

## Table of Contents

- [Testing Environment Setup](#testing-environment-setup)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Performance Testing](#performance-testing)
- [Browser Compatibility Testing](#browser-compatibility-testing)

## Testing Environment Setup

### Prerequisites

- Node.js (v18.20.2 or v20.9.0+)
- pnpm v9+
- MongoDB (for local testing)

### Setting Up the Test Environment

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/payload-plugin-analytics.git
   cd payload-plugin-analytics
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env.test
   ```

4. Modify `.env.test` with appropriate testing credentials.

## Unit Testing

We use Jest for unit testing. Unit tests focus on testing individual functions and components in isolation.

### Running Unit Tests

```bash
pnpm test
```

### Writing Unit Tests

Unit tests are located in the `src/tests` directory. Each test file should follow the naming convention of `[filename].spec.ts`.

Example unit test for a utility function:

```typescript
// src/tests/date-utils.spec.ts
import { getDateFrom } from '../utils/date-utils'

describe('getDateFrom', () => {
  it('should return correct date range for last_7_days', () => {
    const result = getDateFrom({ date_range: 'last_7_days' })
    expect(result).toHaveProperty('date_from')
    expect(result).toHaveProperty('date_change')
  })
})
```

### Component Testing

For React components, we use React Testing Library. Example:

```typescript
// src/tests/components/stat-card.spec.tsx
import { render, screen } from '@testing-library/react'
import StatCard from '../../components/ui/stat-card'

describe('StatCard', () => {
  it('renders correctly with provided props', () => {
    render(<StatCard label="Page Views" value={1000} change={5} />)
    expect(screen.getByText('Page Views')).toBeInTheDocument()
    expect(screen.getByText('1,000')).toBeInTheDocument()
    expect(screen.getByText('5%')).toBeInTheDocument()
  })
})
```

## Integration Testing

Integration tests verify that different parts of the application work together correctly.

### Running Integration Tests

```bash
pnpm test:integration
```

### Key Integration Test Scenarios

1. **Plugin Initialization**: Test that the plugin initializes correctly with Payload CMS
2. **Data Collection**: Test that analytics events are properly stored in the database
3. **Dashboard Rendering**: Test that the dashboard renders correctly with sample data
4. **API Endpoints**: Test that the API endpoints return the expected responses

## End-to-End Testing

End-to-end tests simulate real user scenarios to ensure the entire application works as expected.

### Running E2E Tests

```bash
pnpm test:e2e
```

### Key E2E Test Scenarios

1. **Page View Tracking**: Test that page views are properly tracked when navigating between pages
2. **UTM Parameter Tracking**: Test that UTM parameters are correctly captured
3. **Dashboard Visualization**: Test that the dashboard displays the correct data based on analytics events
4. **Date Range Filtering**: Test that changing the date range updates the dashboard data

## Performance Testing

Performance tests ensure that the plugin does not negatively impact the performance of the application.

### Testing Script Bundle Size

```bash
pnpm analyze
```

### Key Performance Test Scenarios

1. **Script Loading Time**: Measure the time it takes for the analytics script to load
2. **API Response Time**: Measure the response time of the analytics API endpoints
3. **Dashboard Rendering Performance**: Measure the time it takes for the dashboard to render with large datasets
4. **Memory Usage**: Monitor memory usage during high-traffic simulations

## Browser Compatibility Testing

Ensure the plugin works correctly across different browsers and devices.

### Supported Browsers

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Mobile browsers (iOS Safari, Android Chrome)

### Testing Process

1. Set up BrowserStack or similar service for cross-browser testing
2. Create test scripts for key user flows
3. Run tests on all supported browsers and devices
4. Document any browser-specific issues or workarounds

## Continuous Integration

We use GitHub Actions for continuous integration. The CI pipeline runs the following tests on each pull request:

- Linting
- Unit tests
- Integration tests
- Bundle size check
- Type checking

### CI Configuration

The CI configuration is defined in `.github/workflows/ci.yml`. The pipeline runs on every push to the main branch and on pull requests.

## Test Coverage

We aim to maintain a test coverage of at least 80% for the codebase. Coverage reports are generated during test runs:

```bash
pnpm test:coverage
```

Coverage reports can be found in the `coverage` directory after running the tests.

# payload-plugin-analytics

## 1.2.0

### Minor Changes

- c6e22fb: updated core config to handle custom collection; other bug fixes

### Patch Changes

- 874a14a: updated package json to pnpm 10

## 1.1.0

### Minor Changes

- 2ec8e58: added tests for dashboard-stats
- 2ba3187: chore: add @jest/globals dependency and update pnpm-lock.yaml for Jest 30.0.0-beta.3
- 1c44687: chore: update pnpm version to 10, add test installation step in release workflow
- ea702a8: refactor: update test commands in package.json, enhance error handling in get-dashboard-stats and get-webpage-views, and add comprehensive tests for webpage views functionality

## 1.0.56

### Patch Changes

- cebafb5: test patch update

## 1.0.55

### Patch Changes

- 589a492: Add comprehensive unit tests for dashboard statistics and fix build configuration issues

  - Added unit tests for DashboardStats class covering all major functionality
  - Fixed TypeScript build configuration to properly exclude test files
  - Fixed type error in get-webpage-views.ts for database URL handling
  - Created separate tsconfig files for development and testing
  - Tests now run without hanging and complete successfully

  Now testing the CICD bumping

- bfd23d9: CICD action update
- 09e2cec: testing version bumping

## 1.0.54

### Patch Changes

- Add comprehensive unit tests for dashboard statistics and fix build configuration issues

  - Added unit tests for DashboardStats class covering all major functionality
  - Fixed TypeScript build configuration to properly exclude test files
  - Fixed type error in get-webpage-views.ts for database URL handling
  - Created separate tsconfig files for development and testing
  - Tests now run without hanging and complete successfully

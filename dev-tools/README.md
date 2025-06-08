# Development Tools Directory

This directory contains development and testing utilities that are **not** part of the production application.

## ⚠️ Important Notes

1. **This directory is gitignored** - Nothing here will be committed to the repository
2. **For development only** - These tools should never be deployed to production
3. **Authentication tests** - Keep these isolated to avoid breaking production auth

## Directory Structure

```
dev-tools/
├── auth-tests/          # Authentication testing utilities
│   └── manual-auth-test.html
├── auth-debug/          # Debug pages for auth flow
├── oauth-debug/         # OAuth specific debugging
└── test-routes/         # Various test pages and routes
```

## Usage

### Running Auth Tests

1. Start the development server: `npm run dev`
2. Open the test files directly in your browser
3. Test authentication flows without affecting production routes

### Adding New Test Files

Feel free to add any development/debugging files here:
- Test components
- Debug pages
- Mock data generators
- Performance testing tools
- API testing utilities

## Why This Exists

We moved all test and debug files here to:
- Keep the main source directory clean
- Prevent accidental deployment of debug code
- Allow developers to create test files without cluttering git
- Maintain clear separation between production and development code

## Best Practices

1. **Never import from this directory** in production code
2. **Use environment checks** if you need conditional debug features
3. **Document your test utilities** so others can use them
4. **Clean up** old test files periodically

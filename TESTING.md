# Testing Guide for GitLens

This document provides guidelines for writing and running tests in the GitLens project.

## Table of Contents

- [Overview](#overview)
- [Test Infrastructure](#test-infrastructure)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Coverage](#test-coverage)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Overview

GitLens uses [Mocha](https://mochajs.org/) as its test framework along with Node's built-in `assert` module. The tests run in the VS Code Extension Test environment using `@vscode/test-electron`.

### Current Test Coverage

The project is actively working to improve test coverage. Priority areas include:

- **Critical**: Git parsers, core models, configuration
- **High**: Git provider service, formatters, remote providers
- **Medium**: Annotations, views, commands
- **Low**: Webviews, UI components

## Test Infrastructure

### Directory Structure

```
src/test/
├── fixtures/              # Test data and fixtures
│   └── git-output/       # Sample Git command outputs
├── helpers/              # Test utilities and mocks
│   └── mocks.ts         # Mock objects and helper functions
├── suite/               # Test suites
│   ├── git/
│   │   └── parsers/    # Git parser tests
│   ├── system/         # System utility tests
│   └── index.ts        # Test suite loader
└── runTest.ts          # Test runner configuration
```

### Dependencies

- **mocha**: Test framework
- **c8**: Code coverage tool
- **sinon**: Mocking and stubbing library
- **@vscode/test-electron**: VS Code extension test runner

## Running Tests

### Build Tests

Before running tests, you need to build them:

```bash
yarn run build:tests
```

This compiles TypeScript test files and resolves path aliases.

### Run All Tests

```bash
yarn test
```

### Run Tests with Coverage

```bash
yarn run test:coverage
```

This generates coverage reports in:
- **HTML**: `coverage/index.html` - Open in browser for detailed view
- **Text**: Terminal output with summary
- **LCOV**: `coverage/lcov.info` - For CI/CD integration

### View Coverage Report

After running tests with coverage:

```bash
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

### Watch Mode

To automatically rebuild tests when files change:

```bash
yarn run watch:tests
```

Then run tests in another terminal as needed.

## Writing Tests

### Test File Naming

- Test files should end with `.test.ts`
- Place test files in `src/test/suite/` directory
- Mirror the source directory structure

Example:
- Source: `src/git/parsers/blameParser.ts`
- Test: `src/test/suite/git/parsers/blameParser.test.ts`

### Basic Test Structure

```typescript
import * as assert from 'assert';
import { YourClass } from '../../../path/to/class';

describe('YourClass', () => {
	describe('methodName', () => {
		it('should do something specific', () => {
			const result = YourClass.methodName('input');
			assert.strictEqual(result, 'expected');
		});

		it('should handle edge case', () => {
			const result = YourClass.methodName(null);
			assert.strictEqual(result, undefined);
		});
	});
});
```

### Using Test Fixtures

Test fixtures are stored in `src/test/fixtures/` and can be loaded using the `readFixture` helper:

```typescript
import { readFixture } from '../../../helpers/mocks';

it('should parse git blame output', async () => {
	const data = await readFixture('git-output/blame-simple.txt');
	const result = Parser.parse(data);
	assert.ok(result);
});
```

### Creating Mock Objects

Use the mock helpers for common objects:

```typescript
import { createMockContainer, createMockGitUser } from '../../../helpers/mocks';

it('should work with mocked dependencies', () => {
	const container = createMockContainer();
	const user = createMockGitUser({ name: 'Test User' });
	// ... use mocks in test
});
```

### Assertions

Use Node's `assert` module with strict equality:

```typescript
import * as assert from 'assert';

// Strict equality
assert.strictEqual(actual, expected);

// Truthy/falsy
assert.ok(value);
assert.ok(!value);

// Object comparison
assert.deepStrictEqual(actualObj, expectedObj);

// Throws assertion
assert.throws(() => {
	someFunction();
}, /Expected error message/);

// Does not throw
assert.doesNotThrow(() => {
	someFunction();
});
```

### Testing Asynchronous Code

```typescript
// Using async/await
it('should handle async operations', async () => {
	const result = await asyncFunction();
	assert.strictEqual(result, 'expected');
});

// Using done callback (legacy)
it('should handle callbacks', (done) => {
	asyncFunctionWithCallback((err, result) => {
		assert.strictEqual(err, null);
		assert.strictEqual(result, 'expected');
		done();
	});
});
```

### Setup and Teardown

```typescript
describe('MyClass', () => {
	let instance: MyClass;

	// Runs before all tests in this describe block
	before(() => {
		// One-time setup
	});

	// Runs before each test
	beforeEach(() => {
		instance = new MyClass();
	});

	// Runs after each test
	afterEach(() => {
		instance = null;
	});

	// Runs after all tests in this describe block
	after(() => {
		// One-time teardown
	});

	it('should do something', () => {
		assert.ok(instance);
	});
});
```

## Test Coverage

### Coverage Goals

- **Critical components** (parsers, core models): 80-90%
- **High importance** (services, providers): 70-80%
- **Medium importance** (UI controllers): 50-60%
- **Low importance** (helpers, utilities): 30-40%

### Coverage Configuration

Coverage settings are in `.c8rc.json`:

```json
{
	"all": true,
	"src": "out",
	"exclude": [
		"out/test/**",
		"**/*.d.ts"
	],
	"lines": 70,
	"statements": 70,
	"functions": 70,
	"branches": 70
}
```

### Checking Coverage

After running `yarn run test:coverage`, check:

1. **Terminal output**: Summary of coverage percentages
2. **HTML report**: Detailed line-by-line coverage at `coverage/index.html`
3. **Uncovered lines**: Highlighted in red in the HTML report

## Best Practices

### 1. Test One Thing at a Time

```typescript
// Good
it('should return null for empty input', () => {
	assert.strictEqual(parse(''), null);
});

it('should return parsed data for valid input', () => {
	assert.ok(parse('valid'));
});

// Bad
it('should handle various inputs', () => {
	assert.strictEqual(parse(''), null);
	assert.ok(parse('valid'));
	assert.throws(() => parse(null));
});
```

### 2. Use Descriptive Test Names

```typescript
// Good
it('should extract email from angle brackets in blame output', () => {
	// ...
});

// Bad
it('should work', () => {
	// ...
});
```

### 3. Test Edge Cases

Always test:
- Empty inputs
- Null/undefined values
- Boundary conditions
- Error conditions
- Unicode/special characters

### 4. Keep Tests Independent

Tests should not depend on each other or shared state:

```typescript
// Good
describe('Parser', () => {
	it('should parse format A', () => {
		const result = Parser.parse('format-a');
		assert.ok(result);
	});

	it('should parse format B', () => {
		const result = Parser.parse('format-b');
		assert.ok(result);
	});
});

// Bad (tests share state)
describe('Parser', () => {
	let sharedResult;

	it('should parse format A', () => {
		sharedResult = Parser.parse('format-a');
	});

	it('should have correct properties', () => {
		assert.ok(sharedResult.property); // Depends on previous test!
	});
});
```

### 5. Use Fixtures for Complex Data

Don't inline large test data:

```typescript
// Good
it('should parse complex git output', async () => {
	const data = await readFixture('git-output/complex-log.txt');
	const result = Parser.parse(data);
	assert.ok(result);
});

// Bad
it('should parse complex git output', () => {
	const data = `line 1\nline 2\n...100 more lines...`;
	const result = Parser.parse(data);
	assert.ok(result);
});
```

### 6. Mock External Dependencies

Use mocks for:
- File system operations
- Network requests
- VS Code API calls
- Git command execution

```typescript
import * as sinon from 'sinon';

it('should call git command', () => {
	const gitStub = sinon.stub(git, 'execute').resolves('output');
	// ... test code
	assert.ok(gitStub.calledOnce);
	gitStub.restore();
});
```

## Examples

### Example 1: Testing a Parser

```typescript
import * as assert from 'assert';
import { GitBlameParser } from '../../../../git/parsers/blameParser';
import { readFixture, createMockContainer } from '../../../helpers/mocks';

describe('GitBlameParser', () => {
	const repoPath = '/test/repo';
	let mockContainer: any;

	beforeEach(() => {
		mockContainer = createMockContainer();
	});

	it('should return undefined for empty data', () => {
		const result = GitBlameParser.parse(mockContainer, '', repoPath, undefined);
		assert.strictEqual(result, undefined);
	});

	it('should parse simple blame output', async () => {
		const data = await readFixture('git-output/blame-simple.txt');
		const result = GitBlameParser.parse(mockContainer, data, repoPath, undefined);

		assert.ok(result);
		assert.strictEqual(result.commits.size, 1);
		assert.strictEqual(result.authors.size, 1);
	});
});
```

### Example 2: Testing a Utility Function

```typescript
import * as assert from 'assert';
import { equalsIgnoreCase } from '../../../system/string';

describe('String Utilities', () => {
	describe('equalsIgnoreCase', () => {
		it('should return true for equal strings', () => {
			assert.strictEqual(equalsIgnoreCase('test', 'test'), true);
		});

		it('should return true ignoring case', () => {
			assert.strictEqual(equalsIgnoreCase('Test', 'test'), true);
		});

		it('should handle null values', () => {
			assert.strictEqual(equalsIgnoreCase(null, null), true);
			assert.strictEqual(equalsIgnoreCase('test', null), false);
		});
	});
});
```

### Example 3: Testing with Sinon Mocks

```typescript
import * as assert from 'assert';
import * as sinon from 'sinon';
import { MyClass } from '../../../myClass';

describe('MyClass', () => {
	let sandbox: sinon.SinonSandbox;

	beforeEach(() => {
		sandbox = sinon.createSandbox();
	});

	afterEach(() => {
		sandbox.restore();
	});

	it('should call dependency method', () => {
		const dependency = { method: () => 'original' };
		const stub = sandbox.stub(dependency, 'method').returns('mocked');

		const instance = new MyClass(dependency);
		const result = instance.doSomething();

		assert.strictEqual(result, 'mocked');
		assert.ok(stub.calledOnce);
	});
});
```

## Contributing

When adding new features:

1. Write tests for new code
2. Ensure tests pass: `yarn test`
3. Check coverage: `yarn run test:coverage`
4. Aim for 70%+ coverage on new code
5. Update this document if adding new testing patterns

## Resources

- [Mocha Documentation](https://mochajs.org/)
- [Node.js Assert Documentation](https://nodejs.org/api/assert.html)
- [Sinon Documentation](https://sinonjs.org/)
- [VS Code Extension Testing](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
- [c8 Documentation](https://github.com/bcoe/c8)

## Getting Help

- Check existing tests in `src/test/suite/` for examples
- Review test fixtures in `src/test/fixtures/`
- Ask questions in pull request reviews
- Consult the [GitLens contributing guide](CONTRIBUTING.md)

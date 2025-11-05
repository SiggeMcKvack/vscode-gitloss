# PathEntryTrie Test Failures - Platform Issues

## Overview

The `src/test/suite/system/trie.test.ts` file contains 6 failing tests related to case-insensitive path operations. These failures are **pre-existing** and are caused by platform differences between Windows and Linux.

## Failing Tests

1. `PathEntryTrie Test Suite > has: repo (ignore case)`
2. `PathEntryTrie Test Suite > has: file (ignore case)`
3. `PathEntryTrie Test Suite > get: repo (ignore case)`
4. `PathEntryTrie Test Suite > get: file (ignore case)`
5. `PathEntryTrie Test Suite > getClosest: repo file (ignore case)`
6. `PathEntryTrie Test Suite > getClosest: missing path but inside repo`

## Root Cause

The tests use Windows-style paths with drive letters:
```typescript
// Example from test
'C:/Users/Name/code/gitkraken/vscode-gitlens'
```

When running on Linux:
- The uppercase `C:` doesn't match lowercase `c:`
- Path case sensitivity behaves differently
- File system operations return unexpected results

### Example Error
```
AssertionError: Expected values to be strictly equal:
+ actual - expected
+ 'C:/Users/Name/code/gitkraken/vscode-gitlens'
- 'c:/Users/Name/code/gitkraken/vscode-gitlens'
```

## Recommended Fixes

### Option 1: Platform-Aware Test Data
Update tests to use appropriate paths for the current platform:

```typescript
const isWindows = process.platform === 'win32';
const testPath = isWindows
  ? 'C:/Users/Name/code/gitkraken/vscode-gitlens'
  : '/home/user/code/gitkraken/vscode-gitlens';
```

### Option 2: Mock File System Operations
Mock the underlying file system operations to return consistent results:

```typescript
import * as path from 'path';

// Mock path operations to always use POSIX-style
sinon.stub(path, 'normalize').callsFake((p) => p.toLowerCase());
```

### Option 3: Update PathEntryTrie Implementation
Enhance `src/system/trie.ts` to handle case-insensitive operations consistently:

```typescript
// In PathEntryTrie class
constructor(private readonly caseSensitive: boolean = process.platform === 'win32') {
  // Normalize paths based on case sensitivity
}

private normalizePath(path: string): string {
  return this.caseSensitive ? path : path.toLowerCase();
}
```

### Option 4: Skip Tests on Non-Windows Platforms
Add platform checks to skip Windows-specific tests:

```typescript
(process.platform === 'win32' ? it : it.skip)('should handle case insensitive paths', () => {
  // Windows-specific test
});
```

## Implementation Steps

1. **Analyze Current Implementation**
   - Review `src/system/trie.ts` to understand current case handling
   - Check if `ignoreCase` parameter is properly implemented
   - Identify where path normalization occurs

2. **Choose Fix Strategy**
   - Option 1 is quickest but requires maintaining two test data sets
   - Option 2 provides consistent test environment but adds complexity
   - Option 3 is most robust but requires implementation changes
   - Option 4 is easiest but reduces test coverage on Linux

3. **Implement Fix**
   - Update either tests or implementation based on chosen strategy
   - Ensure all 6 failing tests pass on both Windows and Linux

4. **Test on Multiple Platforms**
   - Run tests on Windows
   - Run tests on Linux
   - Run tests on macOS
   - Verify consistent behavior

## Files to Review

- `src/test/suite/system/trie.test.ts` - Test file with failures
- `src/system/trie.ts` - PathEntryTrie implementation
- `src/system/path.ts` - Path utility functions

## Priority

**Low-Medium** - These tests were already failing before the test coverage work. They should be fixed to ensure the trie implementation works correctly across platforms, but they don't block the new test coverage additions.

## Test Execution

Current results (on Linux):
```
296 total tests
279 passing (94.3%)
17 failing
  - 6 PathEntryTrie (pre-existing)
  - 11 New test suite (being fixed)
```

Target after fixing:
```
296 total tests
285+ passing (96.3%+)
11 or fewer failing
```

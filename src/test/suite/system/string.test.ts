import * as assert from 'assert';
import {
	compareIgnoreCase,
	equalsIgnoreCase,
	compareSubstring,
	compareSubstringIgnoreCase,
} from '../../../system/string';

describe('String Utilities', () => {
	describe('compareIgnoreCase', () => {
		it('should return 0 for equal strings', () => {
			assert.strictEqual(compareIgnoreCase('test', 'test'), 0);
		});

		it('should return 0 for equal strings with different case', () => {
			assert.strictEqual(compareIgnoreCase('Test', 'test'), 0);
			assert.strictEqual(compareIgnoreCase('TEST', 'test'), 0);
			assert.strictEqual(compareIgnoreCase('TeSt', 'test'), 0);
		});

		it('should return -1 for a < b', () => {
			assert.strictEqual(compareIgnoreCase('apple', 'banana'), -1);
			assert.strictEqual(compareIgnoreCase('Apple', 'banana'), -1);
		});

		it('should return 1 for a > b', () => {
			assert.strictEqual(compareIgnoreCase('banana', 'apple'), 1);
			assert.strictEqual(compareIgnoreCase('BANANA', 'apple'), 1);
		});

		it('should handle empty strings', () => {
			assert.strictEqual(compareIgnoreCase('', ''), 0);
			assert.strictEqual(compareIgnoreCase('test', ''), 1);
			assert.strictEqual(compareIgnoreCase('', 'test'), -1);
		});

		it('should handle special characters', () => {
			assert.strictEqual(compareIgnoreCase('test-1', 'test-1'), 0);
			assert.strictEqual(compareIgnoreCase('test_1', 'test-1'), 1);
		});

		it('should handle unicode characters', () => {
			assert.strictEqual(compareIgnoreCase('café', 'café'), 0);
			assert.strictEqual(compareIgnoreCase('Café', 'café'), 0);
		});
	});

	describe('equalsIgnoreCase', () => {
		it('should return true for equal strings', () => {
			assert.strictEqual(equalsIgnoreCase('test', 'test'), true);
		});

		it('should return true for equal strings with different case', () => {
			assert.strictEqual(equalsIgnoreCase('Test', 'test'), true);
			assert.strictEqual(equalsIgnoreCase('TEST', 'test'), true);
		});

		it('should return false for different strings', () => {
			assert.strictEqual(equalsIgnoreCase('test', 'other'), false);
		});

		it('should handle null and undefined', () => {
			assert.strictEqual(equalsIgnoreCase(null, null), true);
			assert.strictEqual(equalsIgnoreCase(undefined, undefined), true);
			assert.strictEqual(equalsIgnoreCase(null, undefined), true);
			assert.strictEqual(equalsIgnoreCase('test', null), false);
			assert.strictEqual(equalsIgnoreCase(null, 'test'), false);
			assert.strictEqual(equalsIgnoreCase('test', undefined), false);
			assert.strictEqual(equalsIgnoreCase(undefined, 'test'), false);
		});

		it('should handle empty strings', () => {
			assert.strictEqual(equalsIgnoreCase('', ''), true);
			assert.strictEqual(equalsIgnoreCase('test', ''), false);
		});
	});

	describe('compareSubstring', () => {
		it('should compare full strings when no bounds specified', () => {
			assert.strictEqual(compareSubstring('abc', 'abc'), 0);
			assert.strictEqual(compareSubstring('abc', 'def'), -1);
			assert.strictEqual(compareSubstring('def', 'abc'), 1);
		});

		it('should compare substrings with start and end positions', () => {
			// Compare 'bc' from 'abc' with 'bc' from 'xbc'
			assert.strictEqual(compareSubstring('abc', 'xbc', 1, 3, 1, 3), 0);
		});

		it('should compare substring with full string', () => {
			// Compare 'bc' from 'abc' with full 'bc'
			assert.strictEqual(compareSubstring('abc', 'bc', 1, 3), 0);
		});

		it('should handle different substring lengths', () => {
			// Compare 'ab' (2 chars) with 'abc' (3 chars)
			assert.strictEqual(compareSubstring('abc', 'abc', 0, 2, 0, 3), -1);
			// Compare 'abc' (3 chars) with 'ab' (2 chars)
			assert.strictEqual(compareSubstring('abc', 'abc', 0, 3, 0, 2), 1);
		});

		it('should be case-sensitive', () => {
			assert.strictEqual(compareSubstring('ABC', 'abc'), -1);
		});

		it('should handle empty substrings', () => {
			assert.strictEqual(compareSubstring('abc', 'abc', 0, 0, 0, 0), 0);
			assert.strictEqual(compareSubstring('abc', 'abc', 0, 0, 0, 1), -1);
		});

		it('should compare character by character', () => {
			assert.strictEqual(compareSubstring('a', 'b'), -1);
			assert.strictEqual(compareSubstring('b', 'a'), 1);
			assert.strictEqual(compareSubstring('ab', 'ac'), -1);
		});
	});

	describe('compareSubstringIgnoreCase', () => {
		it('should compare full strings ignoring case', () => {
			assert.strictEqual(compareSubstringIgnoreCase('abc', 'ABC'), 0);
			assert.strictEqual(compareSubstringIgnoreCase('ABC', 'abc'), 0);
		});

		it('should compare substrings ignoring case', () => {
			// Compare 'BC' from 'ABC' with 'bc' from 'xbc'
			assert.strictEqual(compareSubstringIgnoreCase('ABC', 'xbc', 1, 3, 1, 3), 0);
		});

		it('should handle mixed case', () => {
			assert.strictEqual(compareSubstringIgnoreCase('TeSt', 'test'), 0);
			assert.strictEqual(compareSubstringIgnoreCase('Test', 'TEST'), 0);
		});

		it('should return correct order for different strings', () => {
			assert.strictEqual(compareSubstringIgnoreCase('apple', 'BANANA'), -1);
			assert.strictEqual(compareSubstringIgnoreCase('BANANA', 'apple'), 1);
		});

		it('should handle different lengths', () => {
			assert.strictEqual(compareSubstringIgnoreCase('abc', 'ABC', 0, 2, 0, 3), -1);
			assert.strictEqual(compareSubstringIgnoreCase('abc', 'ABC', 0, 3, 0, 2), 1);
		});

		it('should handle empty substrings', () => {
			assert.strictEqual(compareSubstringIgnoreCase('abc', 'ABC', 0, 0, 0, 0), 0);
		});

		it('should handle special ASCII cases', () => {
			// Test uppercase ASCII letters
			assert.strictEqual(compareSubstringIgnoreCase('A', 'a'), 0);
			assert.strictEqual(compareSubstringIgnoreCase('Z', 'z'), 0);
		});

		it('should handle non-ASCII characters', () => {
			// Should fall back to lowercase comparison for non-ASCII
			assert.strictEqual(compareSubstringIgnoreCase('café', 'CAFÉ'), 0);
		});
	});
});

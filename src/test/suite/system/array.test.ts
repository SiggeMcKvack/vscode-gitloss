import * as assert from 'assert';
import {
	chunk,
	countStringLength,
	countUniques,
	ensure,
	filterMap,
	groupBy,
	groupByMap,
} from '../../../system/array';

describe('Array Utilities', () => {
	describe('chunk', () => {
		it('should split array into chunks of specified size', () => {
			const source = [1, 2, 3, 4, 5, 6, 7, 8, 9];
			const result = chunk(source, 3);

			assert.strictEqual(result.length, 3);
			assert.deepStrictEqual(result[0], [1, 2, 3]);
			assert.deepStrictEqual(result[1], [4, 5, 6]);
			assert.deepStrictEqual(result[2], [7, 8, 9]);
		});

		it('should handle array not evenly divisible', () => {
			const source = [1, 2, 3, 4, 5];
			const result = chunk(source, 2);

			assert.strictEqual(result.length, 3);
			assert.deepStrictEqual(result[0], [1, 2]);
			assert.deepStrictEqual(result[1], [3, 4]);
			assert.deepStrictEqual(result[2], [5]);
		});

		it('should handle chunk size larger than array', () => {
			const source = [1, 2, 3];
			const result = chunk(source, 10);

			assert.strictEqual(result.length, 1);
			assert.deepStrictEqual(result[0], [1, 2, 3]);
		});

		it('should handle empty array', () => {
			const result = chunk([], 3);
			assert.strictEqual(result.length, 0);
		});

		it('should handle chunk size of 1', () => {
			const source = [1, 2, 3];
			const result = chunk(source, 1);

			assert.strictEqual(result.length, 3);
			assert.deepStrictEqual(result[0], [1]);
			assert.deepStrictEqual(result[1], [2]);
			assert.deepStrictEqual(result[2], [3]);
		});
	});

	describe('countStringLength', () => {
		it('should count total length of strings', () => {
			const source = ['abc', 'def', 'ghij'];
			const result = countStringLength(source);
			assert.strictEqual(result, 10); // 3 + 3 + 4
		});

		it('should return 0 for empty array', () => {
			const result = countStringLength([]);
			assert.strictEqual(result, 0);
		});

		it('should handle array with empty strings', () => {
			const source = ['abc', '', 'def', ''];
			const result = countStringLength(source);
			assert.strictEqual(result, 6);
		});

		it('should handle single string', () => {
			const result = countStringLength(['hello']);
			assert.strictEqual(result, 5);
		});

		it('should handle unicode characters', () => {
			const source = ['café', '日本'];
			const result = countStringLength(source);
			assert.strictEqual(result, 6); // 4 + 2
		});
	});

	describe('countUniques', () => {
		it('should count unique values', () => {
			const source = [
				{ id: 'a', value: 1 },
				{ id: 'b', value: 2 },
				{ id: 'a', value: 3 },
				{ id: 'c', value: 4 },
				{ id: 'b', value: 5 },
			];
			const result = countUniques(source, item => item.id);

			assert.strictEqual(result['a'], 2);
			assert.strictEqual(result['b'], 2);
			assert.strictEqual(result['c'], 1);
		});

		it('should handle empty array', () => {
			const result = countUniques([], item => item);
			assert.deepStrictEqual(result, {});
		});

		it('should count strings directly', () => {
			const source = ['apple', 'banana', 'apple', 'cherry', 'banana', 'apple'];
			const result = countUniques(source, item => item);

			assert.strictEqual(result['apple'], 3);
			assert.strictEqual(result['banana'], 2);
			assert.strictEqual(result['cherry'], 1);
		});

		it('should handle all unique values', () => {
			const source = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
			const result = countUniques(source, item => item.id);

			assert.strictEqual(result['a'], 1);
			assert.strictEqual(result['b'], 1);
			assert.strictEqual(result['c'], 1);
		});

		it('should handle all same values', () => {
			const source = [{ id: 'a' }, { id: 'a' }, { id: 'a' }];
			const result = countUniques(source, item => item.id);

			assert.strictEqual(result['a'], 3);
		});
	});

	describe('ensure', () => {
		it('should return array unchanged', () => {
			const source = [1, 2, 3];
			const result = ensure(source);
			assert.strictEqual(result, source);
		});

		it('should wrap single value in array', () => {
			const result = ensure(5);
			assert.deepStrictEqual(result, [5]);
		});

		it('should return undefined for undefined', () => {
			const result = ensure(undefined);
			assert.strictEqual(result, undefined);
		});

		it('should return undefined for null', () => {
			const result = ensure(null as any);
			assert.strictEqual(result, undefined);
		});

		it('should wrap string in array', () => {
			const result = ensure('test');
			assert.deepStrictEqual(result, ['test']);
		});

		it('should wrap object in array', () => {
			const obj = { key: 'value' };
			const result = ensure(obj);
			assert.deepStrictEqual(result, [obj]);
		});

		it('should handle empty array', () => {
			const source: any[] = [];
			const result = ensure(source);
			assert.strictEqual(result, source);
			assert.strictEqual(result?.length, 0);
		});
	});

	describe('filterMap', () => {
		it('should filter and map in one pass', () => {
			const source = [1, 2, 3, 4, 5, 6];
			const result = filterMap(source, n => (n % 2 === 0 ? n * 2 : null));

			assert.deepStrictEqual(result, [4, 8, 12]);
		});

		it('should handle all filtered out', () => {
			const source = [1, 3, 5];
			const result = filterMap(source, n => (n % 2 === 0 ? n : null));

			assert.deepStrictEqual(result, []);
		});

		it('should handle no filtering', () => {
			const source = [1, 2, 3];
			const result = filterMap(source, n => n * 2);

			assert.deepStrictEqual(result, [2, 4, 6]);
		});

		it('should provide index to mapper', () => {
			const source = ['a', 'b', 'c'];
			const result = filterMap(source, (item, index) => `${item}${index}`);

			assert.deepStrictEqual(result, ['a0', 'b1', 'c2']);
		});

		it('should filter out undefined', () => {
			const source = [1, 2, 3, 4];
			const result = filterMap(source, n => (n > 2 ? n : undefined));

			assert.deepStrictEqual(result, [3, 4]);
		});

		it('should handle empty array', () => {
			const result = filterMap([], n => n);
			assert.deepStrictEqual(result, []);
		});

		it('should handle complex objects', () => {
			const source = [
				{ name: 'John', age: 25 },
				{ name: 'Jane', age: 17 },
				{ name: 'Bob', age: 30 },
			];
			const result = filterMap(source, person =>
				person.age >= 18 ? person.name : null
			);

			assert.deepStrictEqual(result, ['John', 'Bob']);
		});
	});

	describe('groupBy', () => {
		it('should group items by key', () => {
			const source = [
				{ category: 'fruit', name: 'apple' },
				{ category: 'vegetable', name: 'carrot' },
				{ category: 'fruit', name: 'banana' },
				{ category: 'vegetable', name: 'broccoli' },
			];
			const result = groupBy(source, item => item.category);

			assert.strictEqual(result['fruit'].length, 2);
			assert.strictEqual(result['vegetable'].length, 2);
			assert.deepStrictEqual(result['fruit'][0].name, 'apple');
			assert.deepStrictEqual(result['fruit'][1].name, 'banana');
		});

		it('should handle empty array', () => {
			const result = groupBy([], item => item);
			assert.deepStrictEqual(result, {});
		});

		it('should handle single group', () => {
			const source = [{ type: 'a', val: 1 }, { type: 'a', val: 2 }];
			const result = groupBy(source, item => item.type);

			assert.strictEqual(Object.keys(result).length, 1);
			assert.strictEqual(result['a'].length, 2);
		});

		it('should handle all unique groups', () => {
			const source = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
			const result = groupBy(source, item => item.id);

			assert.strictEqual(Object.keys(result).length, 3);
			assert.strictEqual(result['a'].length, 1);
			assert.strictEqual(result['b'].length, 1);
			assert.strictEqual(result['c'].length, 1);
		});
	});

	describe('groupByMap', () => {
		it('should group items using Map', () => {
			const source = [
				{ category: 'fruit', name: 'apple' },
				{ category: 'vegetable', name: 'carrot' },
				{ category: 'fruit', name: 'banana' },
			];
			const result = groupByMap(source, item => item.category);

			assert.ok(result instanceof Map);
			assert.strictEqual(result.get('fruit')?.length, 2);
			assert.strictEqual(result.get('vegetable')?.length, 1);
		});

		it('should handle empty array', () => {
			const result = groupByMap([], item => item);
			assert.strictEqual(result.size, 0);
		});

		it('should handle non-string keys', () => {
			const source = [
				{ id: 1, name: 'a' },
				{ id: 2, name: 'b' },
				{ id: 1, name: 'c' },
			];
			const result = groupByMap(source, item => item.id);

			assert.strictEqual(result.get(1)?.length, 2);
			assert.strictEqual(result.get(2)?.length, 1);
		});

		it('should handle object keys', () => {
			const key1 = { id: 1 };
			const key2 = { id: 2 };
			const source = [
				{ key: key1, value: 'a' },
				{ key: key2, value: 'b' },
				{ key: key1, value: 'c' },
			];
			const result = groupByMap(source, item => item.key);

			assert.strictEqual(result.get(key1)?.length, 2);
			assert.strictEqual(result.get(key2)?.length, 1);
		});
	});
});

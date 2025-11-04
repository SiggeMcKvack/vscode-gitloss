import * as assert from 'assert';
import { GitTagParser } from '../../../../git/parsers/tagParser';
import { readFixture } from '../../../helpers/mocks';

describe('GitTagParser', () => {
	const repoPath = '/test/repo';

	describe('parse', () => {
		it('should return undefined for empty data', () => {
			const result = GitTagParser.parse('', repoPath);
			assert.strictEqual(result, undefined);
		});

		it('should parse tag list', async () => {
			const data = await readFixture('git-output/tag-list.txt');
			const result = GitTagParser.parse(data, repoPath);

			assert.ok(result);
			assert.strictEqual(result.length, 3);
		});

		it('should parse tag with annotated ref', async () => {
			const data = await readFixture('git-output/tag-list.txt');
			const result = GitTagParser.parse(data, repoPath);

			assert.ok(result);
			const tag1 = result[0];
			assert.strictEqual(tag1.name, 'v1.0.0');
			assert.strictEqual(tag1.sha, 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0');
			assert.strictEqual(tag1.message, 'Release version 1.0.0');
		});

		it('should parse tag with lightweight ref', async () => {
			const data = await readFixture('git-output/tag-list.txt');
			const result = GitTagParser.parse(data, repoPath);

			assert.ok(result);
			const tag2 = result[1];
			assert.strictEqual(tag2.name, 'v1.1.0');
			assert.strictEqual(tag2.sha, 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0a1');
		});

		it('should parse tag dates', async () => {
			const data = await readFixture('git-output/tag-list.txt');
			const result = GitTagParser.parse(data, repoPath);

			assert.ok(result);
			for (const tag of result) {
				assert.ok(tag.date instanceof Date);
				assert.ok(!isNaN(tag.date.getTime()));
			}
		});

		it('should handle tags with author date', async () => {
			const data = await readFixture('git-output/tag-list.txt');
			const result = GitTagParser.parse(data, repoPath);

			assert.ok(result);
			const tag1 = result[0];
			assert.ok(tag1.commitDate);
			assert.ok(tag1.commitDate instanceof Date);
		});

		it('should handle tags without author date', async () => {
			const data = await readFixture('git-output/tag-list.txt');
			const result = GitTagParser.parse(data, repoPath);

			assert.ok(result);
			const tag3 = result[2];
			assert.strictEqual(tag3.commitDate, undefined);
		});

		it('should strip refs/tags/ prefix', async () => {
			const data = await readFixture('git-output/tag-list.txt');
			const result = GitTagParser.parse(data, repoPath);

			assert.ok(result);
			for (const tag of result) {
				assert.ok(!tag.name.startsWith('refs/tags/'));
			}
		});

		it('should handle tag messages', async () => {
			const data = await readFixture('git-output/tag-list.txt');
			const result = GitTagParser.parse(data, repoPath);

			assert.ok(result);
			assert.strictEqual(result[0].message, 'Release version 1.0.0');
			assert.strictEqual(result[1].message, 'Minor update');
			assert.strictEqual(result[2].message, 'Beta release');
		});

		it('should parse beta/pre-release tags', async () => {
			const data = await readFixture('git-output/tag-list.txt');
			const result = GitTagParser.parse(data, repoPath);

			assert.ok(result);
			const betaTag = result[2];
			assert.strictEqual(betaTag.name, 'v2.0.0-beta');
		});
	});
});

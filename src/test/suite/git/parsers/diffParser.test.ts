import * as assert from 'assert';
import { GitDiffParser } from '../../../../git/parsers/diffParser';
import { readFixture } from '../../../helpers/mocks';

describe('GitDiffParser', () => {
	describe('parse', () => {
		it('should return undefined for empty data', () => {
			const result = GitDiffParser.parse('');
			assert.strictEqual(result, undefined);
		});

		it('should parse unified diff format', async () => {
			const data = await readFixture('git-output/diff-unified.txt');
			const result = GitDiffParser.parse(data);

			assert.ok(result);
			assert.strictEqual(result.hunks.length, 2);
		});

		it('should parse hunk headers correctly', async () => {
			const data = await readFixture('git-output/diff-unified.txt');
			const result = GitDiffParser.parse(data);

			assert.ok(result);
			const hunk1 = result.hunks[0];

			// Previous (old file): start at line 1, count 5
			assert.strictEqual(hunk1.previous.position.start, 1);
			assert.strictEqual(hunk1.previous.count, 5);

			// Current (new file): start at line 1, count 8
			assert.strictEqual(hunk1.current.position.start, 1);
			assert.strictEqual(hunk1.current.count, 8);
		});

		it('should parse multiple hunks', async () => {
			const data = await readFixture('git-output/diff-unified.txt');
			const result = GitDiffParser.parse(data);

			assert.ok(result);
			assert.strictEqual(result.hunks.length, 2);

			const hunk2 = result.hunks[1];
			assert.strictEqual(hunk2.previous.position.start, 15);
			assert.strictEqual(hunk2.current.position.start, 18);
		});

		it('should calculate hunk end positions', async () => {
			const data = await readFixture('git-output/diff-unified.txt');
			const result = GitDiffParser.parse(data);

			assert.ok(result);
			const hunk1 = result.hunks[0];

			// End = start + count - 1 (for non-zero counts)
			assert.strictEqual(hunk1.previous.position.end, 1 + 5 - 1);
			assert.strictEqual(hunk1.current.position.end, 1 + 8 - 1);
		});

		it('should store raw diff when debug is true', async () => {
			const data = await readFixture('git-output/diff-unified.txt');
			const result = GitDiffParser.parse(data, true);

			assert.ok(result);
			assert.ok(result.diff);
			assert.strictEqual(result.diff, data);
		});

		it('should not store raw diff when debug is false', async () => {
			const data = await readFixture('git-output/diff-unified.txt');
			const result = GitDiffParser.parse(data, false);

			assert.ok(result);
			assert.strictEqual(result.diff, undefined);
		});

		it('should handle hunks with zero count', () => {
			const data = '@@ -1,0 +1,1 @@\n+new line\n@@';
			const result = GitDiffParser.parse(data);

			assert.ok(result);
			assert.strictEqual(result.hunks.length, 1);

			// Zero count should be treated as 1
			assert.strictEqual(result.hunks[0].previous.count, 1);
			assert.strictEqual(result.hunks[0].current.count, 1);
		});
	});

	describe('parseHunk', () => {
		it('should parse hunk lines', async () => {
			const data = await readFixture('git-output/diff-unified.txt');
			const diff = GitDiffParser.parse(data);

			assert.ok(diff);
			const hunk = diff.hunks[0];
			const parsed = GitDiffParser.parseHunk(hunk);

			assert.ok(parsed.lines);
			assert.ok(parsed.lines.length > 0);
		});

		it('should detect added state', async () => {
			const data = await readFixture('git-output/diff-unified.txt');
			const diff = GitDiffParser.parse(data);

			assert.ok(diff);
			const hunk = diff.hunks[0];
			const parsed = GitDiffParser.parseHunk(hunk);

			// Hunk has added lines
			assert.ok(['added', 'changed'].includes(parsed.state));
		});

		it('should detect changed state', async () => {
			const data = await readFixture('git-output/diff-unified.txt');
			const diff = GitDiffParser.parse(data);

			assert.ok(diff);
			const hunk = diff.hunks[0];
			const parsed = GitDiffParser.parseHunk(hunk);

			// Hunk has both additions and removals (changed)
			assert.strictEqual(parsed.state, 'changed');
		});

		it('should parse added lines', async () => {
			const data = await readFixture('git-output/diff-unified.txt');
			const diff = GitDiffParser.parse(data);

			assert.ok(diff);
			const hunk = diff.hunks[0];
			const parsed = GitDiffParser.parseHunk(hunk);

			const addedLines = parsed.lines.filter(
				l => l.current && l.current.state === 'added'
			);
			assert.ok(addedLines.length > 0);
		});

		it('should parse removed lines', async () => {
			const data = await readFixture('git-output/diff-unified.txt');
			const diff = GitDiffParser.parse(data);

			assert.ok(diff);
			const hunk = diff.hunks[0];
			const parsed = GitDiffParser.parseHunk(hunk);

			const removedLines = parsed.lines.filter(
				l => l.previous && l.previous.state === 'removed'
			);
			assert.ok(removedLines.length > 0);
		});
	});
});

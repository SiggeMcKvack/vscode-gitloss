import * as assert from 'assert';
import { GitLogParser, LogType } from '../../../../git/parsers/logParser';
import { GitFileIndexStatus } from '../../../../git/models';
import { readFixture, createMockContainer } from '../../../helpers/mocks';

describe('GitLogParser', () => {
	const repoPath = '/test/repo';
	let mockContainer: any;

	beforeEach(() => {
		mockContainer = createMockContainer();
	});

	describe('parse', () => {
		it('should return undefined for empty data', () => {
			const result = GitLogParser.parse(
				mockContainer,
				'',
				LogType.Log,
				repoPath,
				undefined,
				undefined,
				undefined,
				undefined,
				false,
				undefined
			);
			assert.strictEqual(result, undefined);
		});

		it('should parse simple commit', async () => {
			const data = await readFixture('git-output/log-simple-commit.txt');
			const result = GitLogParser.parse(
				mockContainer,
				data,
				LogType.Log,
				repoPath,
				undefined,
				undefined,
				undefined,
				undefined,
				false,
				undefined
			);

			assert.ok(result);
			assert.strictEqual(result.commits.size, 1);

			const commit = Array.from(result.commits.values())[0];
			assert.strictEqual(commit.sha, 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0');
			assert.strictEqual(commit.author.name, 'John Doe');
			assert.strictEqual(commit.author.email, 'john.doe@example.com');
			assert.ok(commit.summary.startsWith('Initial commit'));
		});

		it('should parse multiple commits', async () => {
			const data = await readFixture('git-output/log-multiple-commits.txt');
			const result = GitLogParser.parse(
				mockContainer,
				data,
				LogType.Log,
				repoPath,
				undefined,
				undefined,
				undefined,
				undefined,
				false,
				undefined
			);

			assert.ok(result);
			assert.strictEqual(result.commits.size, 3);

			const commits = Array.from(result.commits.values());
			assert.strictEqual(commits[0].sha, 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0');
			assert.strictEqual(commits[1].sha, 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0a1');
			assert.strictEqual(commits[2].sha, 'c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0a1b2');
		});

		it('should parse commit authors', async () => {
			const data = await readFixture('git-output/log-multiple-commits.txt');
			const result = GitLogParser.parse(
				mockContainer,
				data,
				LogType.Log,
				repoPath,
				undefined,
				undefined,
				undefined,
				undefined,
				false,
				undefined
			);

			assert.ok(result);
			const commits = Array.from(result.commits.values());

			assert.strictEqual(commits[0].author.name, 'John Doe');
			assert.strictEqual(commits[1].author.name, 'Jane Smith');
			assert.strictEqual(commits[2].author.name, 'Bob Wilson');
		});

		it('should parse commit dates', async () => {
			const data = await readFixture('git-output/log-simple-commit.txt');
			const result = GitLogParser.parse(
				mockContainer,
				data,
				LogType.Log,
				repoPath,
				undefined,
				undefined,
				undefined,
				undefined,
				false,
				undefined
			);

			assert.ok(result);
			const commit = Array.from(result.commits.values())[0];

			assert.ok(commit.author.date instanceof Date);
			assert.ok(!isNaN(commit.author.date.getTime()));
			assert.strictEqual(commit.author.date.getTime(), 1609459200 * 1000);
		});

		it('should parse file changes', async () => {
			const data = await readFixture('git-output/log-multiple-commits.txt');
			const result = GitLogParser.parse(
				mockContainer,
				data,
				LogType.Log,
				repoPath,
				undefined,
				undefined,
				undefined,
				undefined,
				false,
				undefined
			);

			assert.ok(result);
			const commits = Array.from(result.commits.values());

			// First commit: 1 added file
			assert.strictEqual(commits[0]!.files!.length, 1);
			assert.strictEqual(commits[0]!.files![0]!.status, GitFileIndexStatus.Added);

			// Second commit: 1 modified, 1 added
			assert.strictEqual(commits[1]!.files!.length, 2);

			// Third commit: 1 modified, 1 deleted
			assert.strictEqual(commits[2]!.files!.length, 2);
		});

		it('should parse renamed files', async () => {
			const data = await readFixture('git-output/log-with-rename.txt');
			const result = GitLogParser.parse(
				mockContainer,
				data,
				LogType.Log,
				repoPath,
				undefined,
				undefined,
				undefined,
				undefined,
				false,
				undefined
			);

			assert.ok(result);
			const commit = Array.from(result.commits.values())[0]!;

			assert.strictEqual(commit.files!.length, 1);
			const file = commit.files![0]!;
			assert.strictEqual(file.status, GitFileIndexStatus.Renamed);
			assert.strictEqual(file.path, 'src/newname.ts');
			assert.strictEqual(file.originalPath, 'src/oldname.ts');
		});

		it('should parse multiline commit messages', async () => {
			const data = await readFixture('git-output/log-multiline-message.txt');
			const result = GitLogParser.parse(
				mockContainer,
				data,
				LogType.Log,
				repoPath,
				undefined,
				undefined,
				undefined,
				undefined,
				false,
				undefined
			);

			assert.ok(result);
			const commit = Array.from(result.commits.values())[0];

			assert.ok(commit.summary.includes('Add complex feature'));
			assert.ok(commit.summary.includes('multiple lines'));
			assert.ok(commit.summary.includes('Feature 1'));
			assert.ok(commit.summary.includes('Feature 2'));
			assert.ok(commit.summary.includes('Feature 3'));
		});

		it('should parse parent commits', async () => {
			const data = await readFixture('git-output/log-multiple-commits.txt');
			const result = GitLogParser.parse(
				mockContainer,
				data,
				LogType.Log,
				repoPath,
				undefined,
				undefined,
				undefined,
				undefined,
				false,
				undefined
			);

			assert.ok(result);
			const commits = Array.from(result.commits.values());

			// First commit has no parents
			assert.strictEqual(commits[0].parents.length, 0);

			// Second commit has one parent
			assert.strictEqual(commits[1].parents.length, 1);
			assert.strictEqual(commits[1].parents[0], 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0');

			// Third commit has one parent
			assert.strictEqual(commits[2].parents.length, 1);
			assert.strictEqual(commits[2].parents[0], 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0a1');
		});

		it('should parse merge commits', async () => {
			const data = await readFixture('git-output/log-merge-commit.txt');
			const result = GitLogParser.parse(
				mockContainer,
				data,
				LogType.Log,
				repoPath,
				undefined,
				undefined,
				undefined,
				undefined,
				false,
				undefined
			);

			assert.ok(result);
			const commit = Array.from(result.commits.values())[0];

			// Merge commit has two parents
			assert.strictEqual(commit.parents.length, 2);
			assert.strictEqual(commit.parents[0], 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0a1');
			assert.strictEqual(commit.parents[1], 'c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0a1b2');
		});

		it('should respect commit limit', async () => {
			const data = await readFixture('git-output/log-multiple-commits.txt');
			const result = GitLogParser.parse(
				mockContainer,
				data,
				LogType.Log,
				repoPath,
				undefined,
				undefined,
				undefined,
				2, // limit
				false,
				undefined
			);

			assert.ok(result);
			assert.strictEqual(result.commits.size, 2);
			assert.strictEqual(result.hasMore, true);
		});

		it('should handle commits without files', async () => {
			const data = await readFixture('git-output/log-merge-commit.txt');
			const result = GitLogParser.parse(
				mockContainer,
				data,
				LogType.Log,
				repoPath,
				undefined,
				undefined,
				undefined,
				undefined,
				false,
				undefined
			);

			// Merge commits without files should still be included but may be skipped in some cases
			// This depends on the specific implementation logic
			assert.ok(result);
		});

		it('should detect truncation', async () => {
			const data = await readFixture('git-output/log-multiple-commits.txt');
			const result = GitLogParser.parse(
				mockContainer,
				data,
				LogType.Log,
				repoPath,
				undefined,
				undefined,
				undefined,
				1, // limit less than actual commits
				false,
				undefined
			);

			assert.ok(result);
			assert.strictEqual(result.hasMore, true);
		});
	});

	describe('shortstatRegex', () => {
		it('should match shortstat with all stats', () => {
			const text = ' 3 files changed, 15 insertions(+), 5 deletions(-)';
			const match = GitLogParser.shortstatRegex.exec(text);

			assert.ok(match);
			assert.strictEqual(match.groups?.files, '3');
			assert.strictEqual(match.groups?.additions, '15');
			assert.strictEqual(match.groups?.deletions, '5');
		});

		it('should match shortstat with only files changed', () => {
			const text = ' 1 file changed';
			const match = GitLogParser.shortstatRegex.exec(text);

			assert.ok(match);
			assert.strictEqual(match.groups?.files, '1');
			assert.strictEqual(match.groups?.additions, undefined);
			assert.strictEqual(match.groups?.deletions, undefined);
		});

		it('should match shortstat with files and insertions', () => {
			const text = ' 2 files changed, 10 insertions(+)';
			const match = GitLogParser.shortstatRegex.exec(text);

			assert.ok(match);
			assert.strictEqual(match.groups?.files, '2');
			assert.strictEqual(match.groups?.additions, '10');
			assert.strictEqual(match.groups?.deletions, undefined);
		});

		it('should match shortstat with files and deletions', () => {
			const text = ' 2 files changed, 10 deletions(-)';
			const match = GitLogParser.shortstatRegex.exec(text);

			assert.ok(match);
			assert.strictEqual(match.groups?.files, '2');
			assert.strictEqual(match.groups?.additions, undefined);
			assert.strictEqual(match.groups?.deletions, '10');
		});
	});

	describe('createSingle', () => {
		it('should create parser for single field', () => {
			const parser = GitLogParser.createSingle('%H');
			assert.ok(parser);
			assert.ok(parser.arguments);
			assert.ok(parser.parse);
		});

		it('should parse single field data', () => {
			const parser = GitLogParser.createSingle('%H');
			const data = 'a1b2c3d4\0b2c3d4e5\0';
			const results = Array.from(parser.parse(data));

			assert.strictEqual(results.length, 2);
			assert.strictEqual(results[0], 'a1b2c3d4');
			assert.strictEqual(results[1], 'b2c3d4e5');
		});
	});

	describe('create', () => {
		it('should create parser with field mapping', () => {
			const parser = GitLogParser.create({ sha: '%H', author: '%aN' });
			assert.ok(parser);
			assert.ok(parser.arguments);
			assert.ok(parser.parse);
		});

		it('should parse custom fields', () => {
			const parser = GitLogParser.create({ sha: '%H', author: '%aN' });
			const data = 'sha1\0author1\0sha2\0author2\0';
			const results = Array.from(parser.parse(data));

			assert.strictEqual(results.length, 2);
			assert.strictEqual(results[0].sha, 'sha1');
			assert.strictEqual(results[0].author, 'author1');
			assert.strictEqual(results[1].sha, 'sha2');
			assert.strictEqual(results[1].author, 'author2');
		});
	});

	describe('createWithFiles', () => {
		it('should create parser with files support', () => {
			const parser = GitLogParser.createWithFiles({ sha: '%H', author: '%aN' });
			assert.ok(parser);
			assert.ok(parser.arguments);
			assert.ok(parser.parse);
		});

		it('should parse data with files', () => {
			const parser = GitLogParser.createWithFiles({ sha: '%H' });
			// Simulated data: null bytes and file status
			const data = '\0\0\0\0sha1\0M\0file1.ts\0';
			const results = Array.from(parser.parse(data));

			assert.ok(results.length > 0);
			assert.strictEqual(results[0].sha, 'sha1');
		});
	});
});

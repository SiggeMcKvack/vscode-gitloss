import * as assert from 'assert';
import * as path from 'path';
import { GitBlameParser } from '../../../../git/parsers/blameParser';
import { GitRevision } from '../../../../git/models';
import { readFixture, createMockContainer, createMockGitUser } from '../../../helpers/mocks';

describe('GitBlameParser', () => {
	const repoPath = '/test/repo';
	let mockContainer: any;

	beforeEach(() => {
		mockContainer = createMockContainer();
	});

	describe('parse', () => {
		it('should return undefined for empty data', () => {
			const result = GitBlameParser.parse(mockContainer, '', repoPath, undefined);
			assert.strictEqual(result, undefined);
		});

		it('should parse simple blame output', async () => {
			const data = await readFixture('git-output/blame-simple.txt');
			const result = GitBlameParser.parse(mockContainer, data, repoPath, undefined);

			assert.ok(result, 'Result should be defined');
			assert.strictEqual(result.repoPath, repoPath);
			assert.strictEqual(result.lines.length, 1);
			assert.strictEqual(result.commits.size, 1);
			assert.strictEqual(result.authors.size, 1);

			// Check commit
			const commit = result.commits.get('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0');
			assert.ok(commit, 'Commit should exist');
			assert.strictEqual(commit.sha, 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0');
			assert.strictEqual(commit.author.name, 'John Doe');
			assert.strictEqual(commit.author.email, 'john.doe@example.com');
			assert.ok(commit.summary.startsWith('Initial commit'), `Expected summary to start with "Initial commit", got "${commit.summary}"`);

			// Check author
			const author = result.authors.get('John Doe');
			assert.ok(author, 'Author should exist');
			assert.strictEqual(author.name, 'John Doe');
			assert.strictEqual(author.lineCount, 1);

			// Check line
			const line = result.lines[0];
			assert.strictEqual(line.sha, 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0');
			assert.strictEqual(line.line, 1);
			assert.strictEqual(line.originalLine, 1);
		});

		it('should parse multiline blame output with multiple commits', async () => {
			const data = await readFixture('git-output/blame-multiline.txt');
			const result = GitBlameParser.parse(mockContainer, data, repoPath, undefined);

			assert.ok(result, 'Result should be defined');
			assert.strictEqual(result.lines.length, 5);
			assert.strictEqual(result.commits.size, 2);
			assert.strictEqual(result.authors.size, 2);

			// Check first commit (3 lines)
			const commit1 = result.commits.get('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0');
			assert.ok(commit1, 'First commit should exist');
			assert.strictEqual(commit1.author.name, 'John Doe');
			assert.strictEqual(commit1.lines.length, 3);

			// Check second commit (2 lines)
			const commit2 = result.commits.get('b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0a1');
			assert.ok(commit2, 'Second commit should exist');
			assert.strictEqual(commit2.author.name, 'Jane Smith');
			assert.ok(commit2.summary.startsWith('Add test suite'));
			assert.strictEqual(commit2.lines.length, 2);

			// Check that second commit has previous reference
			assert.ok(commit2.file, 'Commit file should exist');
			assert.strictEqual(commit2.file.previousSha, 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0');

			// Check author line counts
			const author1 = result.authors.get('John Doe');
			assert.strictEqual(author1?.lineCount, 3);

			const author2 = result.authors.get('Jane Smith');
			assert.strictEqual(author2?.lineCount, 2);
		});

		it('should handle uncommitted changes', async () => {
			const currentUser = createMockGitUser({
				name: 'You',
				email: 'you@example.com',
			});

			const data = await readFixture('git-output/blame-uncommitted.txt');
			const result = GitBlameParser.parse(mockContainer, data, repoPath, currentUser);

			assert.ok(result, 'Result should be defined');
			assert.strictEqual(result.commits.size, 2);

			// Check uncommitted commit
			const uncommittedCommit = result.commits.get(GitRevision.uncommitted);
			assert.ok(uncommittedCommit, 'Uncommitted commit should exist');
			assert.strictEqual(uncommittedCommit.sha, GitRevision.uncommitted);
			assert.strictEqual(uncommittedCommit.author.name, 'You');
			assert.strictEqual(uncommittedCommit.author.email, 'you@example.com');
			assert.ok(uncommittedCommit.summary.startsWith('Uncommitted changes'));

			// Check that "You" author exists
			const youAuthor = result.authors.get('You');
			assert.ok(youAuthor, 'You author should exist');
			assert.strictEqual(youAuthor.lineCount, 1);
		});

		it('should sort authors by line count descending', async () => {
			const data = await readFixture('git-output/blame-multiline.txt');
			const result = GitBlameParser.parse(mockContainer, data, repoPath, undefined);

			assert.ok(result, 'Result should be defined');

			// Authors should be sorted: John Doe (3 lines), Jane Smith (2 lines)
			const authorNames = Array.from(result.authors.keys());
			assert.strictEqual(authorNames[0], 'John Doe');
			assert.strictEqual(authorNames[1], 'Jane Smith');
		});

		it('should handle email extraction with angle brackets', async () => {
			const data = await readFixture('git-output/blame-simple.txt');
			const result = GitBlameParser.parse(mockContainer, data, repoPath, undefined);

			assert.ok(result, 'Result should be defined');
			const commit = result.commits.get('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0');
			assert.ok(commit, 'Commit should exist');

			// Email should be extracted without angle brackets
			assert.strictEqual(commit.author.email, 'john.doe@example.com');
			assert.strictEqual(commit.committer.email, 'john.doe@example.com');
		});

		it('should match current user and replace with "You"', async () => {
			const currentUser = createMockGitUser({
				name: 'John Doe',
				email: 'john.doe@example.com',
			});

			const data = await readFixture('git-output/blame-simple.txt');
			const result = GitBlameParser.parse(mockContainer, data, repoPath, currentUser);

			assert.ok(result, 'Result should be defined');

			// Author should be replaced with "You"
			const youAuthor = result.authors.get('You');
			assert.ok(youAuthor, 'You author should exist');
			assert.strictEqual(youAuthor.lineCount, 1);

			// Original author name should not exist
			const originalAuthor = result.authors.get('John Doe');
			assert.strictEqual(originalAuthor, undefined);
		});

		it('should match current user by email only', async () => {
			const currentUser = createMockGitUser({
				name: undefined,
				email: 'john.doe@example.com',
			});

			const data = await readFixture('git-output/blame-simple.txt');
			const result = GitBlameParser.parse(mockContainer, data, repoPath, currentUser);

			assert.ok(result, 'Result should be defined');

			// Author should be replaced with "You" when matching by email
			const youAuthor = result.authors.get('You');
			assert.ok(youAuthor, 'You author should exist');
		});

		it('should handle line number ranges correctly', async () => {
			const data = await readFixture('git-output/blame-multiline.txt');
			const result = GitBlameParser.parse(mockContainer, data, repoPath, undefined);

			assert.ok(result, 'Result should be defined');

			// Check that line numbers are sequential and correctly mapped
			result.lines.forEach((line, i) => {
				assert.strictEqual(line.line, i + 1, `Line ${i} should have line number ${i + 1}`);
			});

			// Check specific line mappings
			assert.strictEqual(result.lines[0].sha, 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0');
			assert.strictEqual(result.lines[1].sha, 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0');
			assert.strictEqual(result.lines[2].sha, 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0');
			assert.strictEqual(result.lines[3].sha, 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0a1');
			assert.strictEqual(result.lines[4].sha, 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0a1');
		});
	});
});

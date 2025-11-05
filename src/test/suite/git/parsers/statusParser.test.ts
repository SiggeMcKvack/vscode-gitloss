import * as assert from 'assert';
import { GitStatusParser } from '../../../../git/parsers/statusParser';
import { readFixture } from '../../../helpers/mocks';

describe('GitStatusParser', () => {
	const repoPath = '/test/repo';

	describe('parse', () => {
		it('should return undefined for empty data', () => {
			const result = GitStatusParser.parse('', repoPath, 1);
			assert.strictEqual(result, undefined);
		});

		it('should return undefined for whitespace-only data', () => {
			const result = GitStatusParser.parse('\n\n\n', repoPath, 1);
			assert.strictEqual(result, undefined);
		});

		it('should parse clean status (v1)', async () => {
			const data = await readFixture('git-output/status-clean.txt');
			const result = GitStatusParser.parse(data, repoPath, 1);

			assert.ok(result, 'Result should be defined');
			assert.strictEqual(result.branch, 'main');
			assert.strictEqual(result.upstream, 'origin/main');
			assert.strictEqual(result.files.length, 0);
			assert.strictEqual(result.state.ahead, 0);
			assert.strictEqual(result.state.behind, 0);
		});

		it('should parse modified files (v1)', async () => {
			const data = await readFixture('git-output/status-modified.txt');
			const result = GitStatusParser.parse(data, repoPath, 1);

			assert.ok(result, 'Result should be defined');
			assert.strictEqual(result.branch, 'main');
			assert.strictEqual(result.files.length, 2);

			// Check modified file
			const modifiedFile = result.files.find(f => f.path.includes('test.ts'));
			assert.ok(modifiedFile, 'Modified file should exist');
			assert.strictEqual(modifiedFile.workingTreeStatus, 'M');

			// Check untracked file
			const untrackedFile = result.files.find(f => f.path.includes('new-file.ts'));
			assert.ok(untrackedFile, 'Untracked file should exist');
			assert.strictEqual(untrackedFile.workingTreeStatus, '?');
		});

		it('should parse ahead/behind status (v1)', async () => {
			const data = await readFixture('git-output/status-v1-ahead-behind.txt');
			const result = GitStatusParser.parse(data, repoPath, 1);

			assert.ok(result, 'Result should be defined');
			assert.strictEqual(result.branch, 'main');
			assert.strictEqual(result.upstream, 'origin/main');
			assert.strictEqual(result.state.ahead, 2);
			assert.strictEqual(result.state.behind, 3);
		});

		it('should parse renamed files (v1)', async () => {
			const data = await readFixture('git-output/status-v1-ahead-behind.txt');
			const result = GitStatusParser.parse(data, repoPath, 1);

			assert.ok(result, 'Result should be defined');

			// Check renamed file
			const renamedFile = result.files.find(f => f.path.includes('new-name.ts'));
			assert.ok(renamedFile, 'Renamed file should exist');
			assert.strictEqual(renamedFile.indexStatus, 'R');
			assert.strictEqual(renamedFile.path, 'src/new-name.ts');
			assert.strictEqual(renamedFile.originalPath, 'src/old-name.ts');
		});

		it('should parse various file statuses (v1)', async () => {
			const data = await readFixture('git-output/status-v1-ahead-behind.txt');
			const result = GitStatusParser.parse(data, repoPath, 1);

			assert.ok(result, 'Result should be defined');
			assert.strictEqual(result.files.length, 5);

			// Modified file
			const modified = result.files.find(f => f.path.includes('modified.ts'));
			assert.ok(modified);
			assert.strictEqual(modified.workingTreeStatus, 'M');

			// Added file
			const added = result.files.find(f => f.path.includes('added.ts'));
			assert.ok(added);
			assert.strictEqual(added.indexStatus, 'A');

			// Deleted file
			const deleted = result.files.find(f => f.path.includes('deleted.ts'));
			assert.ok(deleted);
			assert.strictEqual(deleted.indexStatus, 'D');

			// Untracked file
			const untracked = result.files.find(f => f.path.includes('untracked.ts'));
			assert.ok(untracked);
			assert.strictEqual(untracked.workingTreeStatus, '?');
		});

		it('should parse v2 porcelain format', async () => {
			const data = await readFixture('git-output/status-v2-full.txt');
			const result = GitStatusParser.parse(data, repoPath, 2);

			assert.ok(result, 'Result should be defined');
			assert.strictEqual(result.branch, 'main');
			assert.strictEqual(result.upstream, 'origin/main');
			assert.strictEqual(result.sha, 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0');
			assert.strictEqual(result.state.ahead, 2);
			assert.strictEqual(result.state.behind, 3);
			assert.strictEqual(result.files.length, 5);
		});

		it('should parse renamed files (v2)', async () => {
			const data = await readFixture('git-output/status-v2-full.txt');
			const result = GitStatusParser.parse(data, repoPath, 2);

			assert.ok(result, 'Result should be defined');

			// Check renamed file
			const renamedFile = result.files.find(f => f.path.includes('new-name.ts'));
			assert.ok(renamedFile, 'Renamed file should exist');
			assert.strictEqual(renamedFile.indexStatus, 'R');
			assert.strictEqual(renamedFile.path, 'src/new-name.ts');
			assert.strictEqual(renamedFile.originalPath, 'src/old-name.ts');
		});

		it('should parse various file statuses (v2)', async () => {
			const data = await readFixture('git-output/status-v2-full.txt');
			const result = GitStatusParser.parse(data, repoPath, 2);

			assert.ok(result, 'Result should be defined');

			// Modified file (working tree)
			const modified = result.files.find(f => f.path.includes('modified.ts'));
			assert.ok(modified);
			assert.strictEqual(modified.workingTreeStatus, 'M');

			// Added file (index)
			const added = result.files.find(f => f.path.includes('added.ts'));
			assert.ok(added);
			assert.strictEqual(added.indexStatus, 'A');

			// Deleted file (working tree)
			const deleted = result.files.find(f => f.path.includes('deleted.ts'));
			assert.ok(deleted);
			assert.strictEqual(deleted.workingTreeStatus, 'D');

			// Untracked file
			const untracked = result.files.find(f => f.path.includes('untracked.ts'));
			assert.ok(untracked);
			assert.strictEqual(untracked.workingTreeStatus, '?');
		});
	});

	describe('parseStatusFile', () => {
		it('should parse index status', () => {
			const file = GitStatusParser.parseStatusFile(repoPath, 'M.', 'test.ts');
			assert.strictEqual(file.indexStatus, 'M');
			assert.strictEqual(file.workingTreeStatus, undefined);
			assert.strictEqual(file.path, 'test.ts');
		});

		it('should parse working tree status', () => {
			const file = GitStatusParser.parseStatusFile(repoPath, '.M', 'test.ts');
			assert.strictEqual(file.indexStatus, undefined);
			assert.strictEqual(file.workingTreeStatus, 'M');
			assert.strictEqual(file.path, 'test.ts');
		});

		it('should parse both index and working tree status', () => {
			const file = GitStatusParser.parseStatusFile(repoPath, 'MM', 'test.ts');
			assert.strictEqual(file.indexStatus, 'M');
			assert.strictEqual(file.workingTreeStatus, 'M');
			assert.strictEqual(file.path, 'test.ts');
		});

		it('should parse untracked status', () => {
			const file = GitStatusParser.parseStatusFile(repoPath, '??', 'test.ts');
			assert.strictEqual(file.indexStatus, '?');
			assert.strictEqual(file.workingTreeStatus, '?');
			assert.strictEqual(file.path, 'test.ts');
		});

		it('should parse renamed file', () => {
			const file = GitStatusParser.parseStatusFile(repoPath, 'R.', 'new.ts', 'old.ts');
			assert.strictEqual(file.indexStatus, 'R');
			assert.strictEqual(file.path, 'new.ts');
			assert.strictEqual(file.originalPath, 'old.ts');
		});

		it('should parse added file', () => {
			const file = GitStatusParser.parseStatusFile(repoPath, 'A.', 'test.ts');
			assert.strictEqual(file.indexStatus, 'A');
			assert.strictEqual(file.workingTreeStatus, undefined);
		});

		it('should parse deleted file', () => {
			const file = GitStatusParser.parseStatusFile(repoPath, 'D.', 'test.ts');
			assert.strictEqual(file.indexStatus, 'D');
			assert.strictEqual(file.workingTreeStatus, undefined);
		});

		it('should handle status with dots correctly', () => {
			// Dot means no change
			const file = GitStatusParser.parseStatusFile(repoPath, '..', 'test.ts');
			assert.strictEqual(file.indexStatus, undefined);
			assert.strictEqual(file.workingTreeStatus, undefined);
		});
	});
});

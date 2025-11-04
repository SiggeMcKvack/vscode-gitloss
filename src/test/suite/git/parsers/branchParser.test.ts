import * as assert from 'assert';
import { GitBranchParser } from '../../../../git/parsers/branchParser';
import { readFixture } from '../../../helpers/mocks';

describe('GitBranchParser', () => {
	const repoPath = '/test/repo';

	describe('parse', () => {
		it('should return empty array for empty data', () => {
			const result = GitBranchParser.parse('', repoPath);
			assert.strictEqual(result.length, 0);
		});

		it('should parse branch list with tracking info', async () => {
			const data = await readFixture('git-output/branch-list.txt');
			const result = GitBranchParser.parse(data, repoPath);

			assert.strictEqual(result.length, 4);

			// Check main branch (current, with tracking)
			const main = result[0];
			assert.strictEqual(main.name, 'main');
			assert.strictEqual(main.current, true);
			assert.strictEqual(main.remote, false);
			assert.strictEqual(main.sha, 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0');
			assert.ok(main.upstream);
			assert.strictEqual(main.upstream.name, 'origin/main');
			assert.strictEqual(main.upstream.missing, false);
			assert.strictEqual(main.state.ahead, 2);
			assert.strictEqual(main.state.behind, 1);
		});

		it('should parse local branches', async () => {
			const data = await readFixture('git-output/branch-list.txt');
			const result = GitBranchParser.parse(data, repoPath);

			const localBranches = result.filter(b => !b.remote);
			assert.strictEqual(localBranches.length, 2);

			const featureBranch = localBranches[1];
			assert.strictEqual(featureBranch.name, 'feature/test');
			assert.strictEqual(featureBranch.current, false);
			assert.strictEqual(featureBranch.remote, false);
		});

		it('should parse remote branches', async () => {
			const data = await readFixture('git-output/branch-list.txt');
			const result = GitBranchParser.parse(data, repoPath);

			const remoteBranches = result.filter(b => b.remote);
			assert.strictEqual(remoteBranches.length, 2);

			const remoteMain = remoteBranches[0];
			assert.strictEqual(remoteMain.name, 'origin/main');
			assert.strictEqual(remoteMain.remote, true);

			const remoteDevelop = remoteBranches[1];
			assert.strictEqual(remoteDevelop.name, 'origin/develop');
			assert.strictEqual(remoteDevelop.remote, true);
		});

		it('should handle branches with missing upstream', async () => {
			const data = await readFixture('git-output/branch-missing-upstream.txt');
			const result = GitBranchParser.parse(data, repoPath);

			assert.strictEqual(result.length, 1);
			const branch = result[0];
			assert.ok(branch.upstream);
			assert.strictEqual(branch.upstream.missing, true);
		});

		it('should parse branch dates', async () => {
			const data = await readFixture('git-output/branch-list.txt');
			const result = GitBranchParser.parse(data, repoPath);

			for (const branch of result) {
				assert.ok(branch.date instanceof Date);
				assert.ok(!isNaN(branch.date.getTime()));
			}
		});

		it('should handle branches without tracking info', async () => {
			const data = await readFixture('git-output/branch-list.txt');
			const result = GitBranchParser.parse(data, repoPath);

			const remoteBranches = result.filter(b => b.remote);
			for (const branch of remoteBranches) {
				// Remote branches typically don't have tracking info
				assert.strictEqual(branch.state.ahead, 0);
				assert.strictEqual(branch.state.behind, 0);
			}
		});

		it('should strip refs/heads/ prefix', async () => {
			const data = await readFixture('git-output/branch-list.txt');
			const result = GitBranchParser.parse(data, repoPath);

			const localBranches = result.filter(b => !b.remote);
			for (const branch of localBranches) {
				assert.ok(!branch.name.startsWith('refs/heads/'));
			}
		});

		it('should strip refs/remotes/ prefix', async () => {
			const data = await readFixture('git-output/branch-list.txt');
			const result = GitBranchParser.parse(data, repoPath);

			const remoteBranches = result.filter(b => b.remote);
			for (const branch of remoteBranches) {
				assert.ok(!branch.name.startsWith('refs/remotes/'));
			}
		});
	});
});

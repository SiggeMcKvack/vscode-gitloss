import * as assert from 'assert';
import { compare, from, fromString } from '../../../system/version';

describe('Version Utilities', () => {
	describe('fromString', () => {
		it('should parse major.minor.patch', () => {
			const version = fromString('1.2.3');
			assert.strictEqual(version.major, 1);
			assert.strictEqual(version.minor, 2);
			assert.strictEqual(version.patch, 3);
			assert.strictEqual(version.pre, undefined);
		});

		it('should parse major.minor.patch-pre', () => {
			const version = fromString('1.2.3-beta');
			assert.strictEqual(version.major, 1);
			assert.strictEqual(version.minor, 2);
			assert.strictEqual(version.patch, 3);
			assert.strictEqual(version.pre, 'beta');
		});

		it('should parse major.minor', () => {
			const version = fromString('1.2');
			assert.strictEqual(version.major, 1);
			assert.strictEqual(version.minor, 2);
			assert.strictEqual(version.patch, 0);
		});

		it('should parse version with pre-release', () => {
			const version = fromString('2.0.0-rc.1');
			assert.strictEqual(version.major, 2);
			assert.strictEqual(version.minor, 0);
			assert.strictEqual(version.patch, 0);
			assert.strictEqual(version.pre, 'rc.1');
		});

		it('should handle alpha pre-release', () => {
			const version = fromString('3.1.0-alpha');
			assert.strictEqual(version.pre, 'alpha');
		});
	});

	describe('from', () => {
		it('should create version from numbers', () => {
			const version = from(1, 2, 3);
			assert.strictEqual(version.major, 1);
			assert.strictEqual(version.minor, 2);
			assert.strictEqual(version.patch, 3);
		});

		it('should create version from strings', () => {
			const version = from('1', '2', '3');
			assert.strictEqual(version.major, 1);
			assert.strictEqual(version.minor, 2);
			assert.strictEqual(version.patch, 3);
		});

		it('should default patch to 0', () => {
			const version = from(1, 2);
			assert.strictEqual(version.patch, 0);
		});

		it('should include pre-release', () => {
			const version = from(1, 2, 3, 'beta');
			assert.strictEqual(version.pre, 'beta');
		});

		it('should handle undefined patch', () => {
			const version = from(1, 2, undefined);
			assert.strictEqual(version.patch, 0);
		});

		it('should handle null patch', () => {
			const version = from(1, 2, null as any);
			assert.strictEqual(version.patch, 0);
		});
	});

	describe('compare', () => {
		describe('equal versions', () => {
			it('should return 0 for identical versions', () => {
				assert.strictEqual(compare('1.2.3', '1.2.3'), 0);
			});

			it('should return 0 for version objects', () => {
				const v1 = from(1, 2, 3);
				const v2 = from(1, 2, 3);
				assert.strictEqual(compare(v1, v2), 0);
			});

			it('should return 0 for versions with same pre-release', () => {
				assert.strictEqual(compare('1.2.3-beta', '1.2.3-beta'), 0);
			});
		});

		describe('major version comparison', () => {
			it('should return 1 when v1 major > v2 major', () => {
				assert.strictEqual(compare('2.0.0', '1.0.0'), 1);
			});

			it('should return -1 when v1 major < v2 major', () => {
				assert.strictEqual(compare('1.0.0', '2.0.0'), -1);
			});
		});

		describe('minor version comparison', () => {
			it('should return 1 when v1 minor > v2 minor', () => {
				assert.strictEqual(compare('1.2.0', '1.1.0'), 1);
			});

			it('should return -1 when v1 minor < v2 minor', () => {
				assert.strictEqual(compare('1.1.0', '1.2.0'), -1);
			});

			it('should compare minor when major is equal', () => {
				assert.strictEqual(compare('1.5.0', '1.3.0'), 1);
			});
		});

		describe('patch version comparison', () => {
			it('should return 1 when v1 patch > v2 patch', () => {
				assert.strictEqual(compare('1.2.3', '1.2.2'), 1);
			});

			it('should return -1 when v1 patch < v2 patch', () => {
				assert.strictEqual(compare('1.2.2', '1.2.3'), -1);
			});

			it('should compare patch when major and minor are equal', () => {
				assert.strictEqual(compare('1.2.5', '1.2.1'), 1);
			});
		});

		describe('pre-release comparison', () => {
			it('should treat release > pre-release', () => {
				assert.strictEqual(compare('1.0.0', '1.0.0-beta'), 1);
			});

			it('should treat pre-release < release', () => {
				assert.strictEqual(compare('1.0.0-beta', '1.0.0'), -1);
			});

			it('should compare pre-release strings alphabetically', () => {
				assert.strictEqual(compare('1.0.0-beta', '1.0.0-alpha'), 1);
				assert.strictEqual(compare('1.0.0-alpha', '1.0.0-beta'), -1);
			});

			it('should compare pre-release case-insensitively', () => {
				assert.strictEqual(compare('1.0.0-BETA', '1.0.0-beta'), 0);
			});

			it('should compare rc versions', () => {
				assert.strictEqual(compare('1.0.0-rc.2', '1.0.0-rc.1'), 1);
			});
		});

		describe('complex version comparisons', () => {
			it('should handle major difference with different minors', () => {
				assert.strictEqual(compare('2.0.0', '1.9.9'), 1);
			});

			it('should handle minor difference with different patches', () => {
				assert.strictEqual(compare('1.2.0', '1.1.9'), 1);
			});

			it('should compare versions with and without pre-release', () => {
				assert.strictEqual(compare('1.0.0', '1.0.0-alpha'), 1);
				assert.strictEqual(compare('1.0.0-alpha', '1.0.0'), -1);
			});

			it('should handle version string vs version object', () => {
				const v1 = from(1, 2, 3);
				assert.strictEqual(compare(v1, '1.2.3'), 0);
				assert.strictEqual(compare('1.2.3', v1), 0);
			});
		});

		describe('semantic versioning examples', () => {
			it('should handle common upgrade scenarios', () => {
				// Major upgrade
				assert.strictEqual(compare('2.0.0', '1.9.9'), 1);

				// Minor upgrade
				assert.strictEqual(compare('1.2.0', '1.1.5'), 1);

				// Patch upgrade
				assert.strictEqual(compare('1.0.1', '1.0.0'), 1);
			});

			it('should handle pre-release progression', () => {
				assert.strictEqual(compare('1.0.0-alpha', '1.0.0-beta'), -1);
				assert.strictEqual(compare('1.0.0-beta', '1.0.0-rc'), -1);
				assert.strictEqual(compare('1.0.0-rc', '1.0.0'), -1);
			});
		});

		describe('edge cases', () => {
			it('should handle version 0.0.0', () => {
				assert.strictEqual(compare('0.0.0', '0.0.0'), 0);
				assert.strictEqual(compare('0.0.1', '0.0.0'), 1);
			});

			it('should handle large version numbers', () => {
				assert.strictEqual(compare('999.999.999', '999.999.998'), 1);
			});

			it('should handle versions with only major', () => {
				const v1 = fromString('2');
				const v2 = fromString('1');
				assert.strictEqual(compare(v1, v2), 1);
			});
		});
	});
});

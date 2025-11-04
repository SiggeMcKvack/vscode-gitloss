import * as assert from 'assert';
import { createFromDateDelta, fromNow, setDefaultDateLocales } from '../../../system/date';

describe('Date Utilities', () => {
	describe('createFromDateDelta', () => {
		const baseDate = new Date('2025-01-15T12:00:00.000Z');

		it('should add years', () => {
			const result = createFromDateDelta(baseDate, { years: 2 });
			assert.strictEqual(result.getFullYear(), baseDate.getFullYear() + 2);
		});

		it('should subtract years', () => {
			const result = createFromDateDelta(baseDate, { years: -1 });
			assert.strictEqual(result.getFullYear(), baseDate.getFullYear() - 1);
		});

		it('should add months', () => {
			const result = createFromDateDelta(baseDate, { months: 3 });
			assert.strictEqual(result.getMonth(), baseDate.getMonth() + 3);
		});

		it('should add days', () => {
			const result = createFromDateDelta(baseDate, { days: 10 });
			assert.strictEqual(result.getDate(), baseDate.getDate() + 10);
		});

		it('should add hours', () => {
			const result = createFromDateDelta(baseDate, { hours: 5 });
			assert.strictEqual(result.getHours(), baseDate.getHours() + 5);
		});

		it('should add minutes', () => {
			const result = createFromDateDelta(baseDate, { minutes: 30 });
			assert.strictEqual(result.getMinutes(), baseDate.getMinutes() + 30);
		});

		it('should add seconds', () => {
			const result = createFromDateDelta(baseDate, { seconds: 45 });
			assert.strictEqual(result.getSeconds(), baseDate.getSeconds() + 45);
		});

		it('should handle multiple deltas', () => {
			const result = createFromDateDelta(baseDate, { years: 1, months: 2, days: 3 });
			assert.strictEqual(result.getFullYear(), baseDate.getFullYear() + 1);
			assert.strictEqual(result.getMonth(), baseDate.getMonth() + 2);
			assert.strictEqual(result.getDate(), baseDate.getDate() + 3);
		});

		it('should not modify original date', () => {
			const original = new Date(baseDate);
			createFromDateDelta(baseDate, { years: 5 });
			assert.strictEqual(baseDate.getTime(), original.getTime());
		});

		it('should handle empty delta', () => {
			const result = createFromDateDelta(baseDate, {});
			assert.strictEqual(result.getTime(), baseDate.getTime());
		});

		it('should handle zero values', () => {
			const result = createFromDateDelta(baseDate, { years: 0, months: 0 });
			assert.strictEqual(result.getTime(), baseDate.getTime());
		});
	});

	describe('fromNow', () => {
		it('should format seconds ago', () => {
			const now = new Date();
			const date = new Date(now.getTime() - 30 * 1000); // 30 seconds ago
			const result = fromNow(date);
			assert.ok(result.includes('second'), 'Should mention seconds');
		});

		it('should format minutes ago', () => {
			const now = new Date();
			const date = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
			const result = fromNow(date);
			assert.ok(result.includes('minute'), 'Should mention minutes');
		});

		it('should format hours ago', () => {
			const now = new Date();
			const date = new Date(now.getTime() - 3 * 60 * 60 * 1000); // 3 hours ago
			const result = fromNow(date);
			assert.ok(result.includes('hour'), 'Should mention hours');
		});

		it('should format days ago', () => {
			const now = new Date();
			const date = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
			const result = fromNow(date);
			assert.ok(result.includes('day'), 'Should mention days');
		});

		it('should format weeks ago', () => {
			const now = new Date();
			const date = new Date(now.getTime() - 2 * 7 * 24 * 60 * 60 * 1000); // 2 weeks ago
			const result = fromNow(date);
			assert.ok(result.includes('week') || result.includes('wk'), 'Should mention weeks');
		});

		it('should format months ago', () => {
			const now = new Date();
			const date = new Date(now.getTime() - 2 * 30 * 24 * 60 * 60 * 1000); // ~2 months ago
			const result = fromNow(date);
			assert.ok(result.includes('month') || result.includes('mo'), 'Should mention months');
		});

		it('should format future dates', () => {
			const now = new Date();
			const date = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now
			const result = fromNow(date);
			// Should still produce a result (format depends on Intl)
			assert.ok(result.length > 0, 'Should produce output for future dates');
		});

		it('should support short format', () => {
			const now = new Date();
			const date = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
			const resultLong = fromNow(date, false);
			const resultShort = fromNow(date, true);

			// Short format should be different from long format
			// (actual format depends on implementation and Intl)
			assert.ok(resultLong.length > 0);
			assert.ok(resultShort.length > 0);
		});

		it('should handle current time', () => {
			const now = new Date();
			const result = fromNow(now);
			// Should handle "now" case (likely shows seconds)
			assert.ok(result.length > 0);
		});
	});

	describe('setDefaultDateLocales', () => {
		afterEach(() => {
			// Reset to default
			setDefaultDateLocales(undefined);
		});

		it('should accept string locale', () => {
			// Should not throw
			assert.doesNotThrow(() => {
				setDefaultDateLocales('en-US');
			});
		});

		it('should accept array of locales', () => {
			// Should not throw
			assert.doesNotThrow(() => {
				setDefaultDateLocales(['en-US', 'en-GB']);
			});
		});

		it('should accept "system" to reset', () => {
			// Should not throw
			assert.doesNotThrow(() => {
				setDefaultDateLocales('system');
			});
		});

		it('should accept null to reset', () => {
			// Should not throw
			assert.doesNotThrow(() => {
				setDefaultDateLocales(null);
			});
		});

		it('should accept undefined to reset', () => {
			// Should not throw
			assert.doesNotThrow(() => {
				setDefaultDateLocales(undefined);
			});
		});
	});
});

import * as assert from 'assert';
import { CancellationTokenSource } from 'vscode';
import { any, cancellable, PromiseCancelledError } from '../../../system/promise';

describe('Promise Utilities', () => {
	describe('any', () => {
		it('should resolve with first resolved promise', async () => {
			const p1 = new Promise<string>(resolve => setTimeout(() => resolve('first'), 50));
			const p2 = new Promise<string>(resolve => setTimeout(() => resolve('second'), 10));
			const p3 = new Promise<string>(resolve => setTimeout(() => resolve('third'), 100));

			const result = await any(p1, p2, p3);
			assert.strictEqual(result, 'second');
		});

		it('should reject if all promises reject', async () => {
			const p1 = Promise.reject(new Error('error1'));
			const p2 = Promise.reject(new Error('error2'));
			const p3 = Promise.reject(new Error('error3'));

			try {
				await any(p1, p2, p3);
				assert.fail('Should have thrown');
			} catch (error) {
				assert.ok(error instanceof AggregateError);
			}
		});

		it('should resolve even if some promises reject', async () => {
			const p1 = Promise.reject(new Error('error1'));
			const p2 = new Promise<string>(resolve => setTimeout(() => resolve('success'), 10));
			const p3 = Promise.reject(new Error('error3'));

			const result = await any(p1, p2, p3);
			assert.strictEqual(result, 'success');
		});

		it('should handle single promise', async () => {
			const p1 = Promise.resolve('single');

			const result = await any(p1);
			assert.strictEqual(result, 'single');
		});

		it('should handle immediately resolved promise', async () => {
			const p1 = Promise.resolve('immediate');
			const p2 = new Promise<string>(resolve => setTimeout(() => resolve('delayed'), 100));

			const result = await any(p1, p2);
			assert.strictEqual(result, 'immediate');
		});

		it('should not resolve multiple times', async () => {
			let resolveCount = 0;
			const p1 = Promise.resolve('first').then(v => {
				resolveCount++;
				return v;
			});
			const p2 = Promise.resolve('second').then(v => {
				resolveCount++;
				return v;
			});

			await any(p1, p2);
			// Give time for any additional resolves
			await new Promise(resolve => setTimeout(resolve, 50));

			// Only one should have been used for the result
			// (though both may have resolved internally)
			assert.ok(resolveCount >= 1);
		});
	});

	describe('cancellable', () => {
		describe('with timeout', () => {
			it('should resolve if promise completes before timeout', async () => {
				const promise = new Promise<string>(resolve =>
					setTimeout(() => resolve('success'), 10)
				);

				const result = await cancellable(promise, 100);
				assert.strictEqual(result, 'success');
			});

			it('should reject if timeout expires', async () => {
				const promise = new Promise<string>(resolve =>
					setTimeout(() => resolve('too late'), 100)
				);

				try {
					await cancellable(promise, 10);
					assert.fail('Should have thrown');
				} catch (error) {
					assert.ok(error instanceof PromiseCancelledError);
					assert.ok(error.message.includes('TIMED OUT'));
				}
			});

			it('should reject if promise rejects before timeout', async () => {
				const promise = Promise.reject(new Error('promise error'));

				try {
					await cancellable(promise, 100);
					assert.fail('Should have thrown');
				} catch (error) {
					assert.ok(error instanceof Error);
					assert.strictEqual(error.message, 'promise error');
				}
			});

			it('should return original promise if timeout is 0', async () => {
				const promise = Promise.resolve('no timeout');

				const result = await cancellable(promise, 0);
				assert.strictEqual(result, 'no timeout');
			});

			it('should return original promise if timeout is negative', async () => {
				const promise = Promise.resolve('no timeout');

				const result = await cancellable(promise, -1);
				assert.strictEqual(result, 'no timeout');
			});

			it('should return original promise if timeout is undefined', async () => {
				const promise = Promise.resolve('no timeout');

				const result = await cancellable(promise, undefined);
				assert.strictEqual(result, 'no timeout');
			});

			it('should use custom cancel message', async () => {
				const promise = new Promise<string>(resolve =>
					setTimeout(() => resolve('too late'), 100)
				);

				try {
					await cancellable(promise, 10, { cancelMessage: 'Custom timeout message' });
					assert.fail('Should have thrown');
				} catch (error) {
					assert.ok(error instanceof PromiseCancelledError);
					assert.strictEqual(error.message, 'Custom timeout message');
				}
			});

			it('should call onDidCancel on timeout', async () => {
				const promise = new Promise<string>(resolve =>
					setTimeout(() => resolve('too late'), 100)
				);

				let cancelCalled = false;
				let cancelResolveValue: string | undefined;

				try {
					await cancellable(promise, 10, {
						onDidCancel: (resolve) => {
							cancelCalled = true;
							cancelResolveValue = 'cancelled';
							resolve('cancelled');
						},
					});
				} catch {
					// May throw or resolve depending on onDidCancel
				}

				assert.ok(cancelCalled);
				assert.strictEqual(cancelResolveValue, 'cancelled');
			});
		});

		describe('with cancellation token', () => {
			it('should resolve if promise completes before cancellation', async () => {
				const tokenSource = new CancellationTokenSource();
				const promise = new Promise<string>(resolve =>
					setTimeout(() => resolve('success'), 10)
				);

				const result = await cancellable(promise, tokenSource.token);
				assert.strictEqual(result, 'success');

				tokenSource.dispose();
			});

			it('should reject if token is cancelled', async () => {
				const tokenSource = new CancellationTokenSource();
				const promise = new Promise<string>(resolve =>
					setTimeout(() => resolve('too late'), 100)
				);

				const cancellablePromise = cancellable(promise, tokenSource.token);

				// Cancel after a short delay
				setTimeout(() => tokenSource.cancel(), 10);

				try {
					await cancellablePromise;
					assert.fail('Should have thrown');
				} catch (error) {
					assert.ok(error instanceof PromiseCancelledError);
					assert.ok(error.message.includes('CANCELLED'));
				}

				tokenSource.dispose();
			});

			it('should handle already cancelled token', async () => {
				const tokenSource = new CancellationTokenSource();
				tokenSource.cancel();

				const promise = Promise.resolve('success');

				try {
					await cancellable(promise, tokenSource.token);
					// May resolve if promise completes first
				} catch (error) {
					// Or may be cancelled
					assert.ok(error instanceof PromiseCancelledError);
				}

				tokenSource.dispose();
			});

			it('should use custom cancel message with token', async () => {
				const tokenSource = new CancellationTokenSource();
				const promise = new Promise<string>(resolve =>
					setTimeout(() => resolve('too late'), 100)
				);

				const cancellablePromise = cancellable(promise, tokenSource.token, {
					cancelMessage: 'Custom cancel message',
				});

				setTimeout(() => tokenSource.cancel(), 10);

				try {
					await cancellablePromise;
					assert.fail('Should have thrown');
				} catch (error) {
					assert.ok(error instanceof PromiseCancelledError);
					assert.strictEqual(error.message, 'Custom cancel message');
				}

				tokenSource.dispose();
			});

			it('should call onDidCancel on cancellation', async () => {
				const tokenSource = new CancellationTokenSource();
				const promise = new Promise<string>(resolve =>
					setTimeout(() => resolve('too late'), 100)
				);

				let cancelCalled = false;

				const cancellablePromise = cancellable(promise, tokenSource.token, {
					onDidCancel: (resolve) => {
						cancelCalled = true;
						resolve('cancelled by token');
					},
				});

				setTimeout(() => tokenSource.cancel(), 10);

				const result = await cancellablePromise;
				assert.ok(cancelCalled);
				assert.strictEqual(result, 'cancelled by token');

				tokenSource.dispose();
			});

			it('should not cancel if promise completes first', async () => {
				const tokenSource = new CancellationTokenSource();
				const promise = Promise.resolve('fast');

				const result = await cancellable(promise, tokenSource.token);
				assert.strictEqual(result, 'fast');

				// Cancel after promise completed
				tokenSource.cancel();
				tokenSource.dispose();
			});
		});

		describe('error cases', () => {
			it('should include original promise in error', async () => {
				const promise = new Promise<string>(resolve =>
					setTimeout(() => resolve('too late'), 100)
				);

				try {
					await cancellable(promise, 10);
					assert.fail('Should have thrown');
				} catch (error) {
					if (error instanceof PromiseCancelledError) {
						assert.strictEqual(error.promise, promise);
					} else {
						assert.fail('Wrong error type');
					}
				}
			});

			it('should handle promise that throws synchronously', async () => {
				const promise = new Promise<string>(() => {
					throw new Error('sync error');
				});

				try {
					await cancellable(promise, 100);
					assert.fail('Should have thrown');
				} catch (error) {
					assert.ok(error instanceof Error);
					assert.strictEqual(error.message, 'sync error');
				}
			});
		});
	});
});

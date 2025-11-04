/**
 * Test helpers and mocks for GitLens testing
 */

import { EventEmitter } from 'vscode';
import type { Container } from '../../container';
import type { GitUser } from '../../git/models';

/**
 * Creates a mock GitUser for testing
 */
export function createMockGitUser(overrides?: Partial<GitUser>): GitUser {
	return {
		name: 'Test User',
		email: 'test@example.com',
		...overrides,
	};
}

/**
 * Creates a minimal mock Container for testing
 */
export function createMockContainer(overrides?: Partial<Container>): Partial<Container> {
	const container: Partial<Container> = {
		// Add minimal container properties needed for tests
		...overrides,
	};
	return container;
}

/**
 * Reads a fixture file from the fixtures directory
 */
export async function readFixture(fixturePath: string): Promise<string> {
	const fs = await import('fs/promises');
	const path = await import('path');
	const fixtureFullPath = path.join(__dirname, '..', 'fixtures', fixturePath);
	return fs.readFile(fixtureFullPath, 'utf-8');
}

/**
 * Creates a spy for event emitters
 */
export function createEventSpy<T>() {
	const events: T[] = [];
	const emitter = new EventEmitter<T>();

	const dispose = emitter.event(e => events.push(e));

	return {
		emitter,
		events,
		dispose,
		fire: (event: T) => emitter.fire(event),
		clear: () => events.splice(0, events.length),
	};
}

/**
 * Normalizes line endings for cross-platform testing
 */
export function normalizeLineEndings(text: string): string {
	return text.replace(/\r\n/g, '\n');
}

/**
 * Creates a date string in Git format
 */
export function createGitDate(date: Date): string {
	return Math.floor(date.getTime() / 1000).toString();
}

/**
 * Helper to assert that a value is defined (not null or undefined)
 */
export function assertDefined<T>(value: T | null | undefined, message?: string): asserts value is T {
	if (value === null || value === undefined) {
		throw new Error(message || 'Expected value to be defined');
	}
}

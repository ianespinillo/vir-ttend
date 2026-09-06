import { describe, expect, it } from 'vitest';
import { loadReadIds, persistReadId } from './read-state';

const fakeStorage = (initial: Record<string, string> = {}) => {
	const map = { ...initial };
	return {
		getItem: (k: string) => map[k] ?? null,
		setItem: (k: string, v: string) => {
			map[k] = v;
		},
	};
};

describe('read-state', () => {
	it('devuelve set vacío si no hay nada guardado o userId vacío', () => {
		const storage = fakeStorage();
		expect(loadReadIds('', storage).size).toBe(0);
		expect(loadReadIds('u1', storage).size).toBe(0);
	});

	it('lee ids persistidos por usuario', () => {
		const storage = fakeStorage({
			'vt.annc.read.u1': JSON.stringify(['a', 'b']),
		});
		expect(loadReadIds('u1', storage)).toEqual(new Set(['a', 'b']));
	});

	it('tolera JSON corrupto', () => {
		const storage = fakeStorage({ 'vt.annc.read.u1': '{oops' });
		expect(loadReadIds('u1', storage).size).toBe(0);
	});

	it('persistReadId agrega sin duplicados', () => {
		const storage = fakeStorage({
			'vt.annc.read.u1': JSON.stringify(['a']),
		});
		persistReadId('u1', 'a', storage);
		persistReadId('u1', 'b', storage);
		expect(loadReadIds('u1', storage)).toEqual(new Set(['a', 'b']));
	});
});

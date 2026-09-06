export interface MinimalStorage {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
}

const storageKey = (userId: string) => `vt.annc.read.${userId}`;

export function loadReadIds(
	userId: string,
	storage: MinimalStorage = window.localStorage,
): Set<string> {
	if (!userId) return new Set();
	try {
		const raw = storage.getItem(storageKey(userId));
		const parsed = raw ? (JSON.parse(raw) as unknown) : [];
		return new Set(Array.isArray(parsed) ? (parsed as string[]) : []);
	} catch {
		return new Set();
	}
}

export function persistReadId(
	userId: string,
	id: string,
	storage: MinimalStorage = window.localStorage,
): void {
	if (!userId || !id) return;
	const ids = loadReadIds(userId, storage);
	ids.add(id);
	storage.setItem(storageKey(userId), JSON.stringify([...ids]));
}

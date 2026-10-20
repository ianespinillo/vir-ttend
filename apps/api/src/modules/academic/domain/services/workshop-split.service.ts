interface Named {
	lastName: string;
	firstName: string;
}

/** Suggests how a course is split into its workshop commissions. */
export class WorkshopSplitService {
	/**
	 * Sorts alphabetically (last name, then first name; case and accent
	 * insensitive) and returns one group per commission, in commission order.
	 * With two commissions it cuts at ceil(n/2): the first half goes to
	 * commission 1, the rest to commission 2. With one, everyone goes to it.
	 */
	static split<T extends Named>(students: T[], count: 1 | 2 = 2): T[][] {
		const sorted = WorkshopSplitService.sortAlphabetically(students);
		if (count === 1) return [sorted];
		const cut = Math.ceil(sorted.length / 2);
		return [sorted.slice(0, cut), sorted.slice(cut)];
	}

	static sortAlphabetically<T extends Named>(students: T[]): T[] {
		const compare = (a: string, b: string) =>
			a.localeCompare(b, 'es', { sensitivity: 'base' });
		return [...students].sort(
			(a, b) =>
				compare(a.lastName, b.lastName) || compare(a.firstName, b.firstName),
		);
	}
}

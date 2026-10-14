interface Named {
	lastName: string;
	firstName: string;
}

/** Suggests the 50/50 split of a course into its two workshop commissions. */
export class WorkshopSplitService {
	/**
	 * Sorts alphabetically (last name, then first name; case and accent
	 * insensitive) and cuts at ceil(n/2): the first half goes to commission 1,
	 * the rest to commission 2.
	 */
	static split<T extends Named>(students: T[]): [T[], T[]] {
		const sorted = WorkshopSplitService.sortAlphabetically(students);
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

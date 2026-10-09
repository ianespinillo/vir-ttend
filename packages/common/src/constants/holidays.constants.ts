export interface StandardHoliday {
	readonly date: string; // 'MM-DD'
	readonly name: string;
}

export const STANDARD_NATIONAL_HOLIDAYS: readonly StandardHoliday[] = [
	{ date: '01-01', name: 'Año Nuevo' },
	{
		date: '03-24',
		name: 'Día Nacional de la Memoria por la Verdad y la Justicia',
	},
	{
		date: '04-02',
		name: 'Día del Veterano y de los Caídos en la Guerra de Malvinas',
	},
	{ date: '05-01', name: 'Día del Trabajador' },
	{ date: '05-25', name: 'Día de la Revolución de Mayo' },
	{ date: '06-20', name: 'Paso a la Inmortalidad del General Manuel Belgrano' },
	{ date: '07-09', name: 'Día de la Independencia' },
	{
		date: '08-17',
		name: 'Paso a la Inmortalidad del General José de San Martín',
	},
	{ date: '10-12', name: 'Día del Respeto a la Diversidad Cultural' },
	{ date: '11-20', name: 'Día de la Soberanía Nacional' },
	{ date: '12-08', name: 'Inmaculada Concepción de María' },
	{ date: '12-25', name: 'Navidad' },
] as const;

export const YEAR_SPECIFIC_HOLIDAYS: Record<
	number,
	readonly { readonly date: string; readonly name: string }[]
> = {
	2026: [
		{ date: '2026-02-16', name: 'Carnaval' },
		{ date: '2026-04-03', name: 'Viernes Santo' },
	],
};

/**
 * Returns standard national holiday date strings ('YYYY-MM-DD') for a given year.
 */
export function getStandardNationalHolidays(year: number): string[] {
	const fixed = STANDARD_NATIONAL_HOLIDAYS.map((h) => `${year}-${h.date}`);
	const specific = (YEAR_SPECIFIC_HOLIDAYS[year] ?? []).map((h) => h.date);
	return Array.from(new Set([...fixed, ...specific])).sort();
}

/**
 * Retrieves the holiday name for a given ISO date string or Date object.
 */
export function getHolidayName(date: string | Date): string | undefined {
	const raw = typeof date === 'string' ? date : date.toISOString();
	const normalized = raw.split('T')[0];
	if (!normalized) return undefined;

	for (const list of Object.values(YEAR_SPECIFIC_HOLIDAYS)) {
		const match = list.find((h) => h.date === normalized);
		if (match) return match.name;
	}

	const monthDay = normalized.slice(5);
	const fixedMatch = STANDARD_NATIONAL_HOLIDAYS.find((h) => h.date === monthDay);
	return fixedMatch?.name;
}

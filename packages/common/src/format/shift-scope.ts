import { SHIFT } from '../constants/shift.enum.js';

const SHIFT_PHRASES: Record<SHIFT, string> = {
	[SHIFT.MORNING]: 'mañana',
	[SHIFT.AFTERNOON]: 'tarde',
	[SHIFT.EVENING]: 'noche',
};

/**
 * Spanish phrase for the shifts a suspension applies to: "turno mañana",
 * "turnos mañana y tarde", "turnos mañana, tarde y noche". An empty scope
 * means every shift and yields an empty string.
 */
export function describeShiftScope(
	shifts: readonly SHIFT[] | undefined,
): string {
	const names = (shifts ?? []).map(
		(shift) => SHIFT_PHRASES[shift] ?? String(shift).toLowerCase(),
	);
	if (names.length === 0) return '';
	if (names.length === 1) return `turno ${names[0]}`;
	return `turnos ${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;
}

import { DAYOFWEEK } from '@repo/common';
import {
	AudienceSlot,
	resolveSubjectAudience,
} from '../../../src/modules/attendance/domain/services/subject-audience';

const slot = (
	dayOfWeek: DAYOFWEEK,
	commissionNumber: 1 | 2 | null,
): AudienceSlot => ({ dayOfWeek, commissionNumber });

describe('resolveSubjectAudience', () => {
	it('should target the whole course when the subject has no slots', () => {
		expect(resolveSubjectAudience([])).toBe('whole-course');
		expect(resolveSubjectAudience([], DAYOFWEEK.MONDAY)).toBe('whole-course');
	});

	it('should target the whole course for a theory subject (slots without commission)', () => {
		const slots = [slot(DAYOFWEEK.MONDAY, null), slot(DAYOFWEEK.TUESDAY, null)];

		expect(resolveSubjectAudience(slots)).toBe('whole-course');
		expect(resolveSubjectAudience(slots, DAYOFWEEK.MONDAY)).toBe('whole-course');
	});

	it('should target only the commission its slots target', () => {
		const slots = [slot(DAYOFWEEK.MONDAY, 2), slot(DAYOFWEEK.THURSDAY, 2)];

		expect(resolveSubjectAudience(slots)).toEqual([2]);
		expect(resolveSubjectAudience(slots, DAYOFWEEK.MONDAY)).toEqual([2]);
	});

	it('should use the slots of the weekday when slots are mixed', () => {
		const slots = [slot(DAYOFWEEK.MONDAY, 1), slot(DAYOFWEEK.WEDNESDAY, 2)];

		expect(resolveSubjectAudience(slots, DAYOFWEEK.MONDAY)).toEqual([1]);
		expect(resolveSubjectAudience(slots, DAYOFWEEK.WEDNESDAY)).toEqual([2]);
	});

	it('should use every slot when the weekday has none, or no weekday is given', () => {
		const slots = [slot(DAYOFWEEK.WEDNESDAY, 2), slot(DAYOFWEEK.MONDAY, 1)];

		expect(resolveSubjectAudience(slots, DAYOFWEEK.FRIDAY)).toEqual([1, 2]);
		expect(resolveSubjectAudience(slots)).toEqual([1, 2]);
	});

	it('should target the whole course when a considered slot targets both commissions', () => {
		const slots = [
			slot(DAYOFWEEK.MONDAY, 1),
			slot(DAYOFWEEK.MONDAY, null),
			slot(DAYOFWEEK.TUESDAY, 2),
		];

		expect(resolveSubjectAudience(slots, DAYOFWEEK.MONDAY)).toBe('whole-course');
		expect(resolveSubjectAudience(slots, DAYOFWEEK.TUESDAY)).toEqual([2]);
		expect(resolveSubjectAudience(slots)).toBe('whole-course');
	});
});

import { ATTENDANCE_STATUS } from '@repo/common';
import { LatePolicyService } from '../../../src/modules/attendance/domain/services/late-policy.service';

describe('LatePolicyService', () => {
	let service: LatePolicyService;
	const config = { lateCountsAsAbsenceAfterMinutes: 15 };

	beforeEach(() => {
		service = new LatePolicyService();
	});

	describe('isLateCountedAsAbsence', () => {
		it('debe retornar false si los minutos son menores al umbral', () => {
			expect(
				service.isLateCountedAsAbsence(10, config.lateCountsAsAbsenceAfterMinutes),
			).toBe(false);
		});

		it('debe retornar true si los minutos igualan el umbral', () => {
			expect(
				service.isLateCountedAsAbsence(15, config.lateCountsAsAbsenceAfterMinutes),
			).toBe(true);
		});

		it('debe retornar true si los minutos superan el umbral', () => {
			expect(
				service.isLateCountedAsAbsence(20, config.lateCountsAsAbsenceAfterMinutes),
			).toBe(true);
		});
	});

	describe('adjustStatus', () => {
		it('debe retornar el mismo estado si no es LATE', () => {
			expect(
				service.adjustStatus(
					ATTENDANCE_STATUS.PRESENT,
					30,
					config.lateCountsAsAbsenceAfterMinutes,
				),
			).toBe(ATTENDANCE_STATUS.PRESENT);
			expect(
				service.adjustStatus(
					ATTENDANCE_STATUS.ABSENT,
					0,
					config.lateCountsAsAbsenceAfterMinutes,
				),
			).toBe(ATTENDANCE_STATUS.ABSENT);
			expect(
				service.adjustStatus(
					ATTENDANCE_STATUS.JUSTIFIED,
					0,
					config.lateCountsAsAbsenceAfterMinutes,
				),
			).toBe(ATTENDANCE_STATUS.JUSTIFIED);
		});

		it('debe retornar LATE si el estado es LATE pero no supera el umbral', () => {
			expect(
				service.adjustStatus(
					ATTENDANCE_STATUS.LATE,
					10,
					config.lateCountsAsAbsenceAfterMinutes,
				),
			).toBe(ATTENDANCE_STATUS.LATE);
		});

		it('debe retornar ABSENT si el estado es LATE y cruza el umbral', () => {
			expect(
				service.adjustStatus(
					ATTENDANCE_STATUS.LATE,
					15,
					config.lateCountsAsAbsenceAfterMinutes,
				),
			).toBe(ATTENDANCE_STATUS.ABSENT);
			expect(
				service.adjustStatus(
					ATTENDANCE_STATUS.LATE,
					45,
					config.lateCountsAsAbsenceAfterMinutes,
				),
			).toBe(ATTENDANCE_STATUS.ABSENT);
		});
	});
});

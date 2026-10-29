import { SHIFT } from '@repo/common';
import { TheoryNotHeldDaysService } from '../../../src/modules/attendance/application/services/theory-not-held-days.service';
import { DailySessionNotHeld } from '../../../src/modules/attendance/domain/entities/daily-session-not-held.entity';

const utc = (day: string) => new Date(`${day}T00:00:00.000Z`);
const marker = (day: string) =>
	DailySessionNotHeld.create({
		tenantId: 't',
		courseId: 'course-1',
		date: utc(day),
		createdBy: 'u',
	});

describe('TheoryNotHeldDaysService', () => {
	const course = {
		id: 'course-1',
		academicYearId: 'year-1',
		shift: SHIFT.MORNING,
		isWorkshopOnly: false,
	};
	const from = utc('2026-03-01');
	const to = utc('2026-03-31');

	function build(markers: string[], suspensions: string[]) {
		const notHeldRepo = {
			findByCourseAndDateRange: jest.fn().mockResolvedValue(markers.map(marker)),
		};
		const academicYearPort = {
			getNonWorkingDays: jest.fn().mockResolvedValue(suspensions),
		};
		const service = new TheoryNotHeldDaysService(
			notHeldRepo as never,
			academicYearPort as never,
		);
		return { service, notHeldRepo, academicYearPort };
	}

	it('joins the marked days and the suspensions of the shift, sorted and without repeats', async () => {
		const { service, notHeldRepo, academicYearPort } = build(
			['2026-03-12', '2026-03-05'],
			['2026-03-05', '2026-03-02'],
		);

		await expect(service.forCourse(course, from, to)).resolves.toEqual([
			'2026-03-02',
			'2026-03-05',
			'2026-03-12',
		]);
		expect(notHeldRepo.findByCourseAndDateRange).toHaveBeenCalledWith(
			'course-1',
			from,
			to,
		);
		expect(academicYearPort.getNonWorkingDays).toHaveBeenCalledWith(
			'year-1',
			SHIFT.MORNING,
			from,
			to,
		);
	});

	it('has none when the theory was always held', async () => {
		const { service } = build([], []);

		await expect(service.forCourse(course, from, to)).resolves.toEqual([]);
	});

	it('has none in a workshop-only course and reads nothing', async () => {
		const { service, notHeldRepo, academicYearPort } = build(
			['2026-03-05'],
			['2026-03-02'],
		);

		await expect(
			service.forCourse({ ...course, isWorkshopOnly: true }, from, to),
		).resolves.toEqual([]);
		expect(notHeldRepo.findByCourseAndDateRange).not.toHaveBeenCalled();
		expect(academicYearPort.getNonWorkingDays).not.toHaveBeenCalled();
	});
});

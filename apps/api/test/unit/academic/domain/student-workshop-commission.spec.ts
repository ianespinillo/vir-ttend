import { STUDENTSTATUS } from '@repo/common';
import { Student } from '../../../../src/modules/academic/domain/entities/student.entity';

const student = (workshopCommissionId?: string | null) =>
	Student.reconstitute({
		id: 'student-1',
		tenantId: 'tenant-1',
		courseId: 'course-1',
		firstName: 'Juan',
		lastName: 'Garcia',
		documentNumber: '12345678',
		birthDate: new Date('2010-05-15'),
		tutorName: 'Maria Garcia',
		tutorPhone: '1123456789',
		status: STUDENTSTATUS.ACTIVE,
		workshopCommissionId,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

describe('Student workshop commission', () => {
	it('has no commission by default', () => {
		expect(student().workshopCommissionId).toBeNull();
	});

	it('assigns and clears a commission', () => {
		const s = student();
		s.assignWorkshopCommission('commission-1');
		expect(s.workshopCommissionId).toBe('commission-1');

		s.clearWorkshopCommission();
		expect(s.workshopCommissionId).toBeNull();
	});

	it('clears the commission when moved to another course', () => {
		const s = student('commission-1');
		s.enrollInCourse('course-2');
		expect(s.courseId).toBe('course-2');
		expect(s.workshopCommissionId).toBeNull();
	});

	it('keeps the commission when re-enrolled in the same course', () => {
		const s = student('commission-1');
		s.enrollInCourse('course-1');
		expect(s.workshopCommissionId).toBe('commission-1');
	});
});

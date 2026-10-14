import { EntityManager } from '@mikro-orm/core';
import { STUDENTSTATUS } from '@repo/common';
import { Student } from '../../../../src/modules/academic/domain/entities/student.entity';
import { CourseOrmEntity } from '../../../../src/modules/academic/infrastructure/persistence/entities/courses.orm-entity';
import { StudentOrmEntity } from '../../../../src/modules/academic/infrastructure/persistence/entities/student.orm-entity';
import { StudentMapper } from '../../../../src/modules/academic/infrastructure/persistence/mappers/student.mapper';

describe('StudentMapper', () => {
	it('asigna la relación course con em.getReference en toOrm', () => {
		const courseId = 'course-uuid-1';
		const domain = Student.create({
			courseId,
			tenantId: 'tenant-uuid-1',
			firstName: 'Ana',
			lastName: 'Gomez',
			documentNumber: '12345678',
			birthDate: new Date('2010-05-01'),
			tutorName: 'Luis Gomez',
			tutorPhone: '1122334455',
		});

		const em = {
			getReference: jest.fn((_entity: unknown, id: string) => ({ id })),
		} as unknown as EntityManager;

		const orm = StudentMapper.toOrm(domain, em);

		expect(orm.courseId).toBe(courseId);
		expect(orm.course).toEqual({ id: courseId });
		expect(em.getReference).toHaveBeenCalledWith(CourseOrmEntity, courseId);
	});

	it.each<string | null>(['commission-1', null])(
		'conserva workshopCommissionId=%s en toDomain',
		(workshopCommissionId) => {
			const orm = new StudentOrmEntity();
			orm.id = 'student-1';
			orm.courseId = 'course-1';
			orm.tenantId = 'tenant-1';
			orm.firstName = 'Ana';
			orm.lastName = 'Gomez';
			orm.documentNumber = '12345678';
			orm.birthDate = new Date('2010-05-01');
			orm.tutorName = 'Luis Gomez';
			orm.tutorPhone = '1122334455';
			orm.status = STUDENTSTATUS.ACTIVE;
			orm.createdAt = new Date();
			orm.updatedAt = new Date();
			orm.workshopCommissionId = workshopCommissionId;

			expect(StudentMapper.toDomain(orm).workshopCommissionId).toBe(
				workshopCommissionId,
			);
		},
	);
});

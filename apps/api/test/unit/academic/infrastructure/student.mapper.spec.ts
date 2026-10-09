import { EntityManager } from '@mikro-orm/core';
import { Student } from '../../../../src/modules/academic/domain/entities/student.entity';
import { CourseOrmEntity } from '../../../../src/modules/academic/infrastructure/persistence/entities/courses.orm-entity';
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
});

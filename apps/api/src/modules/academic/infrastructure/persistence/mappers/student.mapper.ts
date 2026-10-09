import { EntityManager } from '@mikro-orm/core';
import { Student } from '../../../domain/entities/student.entity';
import { CourseOrmEntity } from '../entities/courses.orm-entity';
import { StudentOrmEntity } from '../entities/student.orm-entity';

export class StudentMapper {
	static toOrm(domain: Student, em: EntityManager): StudentOrmEntity {
		const student = new StudentOrmEntity();
		student.id = domain.id;
		student.courseId = domain.courseId;
		student.course = em.getReference(CourseOrmEntity, domain.courseId);
		student.tutorName = domain.tutorName;
		student.tutorEmail = domain.tutorEmail;
		student.tutorPhone = domain.tutorPhone;
		student.status = domain.status;
		student.birthDate = domain.birthDate;
		student.createdAt = domain.createdAt;
		student.updatedAt = domain.updatedAt;
		student.documentNumber = domain.documentNumber.getValue();
		student.firstName = domain.firstName;
		student.lastName = domain.lastName;
		student.tenantId = domain.tenantId;
		return student;
	}
	static toDomain(orm: StudentOrmEntity): Student {
		return Student.reconstitute(orm);
	}
}

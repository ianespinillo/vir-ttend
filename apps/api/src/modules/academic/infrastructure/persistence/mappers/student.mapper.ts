import { Student } from '../../../domain/entities/student.entity';
import { StudentOrmEntity } from '../entities/student.orm-entity';

export class StudentMapper {
	static toOrm(domain: Student): StudentOrmEntity {
		const student = new StudentOrmEntity();
		student.id = domain.id;
		student.courseId = domain.courseId;
		student.tutorEmail = domain.tutorEmail;
		student.tutorPhone = domain.tutorPhone;
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

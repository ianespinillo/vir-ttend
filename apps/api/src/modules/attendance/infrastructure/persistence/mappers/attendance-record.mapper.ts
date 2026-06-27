import { AttendanceRecord } from '../../../domain/entities/attendance-record.entity';
import { AttendanceRecordOrmEntity } from '../entities/attendance-record.orm-entity';

export class AttendanceRecordMapper {
	static toOrm(domain: AttendanceRecord): AttendanceRecordOrmEntity {
		const entity = new AttendanceRecordOrmEntity();
		entity.id = domain.id;
		entity.date = domain.date;
		entity.status = domain.status;
		entity.courseId = domain.courseId;
		entity.editedBy = domain.editedBy;
		entity.createdAt = domain.createdAt;
		entity.studentId = domain.studentId;
		entity.subjectId = domain.subjectId;
		entity.tenantId = domain.tenantId;
		return entity;
	}
	static toDomain(orm: AttendanceRecordOrmEntity): AttendanceRecord {
		return AttendanceRecord.reconstitute({ ...orm });
	}
}

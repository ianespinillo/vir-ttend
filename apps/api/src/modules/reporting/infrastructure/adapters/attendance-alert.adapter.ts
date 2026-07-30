import { Injectable } from '@nestjs/common';
import { AttendanceAlert as AttendanceAttendanceAlert } from '../../../attendance/domain/entities/attendance-alert.entity';
import { AttendanceAlertRepository } from '../../../attendance/infrastructure/persistence/repository/attendance-alert.repository';
import { AttendanceAlert } from '../../domain/entities/attendance-alert.entity';
import { IAttendanceAlertPort } from '../../domain/ports/attendance-alert.port.interface';

@Injectable()
export class AttendanceAlertAdapter implements IAttendanceAlertPort {
	constructor(private readonly alertRepo: AttendanceAlertRepository) {}
	async findByStudentId(id: string): Promise<AttendanceAlert[]> {
		const alerts = await this.alertRepo.findByStudentId(id);
		return alerts.map(this.toDomain);
	}
	private toDomain(a: AttendanceAttendanceAlert): AttendanceAlert {
		return AttendanceAlert.reconstitute({
			id: a.id,
			studentId: a.studentId,
			courseId: a.courseId,
			alertType: a.alertType,
		});
	}
}

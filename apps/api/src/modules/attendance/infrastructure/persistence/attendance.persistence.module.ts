import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { AttendanceAlertOrmEntity } from './entities/attendance-alert.orm-entity';
import { AttendanceRecordOrmEntity } from './entities/attendance-record.orm-entity';
import { JustificationOrmEntity } from './entities/justification.orm-entity';
import { AttendanceAlertRepository } from './repository/attendance-alert.repository';
import { AttendanceRecordRepository } from './repository/attendance-record.repository';
import { JustificationRepository } from './repository/justification.repository';

@Module({
	providers: [
		JustificationRepository,
		AttendanceRecordRepository,
		AttendanceAlertRepository,
	],
	imports: [
		MikroOrmModule.forFeature([
			JustificationOrmEntity,
			AttendanceRecordOrmEntity,
			AttendanceAlertOrmEntity,
		]),
	],
	exports: [
		JustificationRepository,
		AttendanceRecordRepository,
		AttendanceAlertRepository,
	],
})
export class AttendancePersistenceModule {}

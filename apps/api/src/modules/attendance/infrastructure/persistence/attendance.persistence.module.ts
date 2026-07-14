import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { AttendanceAlertOrmEntity } from './entities/attendance-alert.orm-entity';
import { AttendanceRecordOrmEntity } from './entities/attendance-record.orm-entity';
import { JustificationOrmEntity } from './entities/justification.orm-entity';
import { AttendanceRecordRepository } from './repository/attendance-record.repository';
import { JustificationRepository } from './repository/justification.repository';

@Module({
	providers: [JustificationRepository, AttendanceRecordRepository],
	imports: [
		MikroOrmModule.forFeature([
			JustificationOrmEntity,
			AttendanceRecordOrmEntity,
			AttendanceAlertOrmEntity,
		]),
	],
	exports: [JustificationRepository, AttendanceRecordRepository],
})
export class AttendancePersistenceModule {}

import { MikroOrmModule } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { Module } from '@nestjs/common';
import { AttendanceAlertOrmEntity } from './entities/attendance-alert.orm-entity';
import { AttendanceRecordOrmEntity } from './entities/attendance-record.orm-entity';
import { JustificationOrmEntity } from './entities/justification.orm-entity';
import { AttendanceAlertRepository } from './repository/attendance-alert.repository';
import { AttendanceRecordRepository } from './repository/attendance-record.repository';
import { JustificationRepository } from './repository/justification.repository';

@Module({
	imports: [
		MikroOrmModule.forFeature([
			JustificationOrmEntity,
			AttendanceRecordOrmEntity,
			AttendanceAlertOrmEntity,
		]),
	],
	providers: [
		AttendanceRecordRepository,
		{
			provide: AttendanceAlertRepository,
			useFactory: (em: EntityManager) =>
				em.getRepository(AttendanceAlertOrmEntity),
			inject: [EntityManager],
		},
		{
			provide: JustificationRepository,
			useFactory: (em: EntityManager) => em.getRepository(JustificationOrmEntity),
			inject: [EntityManager],
		},
		{
			provide: 'IAttendanceRecordRepository',
			useExisting: AttendanceRecordRepository,
		},
		{
			provide: 'IAttendanceAlertRepository',
			useExisting: AttendanceAlertRepository,
		},
		{
			provide: 'IJustificationRepository',
			useExisting: JustificationRepository,
		},
	],
	exports: [
		JustificationRepository,
		AttendanceRecordRepository,
		AttendanceAlertRepository,
		'IAttendanceRecordRepository',
		'IAttendanceAlertRepository',
		'IJustificationRepository',
	],
})
export class AttendancePersistenceModule {}

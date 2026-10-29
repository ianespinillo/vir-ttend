import { MikroOrmModule } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { Module } from '@nestjs/common';
import { AfterCommitQueue } from './after-commit.queue';
import { AttendanceAlertOrmEntity } from './entities/attendance-alert.orm-entity';
import { AttendanceRecordOrmEntity } from './entities/attendance-record.orm-entity';
import { DailySessionNotHeldOrmEntity } from './entities/daily-session-not-held.orm-entity';
import { JustificationOrmEntity } from './entities/justification.orm-entity';
import { WorkshopAttendanceRecordOrmEntity } from './entities/workshop-attendance-record.orm-entity';
import { WorkshopJustificationOrmEntity } from './entities/workshop-justification.orm-entity';
import { AttendanceAlertRepository } from './repository/attendance-alert.repository';
import { AttendanceRecordRepository } from './repository/attendance-record.repository';
import { DailySessionNotHeldRepository } from './repository/daily-session-not-held.repository';
import { JustificationRepository } from './repository/justification.repository';
import { WorkshopAttendanceRecordRepository } from './repository/workshop-attendance-record.repository';
import { WorkshopJustificationRepository } from './repository/workshop-justification.repository';

@Module({
	imports: [
		MikroOrmModule.forFeature([
			JustificationOrmEntity,
			AttendanceRecordOrmEntity,
			AttendanceAlertOrmEntity,
			WorkshopAttendanceRecordOrmEntity,
			WorkshopJustificationOrmEntity,
			DailySessionNotHeldOrmEntity,
		]),
	],
	providers: [
		AfterCommitQueue,
		AttendanceRecordRepository,
		{
			provide: WorkshopAttendanceRecordRepository,
			useFactory: (em: EntityManager) =>
				em.getRepository(WorkshopAttendanceRecordOrmEntity),
			inject: [EntityManager],
		},
		{
			provide: 'IWorkshopAttendanceRecordRepository',
			useExisting: WorkshopAttendanceRecordRepository,
		},
		{
			provide: WorkshopJustificationRepository,
			useFactory: (em: EntityManager) =>
				em.getRepository(WorkshopJustificationOrmEntity),
			inject: [EntityManager],
		},
		{
			provide: 'IWorkshopJustificationRepository',
			useExisting: WorkshopJustificationRepository,
		},
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
			provide: DailySessionNotHeldRepository,
			useFactory: (em: EntityManager) =>
				em.getRepository(DailySessionNotHeldOrmEntity),
			inject: [EntityManager],
		},
		{
			provide: 'IDailySessionNotHeldRepository',
			useExisting: DailySessionNotHeldRepository,
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
		AfterCommitQueue,
		JustificationRepository,
		AttendanceRecordRepository,
		AttendanceAlertRepository,
		'IAttendanceRecordRepository',
		'IAttendanceAlertRepository',
		'IJustificationRepository',
		'IDailySessionNotHeldRepository',
		'IWorkshopAttendanceRecordRepository',
		'IWorkshopJustificationRepository',
	],
})
export class AttendancePersistenceModule {}

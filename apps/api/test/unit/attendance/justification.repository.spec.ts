import { MikroORM } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { Justification } from '../../../src/modules/attendance/domain/entities/justification.entity';
import { AttendanceRecordOrmEntity } from '../../../src/modules/attendance/infrastructure/persistence/entities/attendance-record.orm-entity';
import { JustificationOrmEntity } from '../../../src/modules/attendance/infrastructure/persistence/entities/justification.orm-entity';
import { JustificationRepository } from '../../../src/modules/attendance/infrastructure/persistence/repository/justification.repository';

const RECORD_ID = '11111111-1111-4111-8111-111111111111';
const USER_ID = '22222222-2222-4222-8222-222222222222';

describe('JustificationRepository.save (ORM change sets)', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await MikroORM.init({
			entities: [AttendanceRecordOrmEntity, JustificationOrmEntity],
			metadataProvider: TsMorphMetadataProvider,
			dbName: 'probe',
			connect: false,
			allowGlobalContext: true,
		});
	}, 60000);

	afterAll(async () => {
		await orm.close(true);
	});

	function setup() {
		const em = orm.em.fork();
		const repo = new JustificationRepository(em, JustificationOrmEntity);
		let payloads: Record<string, unknown>[] = [];
		jest.spyOn(em, 'flush').mockImplementation(async () => {
			const uow = em.getUnitOfWork();
			uow.computeChangeSets();
			payloads = uow.getChangeSets().map((c) => c.payload);
		});
		return { em, repo, getPayloads: () => payloads };
	}

	function newJustification() {
		return Justification.create({
			attendanceRecordId: RECORD_ID,
			createdBy: USER_ID,
			reason: 'Enfermedad',
		});
	}

	it('writes both record columns on insert', async () => {
		const { repo, getPayloads } = setup();
		jest.spyOn(repo, 'findOne').mockResolvedValue(null);

		await repo.save(newJustification());

		const payloads = getPayloads();
		expect(payloads).toHaveLength(1);
		expect(payloads[0].attendanceRecord).toBe(RECORD_ID);
		expect(payloads[0].attendanceRecordId).toBe(RECORD_ID);
	});

	it('updates the existing row of the same record instead of inserting', async () => {
		const { em, repo, getPayloads } = setup();
		const row = em.merge(JustificationOrmEntity, {
			id: '33333333-3333-4333-8333-333333333333',
			attendanceRecordId: RECORD_ID,
			attendanceRecord: em.getReference(AttendanceRecordOrmEntity, RECORD_ID),
			reason: 'Vieja',
			createdBy: USER_ID,
			createdAt: new Date('2026-01-01'),
		});
		jest
			.spyOn(repo, 'findOne')
			.mockImplementation(async (where: unknown) =>
				(where as { id?: string }).id ? null : row,
			);
		const persistSpy = jest.spyOn(em, 'persist');

		await repo.save(newJustification());

		expect(persistSpy).not.toHaveBeenCalled();
		expect(row.reason).toBe('Enfermedad');
		const payloads = getPayloads();
		expect(payloads).toHaveLength(1);
		expect(payloads[0].reason).toBe('Enfermedad');
	});
});

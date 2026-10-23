import { MikroORM } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { WorkshopJustification } from '../../../src/modules/attendance/domain/entities/workshop-justification.entity';
import { WorkshopJustificationOrmEntity } from '../../../src/modules/attendance/infrastructure/persistence/entities/workshop-justification.orm-entity';
import { WorkshopJustificationRepository } from '../../../src/modules/attendance/infrastructure/persistence/repository/workshop-justification.repository';

const RECORD_ID = '11111111-1111-4111-8111-111111111111';
const USER_ID = '22222222-2222-4222-8222-222222222222';

describe('WorkshopJustificationRepository.save (ORM change sets)', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await MikroORM.init({
			entities: [WorkshopJustificationOrmEntity],
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
		const repo = new WorkshopJustificationRepository(
			em,
			WorkshopJustificationOrmEntity,
		);
		let payloads: Record<string, unknown>[] = [];
		jest.spyOn(em, 'flush').mockImplementation(async () => {
			const uow = em.getUnitOfWork();
			uow.computeChangeSets();
			payloads = uow.getChangeSets().map((c) => c.payload);
		});
		return { em, repo, getPayloads: () => payloads };
	}

	function newJustification() {
		return WorkshopJustification.create({
			workshopAttendanceRecordId: RECORD_ID,
			createdBy: USER_ID,
			reason: 'Enfermedad',
		});
	}

	it('inserts a new row keyed by the workshop record', async () => {
		const { repo, getPayloads } = setup();
		jest.spyOn(repo, 'findOne').mockResolvedValue(null);

		await repo.save(newJustification());

		const payloads = getPayloads();
		expect(payloads).toHaveLength(1);
		expect(payloads[0].workshopAttendanceRecordId).toBe(RECORD_ID);
		expect(payloads[0].reason).toBe('Enfermedad');
	});

	it('updates the existing row of the same record instead of inserting', async () => {
		const { em, repo, getPayloads } = setup();
		const row = em.merge(WorkshopJustificationOrmEntity, {
			id: '33333333-3333-4333-8333-333333333333',
			workshopAttendanceRecordId: RECORD_ID,
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
		expect(getPayloads()[0].reason).toBe('Enfermedad');
	});

	it('does not query when no record ids are given', async () => {
		const { repo } = setup();
		const findSpy = jest.spyOn(repo, 'find');

		await expect(repo.findByRecords([])).resolves.toEqual([]);
		expect(findSpy).not.toHaveBeenCalled();
	});
});

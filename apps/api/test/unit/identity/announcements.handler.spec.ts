// announcements.handler.spec.ts
import { ROLES } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { CreateAnnouncementCommand } from '../../../src/modules/identity/application/commands/create-announcement/create-announcement.command';
import { CreateAnnouncementHandler } from '../../../src/modules/identity/application/commands/create-announcement/create-announcement.handler';
import { DeleteAnnouncementCommand } from '../../../src/modules/identity/application/commands/delete-announcement/delete-announcement.command';
import { DeleteAnnouncementHandler } from '../../../src/modules/identity/application/commands/delete-announcement/delete-announcement.handler';
import { PublishAnnouncementCommand } from '../../../src/modules/identity/application/commands/publish-announcement/publish-announcement.command';
import { PublishAnnouncementHandler } from '../../../src/modules/identity/application/commands/publish-announcement/publish-announcement.handler';
import { UpdateAnnouncementCommand } from '../../../src/modules/identity/application/commands/update-announcement/update-announcement.command';
import { UpdateAnnouncementHandler } from '../../../src/modules/identity/application/commands/update-announcement/update-announcement.handler';
import { GetAnnouncementHandler } from '../../../src/modules/identity/application/queries/get-announcement/get-announcement.handler';
import { GetAnnouncementQuery } from '../../../src/modules/identity/application/queries/get-announcement/get-announcement.query';
import { GetAnnouncementsForUserHandler } from '../../../src/modules/identity/application/queries/get-announcements-for-user/get-announcements-for-user.handler';
import { GetAnnouncementsForUserQuery } from '../../../src/modules/identity/application/queries/get-announcements-for-user/get-announcements-for-user.query';
import { GetAnnouncementsHandler } from '../../../src/modules/identity/application/queries/get-announcements/get-announcements.handler';
import { GetAnnouncementsQuery } from '../../../src/modules/identity/application/queries/get-announcements/get-announcements.query';
import { Announcement } from '../../../src/modules/identity/domain/entities/announcement.entity';
import { IAnnouncementRepository } from '../../../src/modules/identity/domain/repositories/announcement.repository.interface';
import { IUserRepository } from '../../../src/modules/identity/domain/repositories/user.repository.interface';

const draftAnnouncement = (id = 'ann-1', authorId = 'user-1') =>
	Announcement.reconstitute({
		id,
		schoolId: 'school-1',
		tenantId: 'school-1',
		authorId,
		title: 'Titulo',
		body: 'Cuerpo',
		targetType: 'school',
		targetId: '',
		status: 'draft',
		publishAt: null,
		createdAt: new Date('2026-01-01T10:00:00Z'),
		updatedAt: new Date('2026-01-01T10:00:00Z'),
	});

const publishedAnnouncement = (id = 'ann-1', authorId = 'user-1') =>
	Announcement.reconstitute({
		id,
		schoolId: 'school-1',
		tenantId: 'school-1',
		authorId,
		title: 'Titulo',
		body: 'Cuerpo',
		targetType: 'course',
		targetId: 'course-1',
		status: 'published',
		publishAt: new Date('2026-01-02T10:00:00Z'),
		createdAt: new Date('2026-01-01T10:00:00Z'),
		updatedAt: new Date('2026-01-02T10:00:00Z'),
	});

describe('CreateAnnouncementHandler', () => {
	let handler: CreateAnnouncementHandler;
	let announcementRepo: MockProxy<IAnnouncementRepository>;
	let userRepo: MockProxy<IUserRepository>;

	beforeEach(() => {
		announcementRepo = mock<IAnnouncementRepository>();
		userRepo = mock<IUserRepository>();
		handler = new CreateAnnouncementHandler(announcementRepo, userRepo);
	});

	it('publica inmediatamente cuando no hay publishAt', async () => {
		userRepo.findById.mockResolvedValue(null);

		const result = await handler.execute(
			new CreateAnnouncementCommand(
				'school-1',
				'user-1',
				'Titulo',
				'Cuerpo',
				'school',
			),
		);

		expect(announcementRepo.save).toHaveBeenCalledTimes(1);
		const saved = announcementRepo.save.mock.calls[0][0];
		expect(saved.status).toBe('published');
		expect(saved.isPublished()).toBe(true);
		expect(result.status).toBe('published');
		expect(result.authorName).toBe('Desconocido');
	});

	it('crea borrador cuando hay publishAt futuro', async () => {
		userRepo.findById.mockResolvedValue(null);
		const future = new Date('2026-12-31T10:00:00Z');

		const result = await handler.execute(
			new CreateAnnouncementCommand(
				'school-1',
				'user-1',
				'Titulo',
				'Cuerpo',
				'school',
				undefined,
				future,
			),
		);

		const saved = announcementRepo.save.mock.calls[0][0];
		expect(saved.status).toBe('draft');
		expect(result.publishAt).toEqual(future);
	});

	it('usa el nombre del autor cuando existe', async () => {
		userRepo.findById.mockResolvedValue({
			fullName: 'John Doe',
		} as never);

		const result = await handler.execute(
			new CreateAnnouncementCommand(
				'school-1',
				'user-1',
				'Titulo',
				'Cuerpo',
				'school',
			),
		);

		expect(result.authorName).toBe('John Doe');
	});
});

describe('UpdateAnnouncementHandler', () => {
	let handler: UpdateAnnouncementHandler;
	let announcementRepo: MockProxy<IAnnouncementRepository>;
	let userRepo: MockProxy<IUserRepository>;

	beforeEach(() => {
		announcementRepo = mock<IAnnouncementRepository>();
		userRepo = mock<IUserRepository>();
		handler = new UpdateAnnouncementHandler(announcementRepo, userRepo);
	});

	it('actualiza un borrador siendo el autor', async () => {
		const announcement = draftAnnouncement();
		announcementRepo.findById.mockResolvedValue(announcement);
		userRepo.findById.mockResolvedValue(null);

		const result = await handler.execute(
			new UpdateAnnouncementCommand(
				'ann-1',
				'school-1',
				'user-1',
				ROLES.PRECEPTOR,
				'Nuevo titulo',
				'Nuevo cuerpo',
			),
		);

		expect(announcementRepo.save).toHaveBeenCalledTimes(1);
		expect(result.title).toBe('Nuevo titulo');
		expect(result.body).toBe('Nuevo cuerpo');
	});

	it('lanza NotFound si el comunicado no existe o es de otra escuela', async () => {
		announcementRepo.findById.mockResolvedValue(null);
		await expect(
			handler.execute(
				new UpdateAnnouncementCommand('ann-1', 'school-1', 'user-1', ROLES.ADMIN),
			),
		).rejects.toThrow('Announcement not found');

		announcementRepo.findById.mockResolvedValue(draftAnnouncement());
		await expect(
			handler.execute(
				new UpdateAnnouncementCommand(
					'ann-1',
					'school-OTRA',
					'user-1',
					ROLES.ADMIN,
				),
			),
		).rejects.toThrow('Announcement not found');
	});

	it('lanza Forbidden si no es autor ni admin', async () => {
		announcementRepo.findById.mockResolvedValue(draftAnnouncement());
		await expect(
			handler.execute(
				new UpdateAnnouncementCommand(
					'ann-1',
					'school-1',
					'user-OTRO',
					ROLES.PRECEPTOR,
				),
			),
		).rejects.toThrow('Solo el autor o un admin');
	});

	it('lanza BadRequest si ya fue publicado', async () => {
		announcementRepo.findById.mockResolvedValue(publishedAnnouncement());
		await expect(
			handler.execute(
				new UpdateAnnouncementCommand(
					'ann-1',
					'school-1',
					'user-1',
					ROLES.PRECEPTOR,
				),
			),
		).rejects.toThrow('Solo se pueden editar comunicados en borrador');
	});
});

describe('PublishAnnouncementHandler', () => {
	let handler: PublishAnnouncementHandler;
	let announcementRepo: MockProxy<IAnnouncementRepository>;
	let userRepo: MockProxy<IUserRepository>;

	beforeEach(() => {
		announcementRepo = mock<IAnnouncementRepository>();
		userRepo = mock<IUserRepository>();
		handler = new PublishAnnouncementHandler(announcementRepo, userRepo);
	});

	it('publica un borrador y setea publishAt', async () => {
		const announcement = draftAnnouncement();
		announcementRepo.findById.mockResolvedValue(announcement);
		userRepo.findById.mockResolvedValue(null);

		const result = await handler.execute(
			new PublishAnnouncementCommand(
				'ann-1',
				'school-1',
				'user-1',
				ROLES.PRECEPTOR,
			),
		);

		expect(announcementRepo.save).toHaveBeenCalledTimes(1);
		expect(result.status).toBe('published');
		expect(result.publishAt).not.toBeNull();
	});

	it('lanza BadRequest si ya está publicado', async () => {
		announcementRepo.findById.mockResolvedValue(publishedAnnouncement());
		await expect(
			handler.execute(
				new PublishAnnouncementCommand('ann-1', 'school-1', 'user-1', ROLES.ADMIN),
			),
		).rejects.toThrow('Solo se pueden publicar comunicados en borrador');
	});

	it('lanza Forbidden si no es autor ni admin', async () => {
		announcementRepo.findById.mockResolvedValue(draftAnnouncement());
		await expect(
			handler.execute(
				new PublishAnnouncementCommand(
					'ann-1',
					'school-1',
					'user-OTRO',
					ROLES.PRECEPTOR,
				),
			),
		).rejects.toThrow('Solo el autor o un admin');
	});
});

describe('DeleteAnnouncementHandler', () => {
	let handler: DeleteAnnouncementHandler;
	let announcementRepo: MockProxy<IAnnouncementRepository>;

	beforeEach(() => {
		announcementRepo = mock<IAnnouncementRepository>();
		handler = new DeleteAnnouncementHandler(announcementRepo);
	});

	it('elimina si es admin', async () => {
		announcementRepo.findById.mockResolvedValue(draftAnnouncement());

		const result = await handler.execute(
			new DeleteAnnouncementCommand('ann-1', 'school-1', ROLES.ADMIN),
		);

		expect(result.success).toBe(true);
		expect(announcementRepo.delete).toHaveBeenCalledWith('ann-1');
	});

	it('lanza Forbidden si no es admin', async () => {
		await expect(
			handler.execute(
				new DeleteAnnouncementCommand('ann-1', 'school-1', ROLES.PRECEPTOR),
			),
		).rejects.toThrow('Solo un admin puede eliminar comunicados');
	});

	it('lanza NotFound si el comunicado no existe', async () => {
		announcementRepo.findById.mockResolvedValue(null);
		await expect(
			handler.execute(
				new DeleteAnnouncementCommand('ann-1', 'school-1', ROLES.ADMIN),
			),
		).rejects.toThrow('Announcement not found');
	});
});

describe('GetAnnouncementsHandler', () => {
	let handler: GetAnnouncementsHandler;
	let announcementRepo: MockProxy<IAnnouncementRepository>;
	let userRepo: MockProxy<IUserRepository>;

	beforeEach(() => {
		announcementRepo = mock<IAnnouncementRepository>();
		userRepo = mock<IUserRepository>();
		handler = new GetAnnouncementsHandler(announcementRepo, userRepo);
	});

	it('retorna la lista con total y página', async () => {
		announcementRepo.findBySchool.mockResolvedValue([
			publishedAnnouncement(),
			draftAnnouncement('ann-2'),
		]);
		announcementRepo.countBySchool.mockResolvedValue(2);
		userRepo.findById.mockResolvedValue(null);

		const result = await handler.execute(
			new GetAnnouncementsQuery('school-1', 'course', 'published', 2, 10),
		);

		expect(result.items).toHaveLength(2);
		expect(result.total).toBe(2);
		expect(result.page).toBe(2);
		expect(announcementRepo.findBySchool).toHaveBeenCalledWith('school-1', {
			status: 'published',
			targetType: 'course',
			page: 2,
			limit: 10,
		});
	});

	it('retorna lista vacía sin llamar al mapper de autores', async () => {
		announcementRepo.findBySchool.mockResolvedValue([]);
		announcementRepo.countBySchool.mockResolvedValue(0);

		const result = await handler.execute(new GetAnnouncementsQuery('school-1'));

		expect(result.items).toEqual([]);
		expect(userRepo.findById).not.toHaveBeenCalled();
	});
});

describe('GetAnnouncementHandler', () => {
	let handler: GetAnnouncementHandler;
	let announcementRepo: MockProxy<IAnnouncementRepository>;
	let userRepo: MockProxy<IUserRepository>;

	beforeEach(() => {
		announcementRepo = mock<IAnnouncementRepository>();
		userRepo = mock<IUserRepository>();
		handler = new GetAnnouncementHandler(announcementRepo, userRepo);
	});

	it('retorna el comunicado de la escuela', async () => {
		announcementRepo.findById.mockResolvedValue(publishedAnnouncement());
		userRepo.findById.mockResolvedValue(null);

		const result = await handler.execute(
			new GetAnnouncementQuery('ann-1', 'school-1'),
		);

		expect(result.id).toBe('ann-1');
		expect(result.targetId).toBe('course-1');
	});

	it('lanza NotFound si el comunicado no pertenece a la escuela', async () => {
		announcementRepo.findById.mockResolvedValue(publishedAnnouncement());
		await expect(
			handler.execute(new GetAnnouncementQuery('ann-1', 'school-OTRA')),
		).rejects.toThrow('Announcement not found');
	});
});

describe('GetAnnouncementsForUserHandler', () => {
	let handler: GetAnnouncementsForUserHandler;
	let announcementRepo: MockProxy<IAnnouncementRepository>;
	let userRepo: MockProxy<IUserRepository>;

	beforeEach(() => {
		announcementRepo = mock<IAnnouncementRepository>();
		userRepo = mock<IUserRepository>();
		handler = new GetAnnouncementsForUserHandler(announcementRepo, userRepo);
	});

	it('solo considera comunicados publicados', async () => {
		const schoolAnnouncement = Announcement.reconstitute({
			id: 'ann-1',
			schoolId: 'school-1',
			tenantId: 'school-1',
			authorId: 'user-1',
			title: 'a todos',
			body: 'b',
			targetType: 'school',
			targetId: '',
			status: 'published',
			publishAt: new Date(),
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		announcementRepo.findBySchool.mockResolvedValue([schoolAnnouncement]);
		userRepo.findById.mockResolvedValue(null);

		const result = await handler.execute(
			new GetAnnouncementsForUserQuery('user-1', 'school-1'),
		);

		expect(announcementRepo.findBySchool).toHaveBeenCalledWith(
			'school-1',
			expect.objectContaining({ status: 'published' }),
		);
		expect(result).toHaveLength(1);
	});

	it('filtra por courseId para targets de curso', async () => {
		const school = Announcement.reconstitute({
			id: 'ann-school',
			schoolId: 'school-1',
			tenantId: 'school-1',
			authorId: 'user-1',
			title: 'a todos',
			body: 'b',
			targetType: 'school',
			targetId: '',
			status: 'published',
			publishAt: new Date(),
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		announcementRepo.findBySchool.mockResolvedValue([
			publishedAnnouncement('ann-course'),
			school,
		]);
		userRepo.findById.mockResolvedValue(null);

		const result = await handler.execute(
			new GetAnnouncementsForUserQuery('user-1', 'school-1', 'course-1'),
		);

		expect(result.map((r) => r.id).sort()).toEqual(['ann-course', 'ann-school']);
	});

	it('normaliza el typo del nivel seondary', async () => {
		const levelAnnouncement = Announcement.reconstitute({
			id: 'ann-level',
			schoolId: 'school-1',
			tenantId: 'school-1',
			authorId: 'user-1',
			title: 'nivel',
			body: 'b',
			targetType: 'level',
			targetId: 'secondary',
			status: 'published',
			publishAt: new Date(),
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		announcementRepo.findBySchool.mockResolvedValue([levelAnnouncement]);
		userRepo.findById.mockResolvedValue(null);

		const result = await handler.execute(
			new GetAnnouncementsForUserQuery(
				'user-1',
				'school-1',
				undefined,
				'SEONDARY' as never,
			),
		);

		expect(result).toHaveLength(1);
	});
});

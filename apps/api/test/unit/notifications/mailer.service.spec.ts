import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigService } from '@nestjs/config';
import { mock } from 'jest-mock-extended';
import type { Transporter } from 'nodemailer';
import {
	MailerService,
	TransportFactory,
} from '../../../src/modules/notifications/application/mailer.service';
import { TemplateRenderer } from '../../../src/modules/notifications/application/template-renderer.service';
import { EmailPayload } from '../../../src/modules/notifications/domain/email-payload';

const payload: EmailPayload = {
	to: 'john@test.com',
	subject: 'Bienvenido a Vir-ttend: credenciales de acceso',
	template: 'user-created',
	context: {
		firstName: 'John',
		lastName: 'Doe',
		email: 'john@test.com',
		rawPassword: 'Abc12345',
	},
};

describe('MailerService', () => {
	let configService: ReturnType<typeof mock<ConfigService>>;
	let renderer: TemplateRenderer;
	let capturePath: string;
	let tmpDir: string;

	beforeEach(async () => {
		configService = mock<ConfigService>();
		renderer = new TemplateRenderer();
		tmpDir = await mkdtemp(join(tmpdir(), 'mailer-'));
		capturePath = join(tmpDir, 'emails.ndjson');
	});

	afterEach(async () => {
		await rm(tmpDir, { recursive: true, force: true });
	});

	it('does nothing when EMAIL_ENABLED=false (silent skip)', async () => {
		configService.get.mockImplementation((key: string) =>
			key === 'EMAIL_ENABLED' ? false : undefined,
		);
		const sendMail = jest.fn().mockResolvedValue({});
		const transportFactory: TransportFactory = jest.fn(
			() => ({ sendMail }) as unknown as Transporter,
		);

		const service = new MailerService(
			configService,
			renderer,
			transportFactory,
			capturePath,
		);
		await service.send(payload);

		expect(transportFactory).not.toHaveBeenCalled();
		expect(sendMail).not.toHaveBeenCalled();
		await expect(readFile(capturePath, 'utf8')).rejects.toThrow();
	});

	it('appends the rendered payload to the ndjson file in capture mode (SMTP missing)', async () => {
		configService.get.mockImplementation((key: string) =>
			key === 'EMAIL_ENABLED' ? true : undefined,
		);
		const sendMail = jest.fn().mockResolvedValue({});
		const transportFactory: TransportFactory = jest.fn(
			() => ({ sendMail }) as unknown as Transporter,
		);

		const service = new MailerService(
			configService,
			renderer,
			transportFactory,
			capturePath,
		);
		await service.send(payload);

		expect(transportFactory).not.toHaveBeenCalled();
		const lines = (await readFile(capturePath, 'utf8')).trim().split('\n');
		expect(lines).toHaveLength(1);

		const entry = JSON.parse(lines[0]);
		expect(entry.to).toBe('john@test.com');
		expect(entry.subject).toBe(payload.subject);
		expect(entry.html).toContain('Abc12345');
		expect(entry.template).toBe('user-created');
	});

	it('sends via the transport with from, to, subject and rendered html', async () => {
		configService.get.mockImplementation((key: string) => {
			switch (key) {
				case 'EMAIL_ENABLED':
					return true;
				case 'SMTP_HOST':
					return 'smtp.test.com';
				case 'SMTP_PORT':
					return 587;
				case 'SMTP_USER':
					return 'user';
				case 'SMTP_PASS':
					return 'pass';
				case 'SMTP_FROM':
					return 'no-reply@vir-ttend.com';
				default:
					return undefined;
			}
		});
		const sendMail = jest.fn().mockResolvedValue({});
		const transportFactory: TransportFactory = jest.fn(
			() => ({ sendMail }) as unknown as Transporter,
		);

		const service = new MailerService(
			configService,
			renderer,
			transportFactory,
			capturePath,
		);
		await service.send(payload);

		expect(transportFactory).toHaveBeenCalledWith(
			expect.objectContaining({
				host: 'smtp.test.com',
				port: 587,
				auth: { user: 'user', pass: 'pass' },
			}),
		);
		expect(sendMail).toHaveBeenCalledWith(
			expect.objectContaining({
				from: 'no-reply@vir-ttend.com',
				to: 'john@test.com',
				subject: payload.subject,
				html: expect.stringContaining('Abc12345'),
			}),
		);
		await expect(readFile(capturePath, 'utf8')).rejects.toThrow();
	});

	it('never throws when the transport rejects (best-effort)', async () => {
		configService.get.mockImplementation((key: string) => {
			switch (key) {
				case 'EMAIL_ENABLED':
					return true;
				case 'SMTP_HOST':
					return 'smtp.test.com';
				case 'SMTP_PORT':
					return 587;
				default:
					return undefined;
			}
		});
		const sendMail = jest
			.fn()
			.mockRejectedValue(new Error('SMTP connection refused'));
		const transportFactory: TransportFactory = jest.fn(
			() => ({ sendMail }) as unknown as Transporter,
		);

		const service = new MailerService(
			configService,
			renderer,
			transportFactory,
			capturePath,
		);
		await expect(service.send(payload)).resolves.toBeUndefined();
	});
});

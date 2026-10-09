import { Logger } from '@nestjs/common';
import { ROLES } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { UserTenantLinkedEvent } from '../../../src/modules/identity/domain/events/user-tenant-linked.event';
import { EmailSender } from '../../../src/modules/notifications/domain/email-sender.interface';
import { UserTenantLinkedEmailListener } from '../../../src/modules/notifications/infrastructure/events/user-tenant-linked.listener';

describe('UserTenantLinkedEmailListener', () => {
	let emailSender: MockProxy<EmailSender>;
	let listener: UserTenantLinkedEmailListener;

	beforeEach(() => {
		emailSender = mock<EmailSender>();
		listener = new UserTenantLinkedEmailListener(emailSender);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('sends the rendered user-tenant-linked payload on user.tenant.linked', async () => {
		const event = new UserTenantLinkedEvent(
			'user-1',
			'john@test.com',
			'tenant-1',
			ROLES.PRECEPTOR,
			'Colegio Nacional',
		);

		await listener.handle(event);

		expect(emailSender.send).toHaveBeenCalledWith(
			expect.objectContaining({
				to: 'john@test.com',
				template: 'user-tenant-linked',
				context: expect.objectContaining({
					email: 'john@test.com',
					tenantName: 'Colegio Nacional',
					role: ROLES.PRECEPTOR,
				}),
			}),
		);
	});

	it('does not throw when send rejects and logs the error', async () => {
		const errorSpy = jest
			.spyOn(Logger.prototype, 'error')
			.mockImplementation(() => undefined);
		emailSender.send.mockRejectedValue(new Error('SMTP down'));
		const event = new UserTenantLinkedEvent(
			'user-1',
			'john@test.com',
			'tenant-1',
			ROLES.PRECEPTOR,
			'Colegio Nacional',
		);

		await expect(listener.handle(event)).resolves.toBeUndefined();
		expect(errorSpy).toHaveBeenCalled();
	});
});

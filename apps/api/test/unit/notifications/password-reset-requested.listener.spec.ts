import { mock } from 'jest-mock-extended';
import { PasswordResetRequestedEvent } from '../../../src/modules/identity/domain/events/password-reset-requested.event';
import { EmailSender } from '../../../src/modules/notifications/domain/email-sender.interface';
import { PasswordResetRequestedEmailListener } from '../../../src/modules/notifications/infrastructure/events/password-reset-requested.listener';

describe('PasswordResetRequestedEmailListener', () => {
	const event = new PasswordResetRequestedEvent(
		'user-1',
		'jane@test.com',
		'Jane',
		'Roe',
		'042917',
		15,
	);

	it('sends the password-reset-code template with the code', async () => {
		const sender = mock<EmailSender>();
		const listener = new PasswordResetRequestedEmailListener(sender);

		await listener.handle(event);

		expect(sender.send).toHaveBeenCalledWith({
			to: 'jane@test.com',
			subject: expect.stringContaining('042917'),
			template: 'password-reset-code',
			context: {
				firstName: 'Jane',
				lastName: 'Roe',
				code: '042917',
				expiresInMinutes: 15,
			},
		});
	});

	it('never throws when sending fails', async () => {
		const sender = mock<EmailSender>();
		sender.send.mockRejectedValue(new Error('smtp down'));
		const listener = new PasswordResetRequestedEmailListener(sender);

		await expect(listener.handle(event)).resolves.toBeUndefined();
	});
});

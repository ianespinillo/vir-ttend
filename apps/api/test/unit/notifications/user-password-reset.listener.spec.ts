import { Logger } from '@nestjs/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { UserPasswordResetEvent } from '../../../src/modules/identity/domain/events/user-password-reset.event';
import { EmailSender } from '../../../src/modules/notifications/domain/email-sender.interface';
import { UserPasswordResetEmailListener } from '../../../src/modules/notifications/infrastructure/events/user-password-reset.listener';

describe('UserPasswordResetEmailListener', () => {
	let emailSender: MockProxy<EmailSender>;
	let listener: UserPasswordResetEmailListener;
	const event = new UserPasswordResetEvent(
		'user-1',
		'jane@test.com',
		'Jane',
		'Roe',
		'Tmp12345',
	);

	beforeEach(() => {
		emailSender = mock<EmailSender>();
		listener = new UserPasswordResetEmailListener(emailSender);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('sends the user-password-reset payload on user.password-reset', async () => {
		await listener.handle(event);

		expect(emailSender.send).toHaveBeenCalledWith({
			to: 'jane@test.com',
			subject: 'Vir-ttend: tu contraseña fue restablecida',
			template: 'user-password-reset',
			context: {
				firstName: 'Jane',
				lastName: 'Roe',
				email: 'jane@test.com',
				rawPassword: 'Tmp12345',
			},
		});
	});

	it('does not throw when send rejects and logs the error', async () => {
		const errorSpy = jest
			.spyOn(Logger.prototype, 'error')
			.mockImplementation(() => undefined);
		emailSender.send.mockRejectedValue(new Error('SMTP down'));

		await expect(listener.handle(event)).resolves.toBeUndefined();
		expect(errorSpy).toHaveBeenCalled();
	});
});

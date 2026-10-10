import { Logger } from '@nestjs/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { UserCreatedEvent } from '../../../src/modules/identity/domain/events/user-created.event';
import { EmailSender } from '../../../src/modules/notifications/domain/email-sender.interface';
import { UserCreatedEmailListener } from '../../../src/modules/notifications/infrastructure/events/user-created.listener';

describe('UserCreatedEmailListener', () => {
	let emailSender: MockProxy<EmailSender>;
	let listener: UserCreatedEmailListener;

	beforeEach(() => {
		emailSender = mock<EmailSender>();
		listener = new UserCreatedEmailListener(emailSender);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('sends the rendered user-created payload on user.created', async () => {
		const event = new UserCreatedEvent(
			'user-1',
			'john@test.com',
			'tenant-1',
			'Abc12345',
			'John',
			'Doe',
		);

		await listener.handle(event);

		expect(emailSender.send).toHaveBeenCalledWith(
			expect.objectContaining({
				to: 'john@test.com',
				template: 'user-created',
				context: expect.objectContaining({
					firstName: 'John',
					lastName: 'Doe',
					email: 'john@test.com',
					rawPassword: 'Abc12345',
				}),
			}),
		);
	});

	it('does not throw when send rejects and logs the error', async () => {
		const errorSpy = jest
			.spyOn(Logger.prototype, 'error')
			.mockImplementation(() => undefined);
		emailSender.send.mockRejectedValue(new Error('SMTP down'));
		const event = new UserCreatedEvent(
			'user-1',
			'john@test.com',
			'tenant-1',
			'Abc12345',
			'John',
			'Doe',
		);

		await expect(listener.handle(event)).resolves.toBeUndefined();
		expect(errorSpy).toHaveBeenCalled();
	});
});

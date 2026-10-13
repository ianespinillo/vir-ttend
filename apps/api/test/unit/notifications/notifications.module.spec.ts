import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { TemplateRenderer } from '../../../src/modules/notifications/application/template-renderer.service';
import { EMAIL_SENDER } from '../../../src/modules/notifications/domain/email-sender.interface';
import { NotificationsModule } from '../../../src/modules/notifications/notifications.module';

describe('NotificationsModule', () => {
	// Regression: a duplicate class provider for TemplateRenderer overrode the
	// factory and made Nest try to inject its `string` constructor parameter,
	// crashing the API on boot.
	it('resolves its providers through the Nest container', async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [
				ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
				NotificationsModule,
			],
		}).compile();

		expect(moduleRef.get(TemplateRenderer)).toBeInstanceOf(TemplateRenderer);
		expect(moduleRef.get(EMAIL_SENDER)).toBeDefined();

		await moduleRef.close();
	});
});

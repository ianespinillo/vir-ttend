import { Module } from '@nestjs/common';
import { MailerService } from './application/mailer.service';
import { TemplateRenderer } from './application/template-renderer.service';
import { EMAIL_SENDER } from './domain/email-sender.interface';
import { UserCreatedEmailListener } from './infrastructure/events/user-created.listener';
import { UserTenantLinkedEmailListener } from './infrastructure/events/user-tenant-linked.listener';

@Module({
	providers: [
		{
			provide: TemplateRenderer,
			useFactory: () => new TemplateRenderer(),
		},
		{
			provide: EMAIL_SENDER,
			useClass: MailerService,
		},
		UserCreatedEmailListener,
		UserTenantLinkedEmailListener,
	],
	exports: [EMAIL_SENDER],
})
export class NotificationsModule {}

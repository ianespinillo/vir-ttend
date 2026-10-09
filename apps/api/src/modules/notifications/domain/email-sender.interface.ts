import { EmailPayload } from './email-payload';

export const EMAIL_SENDER = 'IEmailSender';

export interface EmailSender {
	send(payload: EmailPayload): Promise<void>;
}

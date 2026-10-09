export interface EmailPayload {
	to: string;
	subject: string;
	template: string;
	context: Record<string, unknown>;
}

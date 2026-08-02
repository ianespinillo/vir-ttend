export class ExportPdfCommand {
	constructor(
		readonly courseId: string,
		readonly month: number,
		readonly year: number,
		readonly type: 'monthly' | 'student',
		readonly studentId?: string,
	) {}
}

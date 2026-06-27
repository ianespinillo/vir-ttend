export class GetAttendanceByStudentQuery {
	constructor(
		readonly studentId: string,
		readonly from: Date,
		readonly to: Date,
	) {}
}

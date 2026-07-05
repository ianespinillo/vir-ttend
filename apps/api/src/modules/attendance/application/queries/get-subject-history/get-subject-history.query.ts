export class GetSubjectHistoryQuery {
	constructor(
		readonly subjectId: string,
		readonly from: Date,
		readonly to: Date,
	) {}
}

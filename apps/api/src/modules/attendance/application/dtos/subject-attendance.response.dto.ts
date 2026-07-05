import { AttendanceRecordResponseDto } from './attendance-record.response.dto';

export class SubjectAttendanceResponseDto {
	readonly subjectId!: string;
	readonly subjectName!: string;
	readonly courseId!: string;
	readonly date!: string;
	readonly records!: AttendanceRecordResponseDto[];
	readonly metrics!: {
		totalStudents: number;
		present: number;
		absent: number;
		late: number;
		justified: number;
	};

	constructor(data: {
		subjectId: string;
		subjectName: string;
		courseId: string;
		date: string;
		records: AttendanceRecordResponseDto[];
	}) {
		this.subjectId = data.subjectId;
		this.subjectName = data.subjectName;
		this.courseId = data.courseId;
		this.date = data.date;
		this.records = data.records;
		this.metrics = {
			totalStudents: data.records.length,
			present: data.records.filter((r) => r.status === 'present').length,
			absent: data.records.filter((r) => r.status === 'absent').length,
			late: data.records.filter((r) => r.status === 'late').length,
			justified: data.records.filter((r) => r.status === 'justified').length,
		};
	}
}

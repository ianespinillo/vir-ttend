import { AttendanceStatus } from '@repo/common';

export class ClassSessionDto {
	constructor(
		date: string,
		present: number,
		absent: number,
		late: number,
		justified: number,
		totalStudents: number,
	) {
		this.date = date;
		this.present = present;
		this.absent = absent;
		this.late = late;
		this.justified = justified;
		this.totalStudents = totalStudents;
	}

	date!: string;
	present!: number;
	absent!: number;
	late!: number;
	justified!: number;
	totalStudents!: number;
}

export class StudentSubjectRecordDto {
	constructor(
		studentId: string,
		studentName: string,
		records: { date: string; status: AttendanceStatus }[],
		absencePercent: number,
	) {
		this.studentId = studentId;
		this.studentName = studentName;
		this.records = records;
		this.absencePercent = absencePercent;
	}

	studentId!: string;
	studentName!: string;
	records!: { date: string; status: AttendanceStatus }[];
	absencePercent!: number;
}

export class SubjectHistoryResponseDto {
	readonly subjectId!: string;
	readonly subjectName!: string;
	readonly from!: Date;
	readonly to!: Date;
	readonly classDates!: Date[];
	readonly sessions!: ClassSessionDto[];
	readonly studentRecords!: StudentSubjectRecordDto[];

	constructor(data: {
		subjectId: string;
		subjectName: string;
		from: string;
		to: string;
		classDates: string[];
		sessions: ClassSessionDto[];
		studentRecords: StudentSubjectRecordDto[];
	}) {
		Object.assign(this, data);
	}
}

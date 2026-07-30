import { randomUUID } from 'node:crypto';
import { MonthlyReportData } from '../value-objects/monthly-report-data.vo';

interface ConstructorProperties {
	id: string;
	tenantId: string;
	courseId: string;
	academicYearId: string;
	month: number;
	year: number;
	data: MonthlyReportData;
	generatedAt: Date;
	createdAt: Date;
}
interface CreateProperties {
	tenantId: string;
	courseId: string;
	academicYearId: string;
	month: number;
	year: number;
	data: MonthlyReportData;
	generatedAt: Date;
}

export class MonthlyReport {
	private readonly _id: string;
	private readonly _tenantId: string;
	private readonly _courseId: string;
	private readonly _academicYearId: string;
	private readonly _month: number;
	private readonly _year: number;
	private readonly _data: MonthlyReportData;
	private readonly _generatedAt: Date;
	private readonly _createdAt: Date;

	private constructor(props: ConstructorProperties) {
		this._id = props.id;
		this._tenantId = props.tenantId;
		this._courseId = props.courseId;
		this._academicYearId = props.academicYearId;
		this._month = props.month;
		this._year = props.year;
		this._data = props.data;
		this._generatedAt = props.generatedAt;
		this._createdAt = props.createdAt;
	}
	static reconstitute(props: ConstructorProperties) {
		return new MonthlyReport(props);
	}
	static create(props: CreateProperties) {
		return new MonthlyReport({
			...props,
			id: randomUUID(),
			createdAt: new Date(),
		});
	}

	get id(): string {
		return this._id;
	}

	get tenantId(): string {
		return this._tenantId;
	}

	get courseId(): string {
		return this._courseId;
	}

	get academicYearId(): string {
		return this._academicYearId;
	}

	get month(): number {
		return this._month;
	}

	get year(): number {
		return this._year;
	}

	get data(): MonthlyReportData {
		return this._data;
	}

	get generatedAt(): Date {
		return this._generatedAt;
	}

	get createdAt(): Date {
		return this._createdAt;
	}
}

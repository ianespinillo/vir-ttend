import { AlertType } from '../types/alert.type';

interface ReconstituteProps {
	id: string;
	studentId: string;
	courseId: string;
	alertType: AlertType;
}

export class AttendanceAlert {
	private readonly _id: string;
	private readonly _studentId: string;
	private readonly _courseId: string;
	private readonly _alertType: AlertType;

	private constructor(props: ReconstituteProps) {
		this._id = props.id;
		this._studentId = props.studentId;
		this._courseId = props.courseId;
		this._alertType = props.alertType;
	}
	static reconstitute(props: ReconstituteProps): AttendanceAlert {
		return new AttendanceAlert(props);
	}

	get id(): string {
		return this._id;
	}

	get studentId(): string {
		return this._studentId;
	}

	get courseId(): string {
		return this._courseId;
	}

	get alertType(): AlertType {
		return this._alertType;
	}
}

export interface IStudentImportRowData {
	lastName: string;
	firstName: string;
	documentNumber: string;
	birthDate: string;
	tutorName: string;
	tutorPhone: string;
	tutorEmail: string | null;
}

export interface IStudentImportRow {
	rowNumber: number;
	data: IStudentImportRowData;
	errors: string[];
}

export interface IStudentImportPreviewResponse {
	courseId: string;
	totalRows: number;
	validRows: number;
	invalidRows: number;
	rows: IStudentImportRow[];
}

export interface IStudentImportCommitResponse {
	created: number;
}

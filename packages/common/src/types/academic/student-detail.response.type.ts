import { IStudentResponse } from './student.response.type.js';

export interface IStudentDetailResponse extends IStudentResponse {
	tutorName: string;
	tutorPhone: string;
	tutorEmail?: string;
}

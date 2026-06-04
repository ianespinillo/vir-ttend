import { PaginatedResponse, STUDENTSTATUS, StudentStatus } from '@repo/common';
import { Student } from '../entities/student.entity';

export interface SearchStudentFilters {
	query?: string; // busca en firstName, lastName, documentNumber
	tenantId: string; // siempre requerido — aislamiento
	courseId?: string; // filtrar por curso
	status?: StudentStatus; // active, inactive, transferred
	page: number;
	limit: number;
}

export interface IStudentRepository {
	findById(id: string): Promise<Student | null>;
	findByCourse(courseId: string): Promise<Student[]>;
	findByDocument(
		documentNumber: string,
		tenantId: string,
	): Promise<Student | null>;
	search(filters: SearchStudentFilters): Promise<PaginatedResponse<Student>>;
	save(student: Student): Promise<void>;
}

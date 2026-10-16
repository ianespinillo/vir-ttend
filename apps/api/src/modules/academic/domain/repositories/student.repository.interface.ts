import { PaginatedResponse, STUDENTSTATUS, StudentStatus } from '@repo/common';
import { Student } from '../entities/student.entity';

export interface SearchStudentFilters {
	query?: string; // busca en firstName, lastName, documentNumber
	tenantId: string; // siempre requerido — aislamiento
	courseId?: string; // filtrar por curso
	courseIds?: string[]; // filtrar por múltiples cursos (ej: preceptor)
	status?: StudentStatus; // active, inactive, transferred
	page: number;
	limit: number;
}

export interface IStudentRepository {
	findById(id: string): Promise<Student | null>;
	findByCourse(courseId: string): Promise<Student[]>;
	findActiveByCourse(courseId: string): Promise<Student[]>;
	/** ACTIVE students currently assigned to the workshop commission. */
	findActiveByCommission(commissionId: string): Promise<Student[]>;
	countActiveByCommission(commissionId: string): Promise<number>;
	findByDocument(
		documentNumber: string,
		tenantId: string,
	): Promise<Student | null>;
	findByDocuments(
		documentNumbers: string[],
		tenantId: string,
	): Promise<Student[]>;
	search(filters: SearchStudentFilters): Promise<PaginatedResponse<Student>>;
	save(student: Student): Promise<void>;
}

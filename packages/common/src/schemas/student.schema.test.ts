import { describe, expect, it } from 'vitest';
import {
	createStudentSchema,
	enrollSchema,
	transferSchema,
	updateStudentSchema,
} from './student.schema.js';

describe('student.schema', () => {
	const validUUID = '123e4567-e89b-12d3-a456-426614174000';

	it('valida un estudiante válido en createStudentSchema', () => {
		const result = createStudentSchema.safeParse({
			firstName: 'Juan',
			lastName: 'Pérez',
			documentNumber: '40123456',
			birthDate: '2010-05-15',
			courseId: validUUID,
			tutorName: 'María Pérez',
			tutorPhone: '1123456789',
			tutorEmail: 'tutor@ejemplo.com',
		});
		expect(result.success).toBe(true);
	});

	it('rechaza fecha de nacimiento con formato inválido', () => {
		const result = createStudentSchema.safeParse({
			firstName: 'Juan',
			lastName: 'Pérez',
			documentNumber: '40123456',
			birthDate: '15/05/2010',
			courseId: validUUID,
			tutorName: 'María Pérez',
			tutorPhone: '1123456789',
		});
		expect(result.success).toBe(false);
	});

	it('valida enrollSchema y transferSchema', () => {
		expect(enrollSchema.safeParse({ courseId: validUUID }).success).toBe(true);
		expect(enrollSchema.safeParse({ courseId: 'invalid-uuid' }).success).toBe(
			false,
		);

		expect(transferSchema.safeParse({ targetCourseId: validUUID }).success).toBe(
			true,
		);
		expect(
			transferSchema.safeParse({ targetCourseId: 'invalid-uuid' }).success,
		).toBe(false);
	});

	it('permite campos opcionales en updateStudentSchema', () => {
		const result = updateStudentSchema.safeParse({
			firstName: 'Juan Pablo',
		});
		expect(result.success).toBe(true);
	});
});

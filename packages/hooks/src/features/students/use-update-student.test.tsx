// @vitest-environment jsdom
import { STUDENT_ROUTES, type UpdateStudentFormValues } from '@repo/common';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import React, { type ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { apiClient } from '../../lib/axios-client';
import { useUpdateStudent } from './use-update-student';

const mock = new MockAdapter(apiClient);

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
	return ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}

describe('useUpdateStudent', () => {
	afterEach(() => {
		mock.reset();
	});

	it('sends only DTO fields, excluding documentNumber and courseId', async () => {
		const studentId = 's-1';
		const data: UpdateStudentFormValues = {
			firstName: 'Juan',
			lastName: 'Pérez',
			documentNumber: '42123456',
			birthDate: '2010-05-01',
			courseId: 'course-1',
			tutorName: 'María Gómez',
			tutorPhone: '1123456789',
			tutorEmail: 'tutor@ejemplo.com',
		};

		let sentBody: Record<string, unknown> | undefined;

		mock.onPut(STUDENT_ROUTES.student(studentId)).reply((config) => {
			sentBody = JSON.parse(config.data);
			return [200, { data: { id: studentId } }];
		});

		const { result } = renderHook(() => useUpdateStudent(), {
			wrapper: createWrapper(),
		});

		result.current.mutate({ id: studentId, data });

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(sentBody).toBeDefined();
		expect(sentBody).not.toHaveProperty('documentNumber');
		expect(sentBody).not.toHaveProperty('courseId');
		expect(sentBody).toMatchObject({
			firstName: 'Juan',
			lastName: 'Pérez',
			birthDate: '2010-05-01',
			tutorName: 'María Gómez',
			tutorPhone: '1123456789',
			tutorEmail: 'tutor@ejemplo.com',
		});
	});

	it('omits tutorEmail when the value is empty or whitespace', async () => {
		const studentId = 's-2';
		const data: UpdateStudentFormValues = {
			firstName: 'Ana',
			tutorEmail: '   ',
		};

		let sentBody: Record<string, unknown> | undefined;

		mock.onPut(STUDENT_ROUTES.student(studentId)).reply((config) => {
			sentBody = JSON.parse(config.data);
			return [200, { data: { id: studentId } }];
		});

		const { result } = renderHook(() => useUpdateStudent(), {
			wrapper: createWrapper(),
		});

		result.current.mutate({ id: studentId, data });

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(sentBody).toBeDefined();
		expect(sentBody).not.toHaveProperty('tutorEmail');
		expect(sentBody).not.toHaveProperty('documentNumber');
		expect(sentBody).not.toHaveProperty('courseId');
		expect(sentBody).toMatchObject({ firstName: 'Ana' });
	});
});

// @vitest-environment jsdom
import {
	ACADEMIC_ROUTES,
	type IWorkshopCommissionResponse,
} from '@repo/common';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import React, { type ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { apiClient } from '../../lib/axios-client';
import { useAssignWorkshopPreceptor } from './use-assign-workshop-preceptor';
import { useCreateWorkshopCommissions } from './use-create-workshop-commissions';
import { useMoveStudentToCommission } from './use-move-student-to-commission';
import { useRegenerateWorkshopCommissions } from './use-regenerate-workshop-commissions';
import { useWorkshopCommissions } from './use-workshop-commissions';

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

const commissions: IWorkshopCommissionResponse[] = [
	{
		id: 'c-1',
		courseId: 'course-1',
		number: 1,
		code: '141',
		preceptorId: null,
		studentCount: 1,
		students: [{ id: 's-1', lastName: 'Alvarez', firstName: 'Ana' }],
	},
];

describe('workshop commission hooks', () => {
	afterEach(() => {
		mock.reset();
	});

	it('lists the commissions of a course', async () => {
		mock
			.onGet(ACADEMIC_ROUTES.workshopCommissions('course-1'))
			.reply(200, { data: commissions });

		const { result } = renderHook(() => useWorkshopCommissions('course-1'), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual(commissions);
	});

	it('does not fetch without a course id', () => {
		const { result } = renderHook(() => useWorkshopCommissions(undefined), {
			wrapper: createWrapper(),
		});
		expect(result.current.fetchStatus).toBe('idle');
		expect(mock.history.get).toHaveLength(0);
	});

	it('does not fetch when disabled', () => {
		const { result } = renderHook(
			() => useWorkshopCommissions('course-1', false),
			{ wrapper: createWrapper() },
		);
		expect(result.current.fetchStatus).toBe('idle');
		expect(mock.history.get).toHaveLength(0);
	});

	it('creates the commissions with a POST sending the count', async () => {
		const bodies: unknown[] = [];
		mock
			.onPost(ACADEMIC_ROUTES.workshopCommissions('course-1'))
			.reply((config) => {
				bodies.push(JSON.parse(config.data));
				return [201, { data: commissions }];
			});

		const { result } = renderHook(() => useCreateWorkshopCommissions(), {
			wrapper: createWrapper(),
		});
		result.current.mutate({ courseId: 'course-1', count: 2 });
		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual(commissions);

		result.current.mutate({ courseId: 'course-1', count: 1 });
		await waitFor(() => expect(bodies).toHaveLength(2));
		expect(bodies).toEqual([{ count: 2 }, { count: 1 }]);
	});

	it('assigns a preceptor, and null removes it', async () => {
		const bodies: unknown[] = [];
		mock
			.onPut(ACADEMIC_ROUTES.workshopCommissionPreceptor('c-1'))
			.reply((config) => {
				bodies.push(JSON.parse(config.data));
				return [200, { data: null }];
			});

		const { result } = renderHook(() => useAssignWorkshopPreceptor(), {
			wrapper: createWrapper(),
		});
		result.current.mutate({
			courseId: 'course-1',
			commissionId: 'c-1',
			preceptorId: 'u-1',
		});
		await waitFor(() => expect(bodies).toHaveLength(1));

		result.current.mutate({
			courseId: 'course-1',
			commissionId: 'c-1',
			preceptorId: null,
		});
		await waitFor(() => expect(bodies).toHaveLength(2));
		expect(bodies).toEqual([{ preceptorId: 'u-1' }, { preceptorId: null }]);
	});

	it('moves a student to the destination commission', async () => {
		mock
			.onPut(ACADEMIC_ROUTES.workshopCommissionStudent('c-2', 's-1'))
			.reply(200, { data: null });

		const { result } = renderHook(() => useMoveStudentToCommission(), {
			wrapper: createWrapper(),
		});
		result.current.mutate({
			courseId: 'course-1',
			commissionId: 'c-2',
			studentId: 's-1',
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(mock.history.put[0]?.url).toBe(
			'/workshop-commissions/c-2/students/s-1',
		);
	});

	it('regenerates with the explicit confirmation flag', async () => {
		let sentBody: unknown;
		mock
			.onPost(ACADEMIC_ROUTES.workshopCommissionsRegenerate('course-1'))
			.reply((config) => {
				sentBody = JSON.parse(config.data);
				return [200, { data: commissions }];
			});

		const { result } = renderHook(() => useRegenerateWorkshopCommissions(), {
			wrapper: createWrapper(),
		});
		result.current.mutate('course-1');

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(sentBody).toEqual({ confirm: true });
	});

	it('surfaces API errors on mutations', async () => {
		mock
			.onPost(ACADEMIC_ROUTES.workshopCommissions('course-1'))
			.reply(409, { message: 'El curso ya tiene comisiones' });

		const { result } = renderHook(() => useCreateWorkshopCommissions(), {
			wrapper: createWrapper(),
		});
		result.current.mutate({ courseId: 'course-1', count: 2 });

		await waitFor(() => expect(result.current.isError).toBe(true));
	});
});

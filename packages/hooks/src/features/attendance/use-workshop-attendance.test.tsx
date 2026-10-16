// @vitest-environment jsdom
import { ATTENDANCE_ROUTES, ATTENDANCE_STATUS } from '@repo/common';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import React, { type ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { apiClient } from '../../lib/axios-client';
import { useBulkWorkshopAttendance } from './use-bulk-workshop-attendance';
import { useMyWorkshopCommissions } from './use-my-workshop-commissions';
import { useRegisterWorkshopAttendance } from './use-register-workshop-attendance';
import { useWorkshopAttendance } from './use-workshop-attendance';

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

describe('workshop attendance hooks', () => {
	afterEach(() => {
		mock.reset();
	});

	it('loads my commissions for a date', async () => {
		const commissions = [
			{
				commissionId: 'c-1',
				code: '141',
				number: 1,
				courseId: 'course-1',
				courseName: '1° 4°',
				hasWorkshopToday: true,
			},
		];
		let sentParams: Record<string, unknown> | undefined;
		mock.onGet(ATTENDANCE_ROUTES.workshopMyCommissions).reply((config) => {
			sentParams = config.params;
			return [200, { data: commissions }];
		});

		const { result } = renderHook(() => useMyWorkshopCommissions('2026-03-10'), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual(commissions);
		expect(sentParams).toEqual({ date: '2026-03-10' });
	});

	it('does not query commissions without a date', () => {
		const { result } = renderHook(() => useMyWorkshopCommissions(''), {
			wrapper: createWrapper(),
		});
		expect(result.current.fetchStatus).toBe('idle');
	});

	it('loads the attendance of a commission and date', async () => {
		const attendance = {
			commissionId: 'c-1',
			commissionCode: '141',
			courseId: 'course-1',
			courseName: '1° 4°',
			date: '2026-03-10',
			records: [],
		};
		let sentParams: Record<string, unknown> | undefined;
		mock.onGet(ATTENDANCE_ROUTES.workshop).reply((config) => {
			sentParams = config.params;
			return [200, { data: attendance }];
		});

		const { result } = renderHook(
			() => useWorkshopAttendance({ commissionId: 'c-1', date: '2026-03-10' }),
			{ wrapper: createWrapper() },
		);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual(attendance);
		expect(sentParams).toEqual({ commissionId: 'c-1', date: '2026-03-10' });
	});

	it('does not query attendance without a commission', () => {
		const { result } = renderHook(
			() => useWorkshopAttendance({ commissionId: '', date: '2026-03-10' }),
			{ wrapper: createWrapper() },
		);
		expect(result.current.fetchStatus).toBe('idle');
	});

	it('records attendance records for a commission', async () => {
		const payload = {
			commissionId: 'c-1',
			date: '2026-03-10',
			records: [{ studentId: 's-1', status: ATTENDANCE_STATUS.LATE }],
		};
		let sentBody: unknown;
		mock.onPost(ATTENDANCE_ROUTES.workshop).reply((config) => {
			sentBody = JSON.parse(config.data);
			return [201, { data: null }];
		});

		const { result } = renderHook(() => useRegisterWorkshopAttendance(), {
			wrapper: createWrapper(),
		});
		result.current.mutate(payload);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(sentBody).toEqual(payload);
	});

	it('records bulk attendance with a single status', async () => {
		const payload = {
			commissionId: 'c-1',
			date: '2026-03-10',
			status: ATTENDANCE_STATUS.PRESENT,
		};
		let sentBody: unknown;
		mock.onPost(ATTENDANCE_ROUTES.workshopAll).reply((config) => {
			sentBody = JSON.parse(config.data);
			return [201, { data: null }];
		});

		const { result } = renderHook(() => useBulkWorkshopAttendance(), {
			wrapper: createWrapper(),
		});
		result.current.mutate(payload);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(sentBody).toEqual(payload);
	});
});

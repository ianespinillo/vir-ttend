// @vitest-environment jsdom
import { ATTENDANCE_ROUTES } from '@repo/common';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import React, { type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';
import {
	useDailySessionNotHeld,
	useMarkDailySessionNotHeld,
	useUnmarkDailySessionNotHeld,
} from './use-daily-session-not-held';
import {
	useMarkWorkshopSessionNotHeld,
	useUnmarkWorkshopSessionNotHeld,
	useWorkshopSessionNotHeld,
} from './use-workshop-session-not-held';

const mock = new MockAdapter(apiClient);

function createClient() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
	const wrapper = ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
	return { invalidate, wrapper };
}

describe('daily session not held hooks', () => {
	afterEach(() => {
		mock.reset();
	});

	it('reads the not-held status of a course and date', async () => {
		const { wrapper } = createClient();
		let sentParams: Record<string, unknown> | undefined;
		mock.onGet(ATTENDANCE_ROUTES.dailyNotHeld).reply((config) => {
			sentParams = config.params;
			return [
				200,
				{ success: true, data: { notHeld: true, reason: 'Docente ausente' } },
			];
		});

		const { result } = renderHook(
			() => useDailySessionNotHeld('course-1', '2026-03-10'),
			{ wrapper },
		);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(sentParams).toEqual({ courseId: 'course-1', date: '2026-03-10' });
		expect(result.current.data).toEqual({
			notHeld: true,
			reason: 'Docente ausente',
		});
	});

	it('does not query without a course', () => {
		const { wrapper } = createClient();
		const { result } = renderHook(
			() => useDailySessionNotHeld('', '2026-03-10'),
			{ wrapper },
		);
		expect(result.current.fetchStatus).toBe('idle');
		expect(mock.history.get).toHaveLength(0);
	});

	it('marks the class as not held and invalidates the day', async () => {
		const { invalidate, wrapper } = createClient();
		let sentBody: unknown;
		mock.onPost(ATTENDANCE_ROUTES.dailyNotHeld).reply((config) => {
			sentBody = JSON.parse(config.data);
			return [201, { success: true, data: { deletedRecords: 3 } }];
		});

		const { result } = renderHook(() => useMarkDailySessionNotHeld(), {
			wrapper,
		});
		result.current.mutate({
			courseId: 'course-1',
			date: '2026-03-10',
			reason: 'Docente ausente',
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(sentBody).toEqual({
			courseId: 'course-1',
			date: '2026-03-10',
			reason: 'Docente ausente',
		});
		expect(result.current.data).toEqual({ deletedRecords: 3 });
		for (const queryKey of [
			queryKeys.attendance.dailyNotHeld('course-1', '2026-03-10'),
			queryKeys.attendance.daily('course-1', '2026-03-10'),
			queryKeys.attendance.metrics('course-1', '2026-03-10'),
			['attendance', 'history'],
		]) {
			expect(invalidate).toHaveBeenCalledWith({ queryKey });
		}
	});

	it('does not invalidate when marking fails', async () => {
		const { invalidate, wrapper } = createClient();
		mock
			.onPost(ATTENDANCE_ROUTES.dailyNotHeld)
			.reply(403, { message: 'Sin permiso' });

		const { result } = renderHook(() => useMarkDailySessionNotHeld(), {
			wrapper,
		});
		result.current.mutate({ courseId: 'course-1', date: '2026-03-10' });

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect(result.current.error?.response?.status).toBe(403);
		expect(invalidate).not.toHaveBeenCalled();
	});

	it('unmarks with the course and date as query params and invalidates the day', async () => {
		const { invalidate, wrapper } = createClient();
		let sentParams: Record<string, unknown> | undefined;
		mock.onDelete(ATTENDANCE_ROUTES.dailyNotHeld).reply((config) => {
			sentParams = config.params;
			return [200, { success: true }];
		});

		const { result } = renderHook(() => useUnmarkDailySessionNotHeld(), {
			wrapper,
		});
		result.current.mutate({ courseId: 'course-1', date: '2026-03-10' });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(sentParams).toEqual({ courseId: 'course-1', date: '2026-03-10' });
		expect(invalidate).toHaveBeenCalledWith({
			queryKey: queryKeys.attendance.dailyNotHeld('course-1', '2026-03-10'),
		});
		expect(invalidate).toHaveBeenCalledWith({
			queryKey: queryKeys.attendance.daily('course-1', '2026-03-10'),
		});
		expect(invalidate).toHaveBeenCalledWith({
			queryKey: queryKeys.attendance.metrics('course-1', '2026-03-10'),
		});
		expect(invalidate).toHaveBeenCalledWith({
			queryKey: ['attendance', 'history'],
		});
	});

	it('does not invalidate when unmarking fails', async () => {
		const { invalidate, wrapper } = createClient();
		mock
			.onDelete(ATTENDANCE_ROUTES.dailyNotHeld)
			.reply(500, { message: 'Error' });

		const { result } = renderHook(() => useUnmarkDailySessionNotHeld(), {
			wrapper,
		});
		result.current.mutate({ courseId: 'course-1', date: '2026-03-10' });

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect(invalidate).not.toHaveBeenCalled();
	});
});

describe('workshop session not held hooks', () => {
	afterEach(() => {
		mock.reset();
	});

	it('reads the not-held status of a commission and date', async () => {
		const { wrapper } = createClient();
		let sentParams: Record<string, unknown> | undefined;
		mock.onGet(ATTENDANCE_ROUTES.workshopNotHeld).reply((config) => {
			sentParams = config.params;
			return [200, { success: true, data: { notHeld: false } }];
		});

		const { result } = renderHook(
			() => useWorkshopSessionNotHeld('c-1', '2026-03-10'),
			{ wrapper },
		);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(sentParams).toEqual({ commissionId: 'c-1', date: '2026-03-10' });
		expect(result.current.data).toEqual({ notHeld: false });
	});

	it('does not query without a commission', () => {
		const { wrapper } = createClient();
		const { result } = renderHook(
			() => useWorkshopSessionNotHeld('', '2026-03-10'),
			{ wrapper },
		);
		expect(result.current.fetchStatus).toBe('idle');
	});

	it('marks the workshop as not held and invalidates the commission day', async () => {
		const { invalidate, wrapper } = createClient();
		let sentBody: unknown;
		mock.onPost(ATTENDANCE_ROUTES.workshopNotHeld).reply((config) => {
			sentBody = JSON.parse(config.data);
			return [201, { success: true, data: { deletedRecords: 2 } }];
		});

		const { result } = renderHook(() => useMarkWorkshopSessionNotHeld(), {
			wrapper,
		});
		result.current.mutate({ commissionId: 'c-1', date: '2026-03-10' });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(sentBody).toEqual({ commissionId: 'c-1', date: '2026-03-10' });
		expect(result.current.data).toEqual({ deletedRecords: 2 });
		expect(invalidate).toHaveBeenCalledWith({
			queryKey: queryKeys.attendance.workshopNotHeld('c-1', '2026-03-10'),
		});
		expect(invalidate).toHaveBeenCalledWith({
			queryKey: queryKeys.attendance.workshop('c-1', '2026-03-10'),
		});
	});

	it('unmarks with the commission and date as query params', async () => {
		const { invalidate, wrapper } = createClient();
		let sentParams: Record<string, unknown> | undefined;
		mock.onDelete(ATTENDANCE_ROUTES.workshopNotHeld).reply((config) => {
			sentParams = config.params;
			return [200, { success: true }];
		});

		const { result } = renderHook(() => useUnmarkWorkshopSessionNotHeld(), {
			wrapper,
		});
		result.current.mutate({ commissionId: 'c-1', date: '2026-03-10' });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(sentParams).toEqual({ commissionId: 'c-1', date: '2026-03-10' });
		expect(invalidate).toHaveBeenCalledWith({
			queryKey: queryKeys.attendance.workshopNotHeld('c-1', '2026-03-10'),
		});
		expect(invalidate).toHaveBeenCalledWith({
			queryKey: queryKeys.attendance.workshop('c-1', '2026-03-10'),
		});
	});

	it('does not invalidate when marking or unmarking fails', async () => {
		const { invalidate, wrapper } = createClient();
		mock.onPost(ATTENDANCE_ROUTES.workshopNotHeld).reply(500);
		mock.onDelete(ATTENDANCE_ROUTES.workshopNotHeld).reply(500);

		const { result } = renderHook(
			() => ({
				mark: useMarkWorkshopSessionNotHeld(),
				unmark: useUnmarkWorkshopSessionNotHeld(),
			}),
			{ wrapper },
		);
		result.current.mark.mutate({ commissionId: 'c-1', date: '2026-03-10' });
		result.current.unmark.mutate({ commissionId: 'c-1', date: '2026-03-10' });

		await waitFor(() => {
			expect(result.current.mark.isError).toBe(true);
			expect(result.current.unmark.isError).toBe(true);
		});
		expect(invalidate).not.toHaveBeenCalled();
	});
});

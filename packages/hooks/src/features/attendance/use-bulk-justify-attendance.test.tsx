// @vitest-environment jsdom
import { ATTENDANCE_ROUTES } from '@repo/common';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import React, { type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';
import { useBulkJustifyAttendance } from './use-bulk-justify-attendance';
import { useBulkJustifyWorkshopAttendance } from './use-bulk-justify-workshop-attendance';

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

describe('bulk justification hooks', () => {
	afterEach(() => {
		mock.reset();
	});

	describe('useBulkJustifyAttendance', () => {
		it('posts the record ids and invalidates the daily attendance and metrics', async () => {
			const { invalidate, wrapper } = createClient();
			let sentBody: unknown;
			mock.onPost(ATTENDANCE_ROUTES.justifyBulk).reply((config) => {
				sentBody = JSON.parse(config.data);
				return [201, { success: true, data: { justified: 2 } }];
			});

			const { result } = renderHook(() => useBulkJustifyAttendance(), { wrapper });
			result.current.mutate({
				recordIds: ['r-1', 'r-2'],
				reason: 'Enfermedad',
				notes: 'Certificado',
				courseId: 'course-1',
				date: '2026-03-10',
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));
			expect(sentBody).toEqual({
				recordIds: ['r-1', 'r-2'],
				reason: 'Enfermedad',
				notes: 'Certificado',
			});
			expect(result.current.data).toEqual({ justified: 2 });
			expect(invalidate).toHaveBeenCalledWith({
				queryKey: queryKeys.attendance.daily('course-1', '2026-03-10'),
			});
			expect(invalidate).toHaveBeenCalledWith({
				queryKey: queryKeys.attendance.metrics('course-1', '2026-03-10'),
			});
		});

		it('invalidates all attendance queries without course and date', async () => {
			const { invalidate, wrapper } = createClient();
			mock
				.onPost(ATTENDANCE_ROUTES.justifyBulk)
				.reply(201, { success: true, data: { justified: 1 } });

			const { result } = renderHook(() => useBulkJustifyAttendance(), { wrapper });
			result.current.mutate({ recordIds: ['r-1'], reason: 'Enfermedad' });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));
			expect(invalidate).toHaveBeenCalledWith({ queryKey: ['attendance'] });
		});

		it('exposes the failing records of a 422', async () => {
			const { invalidate, wrapper } = createClient();
			mock.onPost(ATTENDANCE_ROUTES.justifyBulk).reply(422, {
				message: 'Unprocessable',
				details: [{ recordId: 'r-2', reason: 'not justifiable' }],
			});

			const { result } = renderHook(() => useBulkJustifyAttendance(), { wrapper });
			result.current.mutate({ recordIds: ['r-1', 'r-2'], reason: 'Enfermedad' });

			await waitFor(() => expect(result.current.isError).toBe(true));
			expect(result.current.error?.response?.status).toBe(422);
			expect(result.current.error?.response?.data).toMatchObject({
				details: [{ recordId: 'r-2', reason: 'not justifiable' }],
			});
			expect(invalidate).not.toHaveBeenCalled();
		});
	});

	describe('useBulkJustifyWorkshopAttendance', () => {
		it('posts the record ids and invalidates the commission attendance', async () => {
			const { invalidate, wrapper } = createClient();
			let sentBody: unknown;
			mock.onPost(ATTENDANCE_ROUTES.workshopJustifyBulk).reply((config) => {
				sentBody = JSON.parse(config.data);
				return [201, { success: true, data: { justified: 2 } }];
			});

			const { result } = renderHook(() => useBulkJustifyWorkshopAttendance(), {
				wrapper,
			});
			result.current.mutate({
				recordIds: ['w-1', 'w-2'],
				reason: 'Enfermedad',
				commissionId: 'c-1',
				date: '2026-03-10',
			});

			await waitFor(() => expect(result.current.isSuccess).toBe(true));
			expect(sentBody).toEqual({
				recordIds: ['w-1', 'w-2'],
				reason: 'Enfermedad',
			});
			expect(result.current.data).toEqual({ justified: 2 });
			expect(invalidate).toHaveBeenCalledWith({
				queryKey: queryKeys.attendance.workshop('c-1', '2026-03-10'),
			});
		});

		it('invalidates all workshop queries without commission and date', async () => {
			const { invalidate, wrapper } = createClient();
			mock
				.onPost(ATTENDANCE_ROUTES.workshopJustifyBulk)
				.reply(201, { success: true, data: { justified: 1 } });

			const { result } = renderHook(() => useBulkJustifyWorkshopAttendance(), {
				wrapper,
			});
			result.current.mutate({ recordIds: ['w-1'], reason: 'Enfermedad' });

			await waitFor(() => expect(result.current.isSuccess).toBe(true));
			expect(invalidate).toHaveBeenCalledWith({
				queryKey: ['attendance', 'workshop'],
			});
		});

		it('exposes the failing records of a 422', async () => {
			const { wrapper } = createClient();
			mock.onPost(ATTENDANCE_ROUTES.workshopJustifyBulk).reply(422, {
				message: 'Unprocessable',
				details: [
					{ recordId: 'w-1', reason: 'not justifiable' },
					{ recordId: 'w-2', reason: 'forbidden' },
				],
			});

			const { result } = renderHook(() => useBulkJustifyWorkshopAttendance(), {
				wrapper,
			});
			result.current.mutate({ recordIds: ['w-1', 'w-2'], reason: 'Enfermedad' });

			await waitFor(() => expect(result.current.isError).toBe(true));
			expect(result.current.error?.response?.status).toBe(422);
			expect(
				(result.current.error?.response?.data as { details?: unknown[] }).details,
			).toHaveLength(2);
		});
	});
});

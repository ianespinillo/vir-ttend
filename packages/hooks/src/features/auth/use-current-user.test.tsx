import { AUTH_ROUTES } from '@repo/common';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import type { AxiosError } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import React, { type ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { apiClient } from '../../lib/axios-client';
import { useCurrentUser } from './use-current-user';

const mock = new MockAdapter(apiClient);

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	return ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}

describe('useCurrentUser', () => {
	afterEach(() => {
		mock.reset();
	});

	it('fetches current user from GET /users/me and returns unwrapped data', async () => {
		const mockUser = {
			id: 'user-1',
			email: 'test@test.com',
			firstName: 'John',
			lastName: 'Doe',
			role: 'admin',
			tenantId: 'tenant-1',
			mustChangePassword: false,
		};

		mock.onGet(AUTH_ROUTES.me).reply(200, { data: mockUser });

		const { result } = renderHook(() => useCurrentUser(), {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toEqual(mockUser);
	});

	it('returns error state when API fails', async () => {
		mock.onPost(AUTH_ROUTES.refresh).reply(401);
		mock.onGet(AUTH_ROUTES.me).reply(401, { message: 'Unauthorized' });

		const { result } = renderHook(() => useCurrentUser(), {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect((result.current.error as AxiosError | null)?.response?.status).toBe(
			401,
		);
	});

	it('does not retry on failure (retry: false)', async () => {
		let callCount = 0;
		mock.onGet(AUTH_ROUTES.me).reply(() => {
			callCount++;
			return [500, { message: 'Server error' }];
		});

		const { result } = renderHook(() => useCurrentUser(), {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect(callCount).toBe(1);
	});
});

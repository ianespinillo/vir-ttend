// @vitest-environment jsdom
import { AUTH_ROUTES } from '@repo/common';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import MockAdapter from 'axios-mock-adapter';
import React, { type ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { apiClient } from '../../lib/axios-client';
import { useLogin } from './use-login';

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

describe('useLogin', () => {
	afterEach(() => {
		mock.reset();
	});

	it('calls POST /auth/login and returns unwrapped response data', async () => {
		const mockResponse = {
			isSuperAdmin: false,
			userId: 'user-1',
			tenants: [{ tenantId: 't-1', tenantName: 'School A', role: 'admin' }],
		};

		mock.onPost(AUTH_ROUTES.login).reply(200, { data: mockResponse });

		const { result } = renderHook(() => useLogin(), {
			wrapper: createWrapper(),
		});

		result.current.mutate({
			email: 'test@test.com',
			password: 'password123',
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toEqual(mockResponse);
	});

	it('returns error state when API returns an error', async () => {
		mock.onPost(AUTH_ROUTES.refresh).reply(401);
		mock.onPost(AUTH_ROUTES.login).reply(401, { message: 'Invalid credentials' });

		const { result } = renderHook(() => useLogin(), {
			wrapper: createWrapper(),
		});

		result.current.mutate({
			email: 'bad@test.com',
			password: 'wrong',
		});

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect(result.current.error?.response?.status).toBe(401);
	});

	it('sends the correct payload to the API', async () => {
		const credentials = {
			email: 'user@school.edu.ar',
			password: 'securePass123',
		};

		mock.onPost(AUTH_ROUTES.login).reply((config) => {
			const body = JSON.parse(config.data);
			expect(body.email).toBe(credentials.email);
			expect(body.password).toBe(credentials.password);
			return [200, { data: { isSuperAdmin: false, userId: '1', tenants: [] } }];
		});

		const { result } = renderHook(() => useLogin(), {
			wrapper: createWrapper(),
		});

		result.current.mutate(credentials);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});
	});
});

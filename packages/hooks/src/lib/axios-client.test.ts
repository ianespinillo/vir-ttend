import { AUTH_ROUTES } from '@repo/common';
import AxiosMockAdapter from 'axios-mock-adapter';
import { afterEach, describe, expect, it } from 'vitest';
import { apiClient } from './axios-client';

describe('apiClient interceptor de refresh', () => {
	const mock = new AxiosMockAdapter(apiClient);

	afterEach(() => {
		mock.reset();
		mock.restore();
	});

	it('reintenta una sola vez tras un 401 renovando el token', async () => {
		let refreshCalls = 0;
		mock.onPost(AUTH_ROUTES.refresh).reply(() => {
			refreshCalls += 1;
			return [200, { ok: true }];
		});
		mock
			.onGet('/users/me')
			.replyOnce(401)
			.onGet('/users/me')
			.reply(200, { id: '1' });

		const response = await apiClient.get('/users/me');

		expect(response.status).toBe(200);
		expect(refreshCalls).toBe(1);
	});

	it('rechaza el request si el refresh también falla', async () => {
		mock.onPost(AUTH_ROUTES.refresh).reply(401);
		mock.onGet('/users/me').reply(401);

		await expect(apiClient.get('/users/me')).rejects.toBeTruthy();
	});

	it('no refresca cuando el error no es 401', async () => {
		let refreshCalls = 0;
		mock.onPost(AUTH_ROUTES.refresh).reply(() => {
			refreshCalls += 1;
			return [200];
		});
		mock.onGet('/users/me').reply(500);

		await expect(apiClient.get('/users/me')).rejects.toBeTruthy();
		expect(refreshCalls).toBe(0);
	});
});

import { AUTH_ROUTES } from '@repo/common';
import AxiosMockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { apiClient } from './axios-client';

describe('apiClient interceptor de refresh', () => {
	let mock: AxiosMockAdapter;

	beforeEach(() => {
		// onNoMatch: 'throwException' keeps the tests from reaching a real API.
		mock = new AxiosMockAdapter(apiClient, { onNoMatch: 'throwException' });
	});

	afterEach(() => {
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

	it.each([AUTH_ROUTES.login, AUTH_ROUTES.selectTenant, AUTH_ROUTES.logout])(
		'no refresca ante un 401 de %s y conserva el error original',
		async (route) => {
			let refreshCalls = 0;
			mock.onPost(AUTH_ROUTES.refresh).reply(() => {
				refreshCalls += 1;
				return [401, { message: 'Su sesión expiró.' }];
			});
			mock.onPost(route).reply(401, {
				message: 'El correo o la contraseña son incorrectos.',
			});

			await expect(apiClient.post(route)).rejects.toMatchObject({
				response: {
					status: 401,
					data: { message: 'El correo o la contraseña son incorrectos.' },
				},
			});
			expect(refreshCalls).toBe(0);
		},
	);
});

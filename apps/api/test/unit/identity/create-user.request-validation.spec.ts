import { BadRequestException, ValidationPipe } from '@nestjs/common';
import 'reflect-metadata';
import { ROLES } from '@repo/common';
import { CreateUserRequestDto } from '../../../src/modules/identity/application/dto/create-user.request.dto';

const globalPipe = new ValidationPipe({
	whitelist: true,
	forbidNonWhitelisted: true,
	transform: true,
	transformOptions: {
		enableImplicitConversion: true,
	},
});

async function validate(payload: unknown) {
	try {
		const result = await globalPipe.transform(payload, {
			type: 'body',
			metatype: CreateUserRequestDto,
		});
		return { ok: true as const, value: result as CreateUserRequestDto };
	} catch (error) {
		if (error instanceof BadRequestException) {
			return { ok: false as const, response: error.getResponse() };
		}
		throw error;
	}
}

describe('POST /users CreateUserRequestDto validation', () => {
	it('accepts empty string tenantId and transforms to undefined', async () => {
		const outcome = await validate({
			email: 'test@example.com',
			firstName: 'John',
			lastName: 'Doe',
			role: ROLES.PRECEPTOR,
			tenantId: '',
		});

		expect(outcome.ok).toBe(true);
		if (!outcome.ok) return;
		expect(outcome.value.tenantId).toBeUndefined();
	});

	it('accepts undefined tenantId', async () => {
		const outcome = await validate({
			email: 'test@example.com',
			firstName: 'John',
			lastName: 'Doe',
			role: ROLES.SUPERADMIN,
		});

		expect(outcome.ok).toBe(true);
		if (!outcome.ok) return;
		expect(outcome.value.tenantId).toBeUndefined();
	});

	it('accepts valid UUID tenantId', async () => {
		const outcome = await validate({
			email: 'test@example.com',
			firstName: 'John',
			lastName: 'Doe',
			role: ROLES.TEACHER,
			tenantId: '2d4e0f5a-8c1b-4d3e-9a2f-6b8c0d1e2f3a',
		});

		expect(outcome.ok).toBe(true);
		if (!outcome.ok) return;
		expect(outcome.value.tenantId).toBe('2d4e0f5a-8c1b-4d3e-9a2f-6b8c0d1e2f3a');
	});

	it('rejects invalid UUID when non-empty string is provided', async () => {
		const outcome = await validate({
			email: 'test@example.com',
			firstName: 'John',
			lastName: 'Doe',
			role: ROLES.TEACHER,
			tenantId: 'not-a-uuid',
		});

		expect(outcome.ok).toBe(false);
	});
});

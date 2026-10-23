import { BadRequestException, ValidationPipe } from '@nestjs/common';
import 'reflect-metadata';
import { SetCourseStatusRequestDto } from '../../../../src/modules/academic/application/dtos/set-course-status.request.dto';

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
			metatype: SetCourseStatusRequestDto,
		});
		return { ok: true as const, value: result as SetCourseStatusRequestDto };
	} catch (error) {
		if (error instanceof BadRequestException) {
			return { ok: false as const, message: error.getResponse() };
		}
		throw error;
	}
}

describe('PATCH /courses/:id/status body validation', () => {
	it('accepts isActive true and keeps it a real boolean', async () => {
		const outcome = await validate({ isActive: true });

		expect(outcome.ok).toBe(true);
		if (!outcome.ok) return;
		expect(outcome.value.isActive).toBe(true);
	});

	it('accepts isActive false without coercing it to something truthy', async () => {
		const outcome = await validate({ isActive: false });

		expect(outcome.ok).toBe(true);
		if (!outcome.ok) return;
		expect(outcome.value.isActive).toBe(false);
	});

	it.each([
		['missing isActive', {}],
		['null', { isActive: null }],
		['the string "false"', { isActive: 'false' }],
		['the string "true"', { isActive: 'true' }],
		['the number 0', { isActive: 0 }],
	])('rejects %s', async (_label, payload) => {
		const outcome = await validate(payload);

		expect(outcome.ok).toBe(false);
	});
});

import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { SHIFT } from '@repo/common';
import 'reflect-metadata';
import { DeclareNonWorkingDayRequestDto } from '../../../../src/modules/academic/application/dtos/declare-non-working-day.request.dto';

const globalPipe = new ValidationPipe({
	whitelist: true,
	forbidNonWhitelisted: true,
	transform: true,
});

const payload = {
	date: '2026-05-15T00:00:00.000Z',
	reason: 'Paro docente',
};

async function validate(body: unknown) {
	try {
		const value = (await globalPipe.transform(body, {
			type: 'body',
			metatype: DeclareNonWorkingDayRequestDto,
		})) as DeclareNonWorkingDayRequestDto;
		return { ok: true as const, value };
	} catch (error) {
		if (error instanceof BadRequestException) {
			return {
				ok: false as const,
				message: JSON.stringify(error.getResponse()),
			};
		}
		throw error;
	}
}

describe('POST /academic-years/:id/non-working-days body validation', () => {
	it('accepts a suspension without shifts (whole day, backward compatible)', async () => {
		const outcome = await validate(payload);
		expect(outcome.ok).toBe(true);
		if (outcome.ok) expect(outcome.value.shifts).toBeUndefined();
	});

	it('accepts an empty shift list', async () => {
		const outcome = await validate({ ...payload, shifts: [] });
		expect(outcome.ok).toBe(true);
	});

	it('accepts a list of valid shifts', async () => {
		const outcome = await validate({
			...payload,
			shifts: [SHIFT.MORNING, SHIFT.EVENING],
		});
		expect(outcome.ok).toBe(true);
		if (outcome.ok) {
			expect(outcome.value.shifts).toEqual([SHIFT.MORNING, SHIFT.EVENING]);
		}
	});

	it('rejects an unknown shift', async () => {
		const outcome = await validate({ ...payload, shifts: ['NIGHT'] });
		expect(outcome.ok).toBe(false);
		if (!outcome.ok) {
			expect(outcome.message).toContain(
				'Cada turno debe ser MORNING, AFTERNOON o EVENING',
			);
		}
	});

	it('rejects shifts that are not a list', async () => {
		const outcome = await validate({ ...payload, shifts: 'MORNING' });
		expect(outcome.ok).toBe(false);
	});
});

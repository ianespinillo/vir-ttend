import { BadRequestException, ValidationPipe } from '@nestjs/common';
import 'reflect-metadata';
import { CreateAcademicYearRequestDto } from '../../../../src/modules/academic/application/dtos/create-academic-year.request.dto';

/**
 * Reproduces the body produced by the academic settings form
 * (createAcademicYearSchema + AcademicYearForm) and the documented Swagger
 * example, through the global ValidationPipe configured in apps/api/src/main.ts.
 */
const globalPipe = new ValidationPipe({
	whitelist: true,
	forbidNonWhitelisted: true,
	transform: true,
	transformOptions: {
		enableImplicitConversion: true,
	},
});

const uiPayload = {
	year: 2026,
	startDate: '2026-03-01',
	endDate: '2026-12-15',
	absenceThresholdPercent: 15,
	lateCountAbscenseAfterMinutes: 15,
};

const swaggerPayload = {
	year: 2026,
	startDate: '2026-03-02T00:00:00.000Z',
	endDate: '2026-12-18T00:00:00.000Z',
	nonWorkingDays: ['2026-07-09T00:00:00.000Z', '2026-12-25T00:00:00.000Z'],
	absenceThresholdPercent: 15,
	lateCountAbscenseAfterMinutes: 10,
};

async function validate(payload: unknown) {
	try {
		const result = await globalPipe.transform(payload, {
			type: 'body',
			metatype: CreateAcademicYearRequestDto,
		});
		return { ok: true as const, value: result as CreateAcademicYearRequestDto };
	} catch (error) {
		if (error instanceof BadRequestException) {
			return { ok: false as const, message: error.getResponse() };
		}
		throw error;
	}
}

describe('POST /academic-years body validation', () => {
	it('accepts the payload the academic settings form sends', async () => {
		const outcome = await validate(uiPayload);

		expect(outcome.ok).toBe(true);
		if (!outcome.ok) return;
		expect(outcome.value.year).toBe(2026);
		expect(outcome.value.startDate).toBeInstanceOf(Date);
		expect(outcome.value.nonWorkingDays).toBeUndefined();
	});

	it('accepts the documented Swagger body and parses ISO dates', async () => {
		const outcome = await validate(swaggerPayload);

		expect(outcome.ok).toBe(true);
		if (!outcome.ok) return;
		expect(outcome.value.nonWorkingDays).toHaveLength(2);
		expect(outcome.value.nonWorkingDays?.[0]).toBeInstanceOf(Date);
		expect(outcome.value.nonWorkingDays?.[0].toISOString()).toBe(
			'2026-07-09T00:00:00.000Z',
		);
	});

	it('does not require schoolId in the body (tenant comes from the JWT)', async () => {
		const outcome = await validate(uiPayload);

		expect(outcome.ok).toBe(true);
		expect((uiPayload as Record<string, unknown>).schoolId).toBeUndefined();
	});

	it('rejects unknown properties because forbidNonWhitelisted is enabled', async () => {
		const outcome = await validate({ ...uiPayload, unknownField: 1 });

		expect(outcome.ok).toBe(false);
	});
});

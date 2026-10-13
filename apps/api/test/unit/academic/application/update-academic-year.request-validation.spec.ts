import { BadRequestException, ValidationPipe } from '@nestjs/common';
import 'reflect-metadata';
import { UpdateAcademicYearRequestDto } from '../../../../src/modules/academic/application/dtos/update-academic-year.request.dto';

const globalPipe = new ValidationPipe({
	whitelist: true,
	forbidNonWhitelisted: true,
	transform: true,
	transformOptions: {
		enableImplicitConversion: true,
	},
});

const editPayload = {
	year: 2026,
	startDate: '2026-03-01',
	endDate: '2026-12-15',
	absenceThresholdPercent: 15,
	lateCountAbscenseAfterMinutes: 15,
	isActive: false,
};

async function validate(payload: unknown) {
	try {
		const result = await globalPipe.transform(payload, {
			type: 'body',
			metatype: UpdateAcademicYearRequestDto,
		});
		return { ok: true as const, value: result as UpdateAcademicYearRequestDto };
	} catch (error) {
		if (error instanceof BadRequestException) {
			return { ok: false as const, message: error.getResponse() };
		}
		throw error;
	}
}

describe('PUT /academic-years/:id body validation', () => {
	it('accepts the payload sent by the academic settings form when editing', async () => {
		const outcome = await validate(editPayload);

		expect(outcome.ok).toBe(true);
		if (!outcome.ok) return;
		expect(outcome.value.year).toBe(2026);
		expect(outcome.value.startDate).toBeInstanceOf(Date);
		expect(outcome.value.endDate).toBeInstanceOf(Date);
		expect(outcome.value.isActive).toBe(false);
		expect(outcome.value.absenceThresholdPercent).toBe(15);
		expect(outcome.value.lateCountAbscenseAfterMinutes).toBe(15);
	});

	it('accepts partial payload with only nonWorkingDays or thresholds', async () => {
		const outcome = await validate({
			nonWorkingDays: ['2026-07-09T00:00:00.000Z'],
			absenceThresholdPercent: 20,
		});

		expect(outcome.ok).toBe(true);
		if (!outcome.ok) return;
		expect(outcome.value.nonWorkingDays).toHaveLength(1);
		expect(outcome.value.nonWorkingDays?.[0]).toBeInstanceOf(Date);
		expect(outcome.value.absenceThresholdPercent).toBe(20);
	});

	it('rejects unknown properties because forbidNonWhitelisted is enabled', async () => {
		const outcome = await validate({ ...editPayload, unknownProperty: 123 });

		expect(outcome.ok).toBe(false);
	});
});

import { BadRequestException, ValidationPipe } from '@nestjs/common';
import 'reflect-metadata';
import { BulkJustifyAttendanceRequestDto } from '../../../src/modules/attendance/application/dtos/bulk-justify-attendance.request.dto';

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
			metatype: BulkJustifyAttendanceRequestDto,
		});
		return {
			ok: true as const,
			value: result as BulkJustifyAttendanceRequestDto,
		};
	} catch (error) {
		if (error instanceof BadRequestException) {
			return { ok: false as const, message: error.getResponse() };
		}
		throw error;
	}
}

const uuid = (n: number) =>
	`5c4d3e2f-1a2b-4c4d-8e6f-${String(n).padStart(12, '0')}`;

describe('POST justify/bulk body validation', () => {
	it('accepts ids with a reason and keeps the optional notes', async () => {
		const outcome = await validate({
			recordIds: [uuid(1), uuid(2)],
			reason: 'Certificado médico',
			notes: 'Hospital',
		});

		expect(outcome.ok).toBe(true);
		if (!outcome.ok) return;
		expect(outcome.value.recordIds).toEqual([uuid(1), uuid(2)]);
		expect(outcome.value.notes).toBe('Hospital');
	});

	it('accepts exactly 200 ids and no notes', async () => {
		const outcome = await validate({
			recordIds: Array.from({ length: 200 }, (_, i) => uuid(i)),
			reason: 'Enfermedad',
		});

		expect(outcome.ok).toBe(true);
	});

	it.each([
		['an empty array', { recordIds: [], reason: 'x' }],
		[
			'more than 200 ids',
			{ recordIds: Array.from({ length: 201 }, (_, i) => uuid(i)), reason: 'x' },
		],
		['duplicated ids', { recordIds: [uuid(1), uuid(1)], reason: 'x' }],
		['a non-UUID id', { recordIds: [uuid(1), 'not-a-uuid'], reason: 'x' }],
		['a non-array recordIds', { recordIds: uuid(1), reason: 'x' }],
		['missing recordIds', { reason: 'x' }],
		['a missing reason', { recordIds: [uuid(1)] }],
		['an empty reason', { recordIds: [uuid(1)], reason: '' }],
		['an unknown field', { recordIds: [uuid(1)], reason: 'x', extra: 1 }],
	])('rejects %s', async (_label, payload) => {
		const outcome = await validate(payload);

		expect(outcome.ok).toBe(false);
	});
});

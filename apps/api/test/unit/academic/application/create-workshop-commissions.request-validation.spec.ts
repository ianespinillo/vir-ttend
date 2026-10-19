import { BadRequestException, ValidationPipe } from '@nestjs/common';
import 'reflect-metadata';
import { CreateWorkshopCommissionsRequestDto } from '../../../../src/modules/academic/application/dtos/create-workshop-commissions.request.dto';

/** Same options as the global ValidationPipe in apps/api/src/main.ts. */
const globalPipe = new ValidationPipe({
	whitelist: true,
	forbidNonWhitelisted: true,
	transform: true,
	transformOptions: { enableImplicitConversion: true },
});

const validate = (body: unknown) =>
	globalPipe.transform(body, {
		type: 'body',
		metatype: CreateWorkshopCommissionsRequestDto,
	});

describe('CreateWorkshopCommissionsRequestDto', () => {
	it('accepts an empty body (the API defaults to two commissions)', async () => {
		await expect(validate({})).resolves.toMatchObject({});
	});

	it.each([1, 2])('accepts count %i', async (count) => {
		await expect(validate({ count })).resolves.toMatchObject({ count });
	});

	it.each([0, 3, 'dos'])('rejects count %p', async (count) => {
		await expect(validate({ count })).rejects.toThrow(BadRequestException);
	});
});

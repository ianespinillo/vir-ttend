import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { Type } from 'class-transformer';
import {
	IsEmail,
	IsEnum,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUUID,
	MaxLength,
	Min,
	MinLength,
	ValidateNested,
} from 'class-validator';
import { validationExceptionFactory } from '../../../../src/common/validation/validation-exception.factory';

enum Shift {
	MORNING = 'MORNING',
	AFTERNOON = 'AFTERNOON',
}

class AddressDto {
	@IsString()
	@IsNotEmpty()
	street!: string;
}

class SampleDto {
	@IsString()
	@IsNotEmpty()
	name!: string;

	@IsEmail()
	email!: string;

	@IsUUID()
	courseId!: string;

	@IsEnum(Shift)
	shift!: Shift;

	@MinLength(8)
	@MaxLength(20)
	password!: string;

	@Min(1)
	yearNumber!: number;

	@IsOptional()
	@MinLength(3, { message: 'El apodo es demasiado corto.' })
	nickname?: string;

	@IsOptional()
	@ValidateNested()
	@Type(() => AddressDto)
	address?: AddressDto;
}

const pipe = new ValidationPipe({
	whitelist: true,
	forbidNonWhitelisted: true,
	transform: true,
	exceptionFactory: validationExceptionFactory,
});

async function messagesFor(body: Record<string, unknown>): Promise<string[]> {
	try {
		await pipe.transform(body, { type: 'body', metatype: SampleDto });
	} catch (error) {
		expect(error).toBeInstanceOf(BadRequestException);
		const response = (error as BadRequestException).getResponse() as {
			message: string[];
			error: string;
		};
		expect(response.error).toBe('Bad Request');
		return response.message;
	}
	throw new Error('Expected the body to be rejected');
}

const validBody = {
	name: 'Ana',
	email: 'ana@escuela.edu',
	courseId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
	shift: 'MORNING',
	password: 'segura123',
	yearNumber: 2,
};

describe('validationExceptionFactory', () => {
	it('accepts a valid body', async () => {
		await expect(
			pipe.transform(validBody, { type: 'body', metatype: SampleDto }),
		).resolves.toBeInstanceOf(SampleDto);
	});

	it('answers each failed rule with a Spanish message', async () => {
		const messages = await messagesFor({
			name: '',
			email: 'no-es-mail',
			courseId: '123',
			shift: 'NIGHT',
			password: 'corta',
			yearNumber: 0,
		});

		expect(messages).toEqual(
			expect.arrayContaining([
				'El campo name es obligatorio.',
				'El campo email debe ser un correo electrónico válido.',
				'El campo courseId debe ser un identificador válido.',
				'El campo shift debe ser uno de los siguientes valores: MORNING, AFTERNOON.',
				'El campo password debe tener al menos 8 caracteres.',
				'El campo yearNumber debe ser mayor o igual a 1.',
			]),
		);
		expect(messages.join(' ')).not.toMatch(/must|should/);
	});

	it('reports the maximum length', async () => {
		const messages = await messagesFor({
			...validBody,
			password: 'x'.repeat(21),
		});

		expect(messages).toEqual([
			'El campo password debe tener como máximo 20 caracteres.',
		]);
	});

	it('rejects fields that the request does not accept', async () => {
		const messages = await messagesFor({ ...validBody, role: 'admin' });

		expect(messages).toEqual(['El campo role no está permitido.']);
	});

	it('keeps a custom message declared in the DTO', async () => {
		const messages = await messagesFor({ ...validBody, nickname: 'ab' });

		expect(messages).toEqual(['El apodo es demasiado corto.']);
	});

	it('names nested fields with their full path', async () => {
		const messages = await messagesFor({
			...validBody,
			address: { street: '' },
		});

		expect(messages).toEqual(['El campo address.street es obligatorio.']);
	});
});

import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { LEVEL, ROLES, SHIFT } from '@repo/common';
import { ValidLevelPipe } from '../../../../src/common/pipes/valid-level.pipe';
import { ValidRolePipe } from '../../../../src/common/pipes/valid-role.pipe';
import { ValidShiftPipe } from '../../../../src/common/pipes/valid-shift.pipe';

const metadata: ArgumentMetadata = { type: 'query' };

describe('enum param pipes', () => {
	it('ValidShiftPipe accepts a known shift', () => {
		expect(new ValidShiftPipe().transform(SHIFT.MORNING, metadata)).toBe(
			SHIFT.MORNING,
		);
	});

	it('ValidShiftPipe answers 400 with a Spanish message for an unknown shift', () => {
		expect(() => new ValidShiftPipe().transform('NIGHT', metadata)).toThrow(
			new BadRequestException('El turno "NIGHT" no es válido.'),
		);
	});

	it('ValidRolePipe accepts a known role key', () => {
		expect(new ValidRolePipe().transform('ADMIN', metadata)).toBe('ADMIN');
		expect(ROLES.ADMIN).toBeDefined();
	});

	it('ValidRolePipe answers 400 with a Spanish message for an unknown role', () => {
		expect(() => new ValidRolePipe().transform('OWNER', metadata)).toThrow(
			new BadRequestException('El rol "OWNER" no es válido.'),
		);
	});

	it('ValidLevelPipe keeps accepting a known level and an empty value', () => {
		const pipe = new ValidLevelPipe();
		expect(pipe.transform(LEVEL.PRIMARY)).toBe(LEVEL.PRIMARY);
		expect(pipe.transform('')).toBeUndefined();
	});

	it('ValidLevelPipe answers 400 with a Spanish message for an unknown level', () => {
		expect(() => new ValidLevelPipe().transform('UNIVERSITY')).toThrow(
			new BadRequestException('El nivel "UNIVERSITY" no es válido.'),
		);
	});
});

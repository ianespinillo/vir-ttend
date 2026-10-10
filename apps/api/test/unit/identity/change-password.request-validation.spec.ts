import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ChangePasswordRequestDto } from '../../../src/modules/identity/application/dto/change-password.request.dto';

describe('PATCH /users/me/password ChangePasswordRequestDto validation', () => {
	it('accepts matching newPassword and confirmNewPassword', async () => {
		const dto = plainToInstance(ChangePasswordRequestDto, {
			oldPassword: 'OldPassword123!',
			newPassword: 'NewPassword123!',
			confirmNewPassword: 'NewPassword123!',
		});
		const errors = await validate(dto);
		expect(errors).toHaveLength(0);
	});

	it('rejects when confirmNewPassword does not match newPassword', async () => {
		const dto = plainToInstance(ChangePasswordRequestDto, {
			oldPassword: 'OldPassword123!',
			newPassword: 'NewPassword123!',
			confirmNewPassword: 'DifferentPassword123!',
		});
		const errors = await validate(dto);
		expect(errors).toHaveLength(1);
		expect(errors[0].constraints?.matchConstraint).toBe('Passwords do not match');
	});

	it('rejects when newPassword is too short', async () => {
		const dto = plainToInstance(ChangePasswordRequestDto, {
			oldPassword: 'OldPassword123!',
			newPassword: 'short',
			confirmNewPassword: 'short',
		});
		const errors = await validate(dto);
		expect(errors.length).toBeGreaterThan(0);
		expect(errors[0].constraints?.minLength).toBeDefined();
	});
});

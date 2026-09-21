import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class DeactivateMembershipRequestDto {
	@IsNotEmpty()
	@IsEmail()
	@ApiProperty({
		description: 'Email del usuario a desvincular',
		example: 'tec1@abc.gob.ar',
	})
	email!: string;
}

import { UserResponseDto } from './user.response.dto';

// auth.response.dto.ts
export class AuthResponseDto {
	user!: UserResponseDto;

	constructor(user: UserResponseDto) {
		this.user = user;
	}
}

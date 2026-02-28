import { Injectable } from '@nestjs/common';
import { IUserTenantMembershipRepository } from '../../../domain/repositories/user-tenant-membership.repository.interface';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserResponseDto } from '../../dto/user.response.dto';
import { GetCurrentUserQuery } from './get-current-user.query';

@Injectable()
export class GetCurrentUserHandler {
	constructor(
		private readonly membersRepo: IUserTenantMembershipRepository,
		private readonly userRepo: IUserRepository,
	) {}
	async execute({
		userId,
		tenantId,
	}: GetCurrentUserQuery): Promise<UserResponseDto> {
		const membership = await this.membersRepo.findByUserAndTenant(
			userId,
			tenantId,
		);
		if (!membership?.isActive)
			throw new Error("User doesn't belongs to this tenant");
		const user = await this.userRepo.findById(userId);
		if (!user) throw new Error('User not found');
		const dto = new UserResponseDto();
		dto.email = user.email;
		dto.firstName = user.firstName;
		dto.id = userId;
		dto.lastName = user.lastName;
		dto.mustChangePassword = user.mustChangePassword;
		dto.role = membership.role;
		dto.tenantId = tenantId;
		return dto;
	}
}

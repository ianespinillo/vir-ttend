import { Inject, Injectable } from '@nestjs/common';
import { ROLES, Roles } from '@repo/common';
import { IUserTenantMembershipRepository } from '../../../domain/repositories/user-tenant-membership.repository.interface';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserResponseDto } from '../../dto/user.response.dto';
import { GetCurrentUserQuery } from './get-current-user.query';

@Injectable()
export class GetCurrentUserHandler {
	constructor(
		@Inject('IUserTenantMembershipRepository')
		private readonly membersRepo: IUserTenantMembershipRepository,
		@Inject('IUserRepository')
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
		let role: Roles;
		if (membership?.isActive) {
			role = membership.role;
		} else {
			const memberships = await this.membersRepo.findByUserId(userId);
			if (memberships.length > 0)
				throw new Error("User doesn't belongs to this tenant");
			role = ROLES.SUPERADMIN;
		}
		const user = await this.userRepo.findById(userId);
		if (!user) throw new Error('User not found');
		const dto = new UserResponseDto();
		dto.email = user.email;
		dto.firstName = user.firstName;
		dto.id = userId;
		dto.lastName = user.lastName;
		dto.mustChangePassword = user.mustChangePassword;
		dto.role = role;
		dto.tenantId = tenantId;
		return dto;
	}
}

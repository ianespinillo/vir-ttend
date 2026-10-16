import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../../../common/errors';
import { IUserTenantMembershipRepository } from '../../../domain/repositories/user-tenant-membership.repository.interface';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserWithMembershipResponseDto } from '../../dto/user-with-membership.response.dto';
import { GetUserWithMembershipQuery } from './get-user-with-membership.query';

@Injectable()
export class GetUserWithMembershipHandler {
	constructor(
		@Inject('IUserTenantMembershipRepository')
		private readonly memberRepo: IUserTenantMembershipRepository,
		@Inject('IUserRepository')
		private readonly userRepo: IUserRepository,
	) {}
	async execute(
		command: GetUserWithMembershipQuery,
	): Promise<UserWithMembershipResponseDto> {
		const user = await this.userRepo.findById(command.userId);
		if (!user) throw new NotFoundError('Usuario no encontrado.');
		const membership = await this.memberRepo.findByUserAndTenant(
			command.userId,
			command.tenantId,
		);
		if (!membership)
			throw new NotFoundError('El usuario no pertenece a esta institución.');
		return new UserWithMembershipResponseDto(
			user.id,
			user.email,
			user.firstName,
			user.lastName,
			membership.role,
			membership.isActive,
			user.mustChangePassword,
		);
	}
}

import { BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import { IUserTenantMembershipRepository } from '../../../domain/repositories/user-tenant-membership.repository.interface';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UpdateUserCommand } from './update-user.command';

export class UpdateUserHandler {
	constructor(
		@Inject('IUserRepository') private userRepository: IUserRepository,
		@Inject('IUserTenantMembershipRepository')
		private memberRepo: IUserTenantMembershipRepository,
	) {}
	async execute(command: UpdateUserCommand): Promise<void> {
		const user = await this.userRepository.findById(command.userId);
		if (!user)
			throw new NotFoundException(`User with id ${command.userId} not found`);
		if (command.props.email) {
			const takenEmail = await this.userRepository.findByEmail(
				command.props.email.getValue(),
			);
			if (takenEmail && takenEmail.id !== command.userId)
				throw new BadRequestException('Email already in use');
		}
		if (command.tenantId) {
			const membership = await this.memberRepo.findByUserAndTenant(
				command.userId,
				command.tenantId,
			);
			if (!membership)
				throw new NotFoundException('User not found in this tenant');
		}
		user.update(command.props);
		await this.userRepository.save(user);
	}
}

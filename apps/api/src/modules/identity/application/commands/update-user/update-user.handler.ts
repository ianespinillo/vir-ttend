import { Inject, Injectable } from '@nestjs/common';
import { ConflictError, NotFoundError } from '../../../../../common/errors';
import { IUserTenantMembershipRepository } from '../../../domain/repositories/user-tenant-membership.repository.interface';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UpdateUserCommand } from './update-user.command';

@Injectable()
export class UpdateUserHandler {
	constructor(
		@Inject('IUserRepository') private userRepository: IUserRepository,
		@Inject('IUserTenantMembershipRepository')
		private memberRepo: IUserTenantMembershipRepository,
	) {}
	async execute(command: UpdateUserCommand): Promise<void> {
		const user = await this.userRepository.findById(command.userId);
		if (!user) throw new NotFoundError('Usuario no encontrado.');
		if (command.props.email) {
			const takenEmail = await this.userRepository.findByEmail(
				command.props.email.getValue(),
			);
			if (takenEmail && takenEmail.id !== command.userId)
				throw new ConflictError('El correo electrónico ya está en uso.');
		}
		if (command.tenantId) {
			const membership = await this.memberRepo.findByUserAndTenant(
				command.userId,
				command.tenantId,
			);
			if (!membership)
				throw new NotFoundError('El usuario no pertenece a esta institución.');
		}
		user.update(command.props);
		await this.userRepository.save(user);
	}
}

import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ROLES, Roles } from '@repo/common';
import { ForbiddenError, NotFoundError } from '../../../../../common/errors';
import { getTenancyConfig } from '../../../../shared/config/tenancy.config';
import { RefreshToken } from '../../../domain/entities/refresh-token.entity';
import { User } from '../../../domain/entities/user.entity';
import { UserLoggedInEvent } from '../../../domain/events/user-logged-in.event';
import { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface';
import { ITenantRepository } from '../../../domain/repositories/tenant.repository.interface';
import { IUserTenantMembershipRepository } from '../../../domain/repositories/user-tenant-membership.repository.interface';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { TokenService } from '../../../domain/services/token.service';
import { UserResponseDto } from '../../dto/user.response.dto';
import { SelectTenantCommand } from './select-tenant.command';

interface ExpectedReturn {
	accessToken: string;
	refreshToken: string;
	user: UserResponseDto;
}

const INVALID_TENANT_SELECTION =
	'No tiene acceso a la institución seleccionada.';
const SUPERADMIN_DISABLED =
	'El acceso de superadministrador está deshabilitado en esta instancia.';

@Injectable()
export class SelectTenantHandler {
	constructor(
		@Inject('IUserRepository')
		private readonly userRepo: IUserRepository,
		@Inject('IUserTenantMembershipRepository')
		private readonly memberRepo: IUserTenantMembershipRepository,
		@Inject('IRefreshTokenRepository')
		private readonly refreshTokenRepo: IRefreshTokenRepository,
		@Inject('ITenantRepository')
		private readonly tenantRepo: ITenantRepository,
		private readonly tokenService: TokenService,
		private readonly em: EventEmitter2,
	) {}

	async execute(command: SelectTenantCommand): Promise<ExpectedReturn> {
		const { userId, tenantId, userAgent, ipAddress } = command;
		const tenancy = getTenancyConfig();

		if (tenancy.TENANCY_MODE === 'single') {
			if (tenantId !== tenancy.TENANT_ID) {
				throw new ForbiddenError(INVALID_TENANT_SELECTION);
			}
		}

		const tenant = await this.tenantRepo.findById(tenantId);
		if (!tenant || !tenant.isActive) {
			throw new ForbiddenError(INVALID_TENANT_SELECTION);
		}

		const membership = await this.memberRepo.findByUserAndTenant(
			userId,
			tenantId,
		);
		let role: Roles;
		let isImpersonating = false;
		const tenantName: string = tenant.name;

		if (membership?.isActive) {
			role = membership.role;
		} else {
			if (!command.isSuperAdminOrImpersonating) {
				const memberships = await this.memberRepo.findByUserId(userId);
				if (memberships.length > 0)
					throw new ForbiddenError(INVALID_TENANT_SELECTION);
			}

			if (tenancy.TENANCY_MODE === 'single' && !tenancy.ALLOW_SUPERADMIN) {
				throw new ForbiddenError(SUPERADMIN_DISABLED);
			}

			role = ROLES.ADMIN;
			isImpersonating = true;
		}

		return this.issueSession(
			userId,
			tenantId,
			role,
			userAgent,
			ipAddress,
			isImpersonating,
			tenantName,
		);
	}

	async startGlobalSuperAdminSession(
		userId: string,
		userAgent: string,
		ipAddress: string,
	): Promise<ExpectedReturn> {
		const tenancy = getTenancyConfig();
		if (tenancy.TENANCY_MODE === 'single' && !tenancy.ALLOW_SUPERADMIN) {
			throw new ForbiddenError(SUPERADMIN_DISABLED);
		}

		return this.issueSession(
			userId,
			'',
			ROLES.SUPERADMIN,
			userAgent,
			ipAddress,
			false,
			undefined,
		);
	}

	private async issueSession(
		userId: string,
		tenantId: string,
		role: Roles,
		userAgent: string,
		ipAddress: string,
		isImpersonating = false,
		tenantName?: string,
	): Promise<ExpectedReturn> {
		const user = await this.userRepo.findById(userId);
		if (!user) throw new NotFoundError('Usuario no encontrado.');
		const accessToken = this.tokenService.generateAccessToken({
			email: user.email,
			role,
			tenantId,
			sub: userId,
			isImpersonating,
		});
		const refToken = this.tokenService.generateRefreshToken();
		const refTokenHash = this.tokenService.hashToken(refToken);
		await this.refreshTokenRepo.save(
			RefreshToken.create({
				userId,
				token: refTokenHash,
				tenantId,
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			}),
		);
		this.em.emit(
			'user.logged-in',
			new UserLoggedInEvent(userId, tenantId, ipAddress, userAgent),
		);
		const dto = new UserResponseDto();
		dto.email = user.email;
		dto.firstName = user.firstName;
		dto.id = userId;
		dto.lastName = user.lastName;
		dto.mustChangePassword = user.mustChangePassword;
		dto.role = role;
		dto.tenantId = tenantId;
		dto.isImpersonating = isImpersonating;
		dto.tenantName = tenantName;
		return {
			accessToken,
			refreshToken: refToken,
			user: dto,
		};
	}
}

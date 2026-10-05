import {
	Inject,
	Injectable,
	Logger,
	OnApplicationBootstrap,
} from '@nestjs/common';
import { ROLES } from '@repo/common';
import { getTenancyConfig } from '../../../shared/config/tenancy.config';
import { Tenant } from '../../domain/entities/tenant.entity';
import { UserTenantMembership } from '../../domain/entities/user-tenant-membership.entity';
import { User } from '../../domain/entities/user.entity';
import { ITenantRepository } from '../../domain/repositories/tenant.repository.interface';
import { IUserTenantMembershipRepository } from '../../domain/repositories/user-tenant-membership.repository.interface';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { PasswordService } from '../../domain/services/password.service';
import { Password } from '../../domain/value-objects/password.vo';

@Injectable()
export class TenancyBootstrapService implements OnApplicationBootstrap {
	private readonly logger = new Logger(TenancyBootstrapService.name);

	constructor(
		@Inject('ITenantRepository')
		private readonly tenantRepo: ITenantRepository,
		@Inject('IUserRepository')
		private readonly userRepo: IUserRepository,
		@Inject('IUserTenantMembershipRepository')
		private readonly memberRepo: IUserTenantMembershipRepository,
		private readonly passwordService: PasswordService,
	) {}

	async onApplicationBootstrap(): Promise<void> {
		const tenancy = getTenancyConfig();

		if (tenancy.TENANCY_MODE !== 'single') {
			return;
		}

		await this.bootstrapSingleTenant();
	}

	async bootstrapSingleTenant(): Promise<void> {
		const tenancy = getTenancyConfig();
		const tenantId = tenancy.TENANT_ID;
		const tenantSlug = tenancy.TENANT_SLUG;

		if (!tenantId || !tenantSlug) {
			this.logger.error(
				'TENANCY_MODE=single requires TENANT_ID and TENANT_SLUG to bootstrap.',
			);
			return;
		}

		this.logger.log(
			`Starting bootstrap for single-tenant mode (${tenantSlug})...`,
		);

		// 1. Ensure Tenant exists idempotently
		let tenant = await this.tenantRepo.findById(tenantId);
		if (!tenant) {
			const bySubdomain = await this.tenantRepo.findBySubdomain(tenantSlug);
			if (bySubdomain) {
				tenant = bySubdomain;
			}
		}

		const contactEmail =
			tenancy.BOOTSTRAP_ADMIN_EMAIL ?? `admin@${tenantSlug}.edu.ar`;

		if (!tenant) {
			tenant = Tenant.reconstitute({
				id: tenantId,
				name: tenancy.TENANT_NAME,
				subdomain: tenantSlug,
				contactEmail,
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			await this.tenantRepo.save(tenant);
			this.logger.log(
				`Created tenant entity: "${tenant.name}" (${tenant.id}) with subdomain "${tenant.subdomain.getRaw()}"`,
			);
		} else {
			if (!tenant.isActive) {
				tenant.activate();
				await this.tenantRepo.save(tenant);
				this.logger.log(
					`Activated existing tenant "${tenant.name}" (${tenant.id})`,
				);
			}
		}

		// 2. Ensure initial ADMIN user exists idempotently
		const { total: adminCount } = await this.memberRepo.findByTenant(tenantId, {
			page: 1,
			limit: 1,
			role: ROLES.ADMIN,
		});

		if (adminCount === 0) {
			const adminEmail = contactEmail;
			let user = await this.userRepo.findByEmail(adminEmail);

			let generatedPassword: string | null = null;
			const plainPassword =
				tenancy.BOOTSTRAP_ADMIN_PASSWORD ||
				(() => {
					generatedPassword = Password.generateRandomPassword(12).getRaw();
					return generatedPassword;
				})();

			if (!user) {
				const hashedPassword = await this.passwordService.hashPassword(
					new Password(plainPassword),
				);
				user = User.create({
					email: adminEmail,
					firstName: tenancy.BOOTSTRAP_ADMIN_FIRST_NAME,
					lastName: tenancy.BOOTSTRAP_ADMIN_LAST_NAME,
					password: hashedPassword,
				});
				await this.userRepo.save(user);
				this.logger.log(`Created bootstrap admin user: ${adminEmail}`);
			}

			const membership = await this.memberRepo.findByUserAndTenant(
				user.id,
				tenantId,
			);
			if (!membership) {
				await this.memberRepo.save(
					UserTenantMembership.create(user.id, tenantId, ROLES.ADMIN),
				);
				this.logger.log(
					`Assigned ADMIN membership for user ${user.email} in tenant ${tenantId}`,
				);
			}

			if (generatedPassword) {
				this.logger.warn(
					`\n=================================================================\n[VIR-TTEND BOOTSTRAP] Initial ADMIN credentials for ${tenantSlug}:\nEmail:    ${adminEmail}\nPassword: ${generatedPassword}\nNote: Keep this password safe and change it after first login.\n=================================================================\n`,
				);
			}
		} else {
			this.logger.log(
				`Tenant ${tenantSlug} already has ${adminCount} ADMIN user(s). Skipping user creation.`,
			);
		}

		this.logger.log('Single-tenant bootstrap completed successfully.');
	}
}

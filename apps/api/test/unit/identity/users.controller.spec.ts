import { JwtPayload, ROLES } from '@repo/common';
import { MockProxy, mock } from 'jest-mock-extended';
import { ChangeMembershipRoleHandler } from '../../../src/modules/identity/application/commands/change-membership-role/change-membership-role.handler';
import { ChangePasswordHandler } from '../../../src/modules/identity/application/commands/change-password/change-password.handler';
import { CreateUserHandler } from '../../../src/modules/identity/application/commands/create-user/create-user.handler';
import { DeactivateMembershipHandler } from '../../../src/modules/identity/application/commands/deactivate-membership/deactivate-membership.handler';
import { ResetUserPasswordHandler } from '../../../src/modules/identity/application/commands/reset-user-password/reset-user-password.handler';
import { ToggleUserStatusHandler } from '../../../src/modules/identity/application/commands/toggle-user-status/toggle-user-status.handler';
import { UpdateUserHandler } from '../../../src/modules/identity/application/commands/update-user/update-user.handler';
import { GetCurrentUserHandler } from '../../../src/modules/identity/application/queries/get-current-user/get-current-user.handler';
import { GetMyTenantsHandler } from '../../../src/modules/identity/application/queries/get-my-tenants/get-my-tenants.handler';
import { ListUsersByTenantHandler } from '../../../src/modules/identity/application/queries/list-users-by-tenant/list-users-by-tenant.handler';
import { UsersController } from '../../../src/modules/identity/presentation/controllers/users.controller';

describe('UsersController.list', () => {
	let controller: UsersController;
	let listUsersByTenantHandler: MockProxy<ListUsersByTenantHandler>;

	const actor = (role: JwtPayload['role']): JwtPayload => ({
		sub: 'user-1',
		tenantId: 'tenant-1',
		role,
		email: 'user@example.com',
	});

	beforeEach(() => {
		listUsersByTenantHandler = mock<ListUsersByTenantHandler>();
		controller = new UsersController(
			mock<CreateUserHandler>(),
			mock<GetCurrentUserHandler>(),
			mock<ChangeMembershipRoleHandler>(),
			mock<DeactivateMembershipHandler>(),
			listUsersByTenantHandler,
			mock<ChangePasswordHandler>(),
			mock<UpdateUserHandler>(),
			mock<ToggleUserStatusHandler>(),
			mock<ResetUserPasswordHandler>(),
			mock<GetMyTenantsHandler>(),
		);
	});

	it('allows admins, superadmins and preceptors', () => {
		expect(Reflect.getMetadata('roles', UsersController.prototype.list)).toEqual([
			ROLES.ADMIN,
			ROLES.SUPERADMIN,
			ROLES.PRECEPTOR,
		]);
	});

	it('limits preceptors to the teachers of their own institution', async () => {
		await controller.list(
			actor(ROLES.PRECEPTOR),
			'tenant-2',
			ROLES.ADMIN,
			'ana',
			1,
			20,
		);

		expect(listUsersByTenantHandler.execute.mock.calls[0][0]).toMatchObject({
			tenantId: 'tenant-1',
			role: ROLES.TEACHER,
			search: 'ana',
		});
	});

	it('keeps the requested role filter for admins', async () => {
		await controller.list(actor(ROLES.ADMIN), undefined, ROLES.PRECEPTOR);

		expect(listUsersByTenantHandler.execute.mock.calls[0][0]).toMatchObject({
			tenantId: 'tenant-1',
			role: ROLES.PRECEPTOR,
		});
	});
});

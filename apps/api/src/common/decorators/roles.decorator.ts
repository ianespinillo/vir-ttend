import { SetMetadata } from '@nestjs/common';
import { Roles } from '@repo/common';

export const RolesDecorator = (...roles: Roles[]) =>
	SetMetadata('roles', roles);

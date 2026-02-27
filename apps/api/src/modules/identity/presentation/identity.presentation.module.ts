import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { TenantsController } from './controllers/tenants.controller';
import { UsersController } from './controllers/users.controller';

@Module({
	controllers: [AuthController, UsersController, TenantsController],
})
export class IdentityPresentationModule {}

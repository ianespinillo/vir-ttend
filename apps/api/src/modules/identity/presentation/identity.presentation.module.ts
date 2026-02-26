import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { UsersController } from './controllers/users.controller';

@Module({
	controllers: [AuthController, UsersController],
})
export class IdentityPresentationModule {}

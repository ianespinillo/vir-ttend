import {
	Body,
	Controller,
	Get,
	Param,
	Patch,
	Post,
	Put,
	Query,
	UseGuards,
} from '@nestjs/common';
import { ROLES } from '@repo/common';
import { JwtPayload } from 'jsonwebtoken';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { RolesDecorator } from '../../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../../common/guard/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guard/roles.guard';
import { CreateTenantCommand } from '../../application/commands/create-tenant/create-tenant.command';
import { CreateTenantHandler } from '../../application/commands/create-tenant/create-tenant.handler';
import { ToggleTenantStatusCommand } from '../../application/commands/toggle-tenant-status/toggle-tenant-status.command';
import { ToggleTenantStatusHandler } from '../../application/commands/toggle-tenant-status/toggle-tenant-status.handler';
import { UpdateTenantCommand } from '../../application/commands/update-tenant/update-tenant.command';
import { UpdateTenantHandler } from '../../application/commands/update-tenant/update-tenant.handler';
import { CreateTenantRequestDto } from '../../application/dto/create-tenant.request.dto';
import { UpdateTenantRequestDto } from '../../application/dto/update-tenant.request.dto';
import { GetTenantHandler } from '../../application/queries/get-tenant/get-tenant.handler';
import { GetTenantQuery } from '../../application/queries/get-tenant/get-tenant.query';
import { ListTenantsHandler } from '../../application/queries/list-tenants/list-tenants.handler';
import { ListTenantsQuery } from '../../application/queries/list-tenants/list-tenants.query';
import { TenantGuard } from '../../infrastructure/auth/guards/tenant.guard';

// tenants.controller.ts
@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@RolesDecorator(ROLES.SUPERADMIN)
export class TenantsController {
	constructor(
		private readonly createTenantHandler: CreateTenantHandler,
		private readonly updateTenantHandler: UpdateTenantHandler,
		private readonly toggleTenantStatusHandler: ToggleTenantStatusHandler,
		private readonly getTenantHandler: GetTenantHandler,
		private readonly listTenantsHandler: ListTenantsHandler,
	) {}

	@Post()
	async create(
		@Body() dto: CreateTenantRequestDto,
		@CurrentUser() user: JwtPayload,
	) {
		return this.createTenantHandler.execute(
			new CreateTenantCommand(dto.name, dto.subdomain, dto.contactEmail),
		);
	}

	@Get()
	async list(@Query('page') page = 1, @Query('limit') limit = 20) {
		return this.listTenantsHandler.execute(new ListTenantsQuery(+page, +limit));
	}

	@Get(':id')
	@UseGuards(TenantGuard)
	async getOne(@Param('id') id: string) {
		return this.getTenantHandler.execute(new GetTenantQuery(id));
	}

	@Put(':id')
	@UseGuards(TenantGuard)
	async update(@Param('id') id: string, @Body() dto: UpdateTenantRequestDto) {
		return this.updateTenantHandler.execute(
			new UpdateTenantCommand(id, dto.name, dto.contactEmail),
		);
	}

	@Patch(':id/status')
	@UseGuards(TenantGuard)
	async toggleStatus(
		@Param('id') id: string,
		@Body('isActive') isActive: boolean,
	) {
		return this.toggleTenantStatusHandler.execute(
			new ToggleTenantStatusCommand(id, isActive),
		);
	}
}

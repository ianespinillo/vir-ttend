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
import {
	ApiCookieAuth,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
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
import { TenantResponseDto } from '../../application/dto/tenant.response.dto';
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
@ApiTags('Tenants')
@ApiCookieAuth('access_token')
export class TenantsController {
	constructor(
		private readonly createTenantHandler: CreateTenantHandler,
		private readonly updateTenantHandler: UpdateTenantHandler,
		private readonly toggleTenantStatusHandler: ToggleTenantStatusHandler,
		private readonly getTenantHandler: GetTenantHandler,
		private readonly listTenantsHandler: ListTenantsHandler,
	) {}

	@Post()
	@ApiOperation({
		summary: 'Crear un tenant (escuela)',
		description:
			'Crea un nuevo tenant con su subdominio y email de contacto, y dispara el evento tenant.created. Body de ejemplo: { "name": "Escuela Técnica N°1", "subdomain": "tec1", "contactEmail": "admin@tec1.edu.ar" }. La respuesta exitosa se envuelve en { success, data: TenantResponseDto, timeStamp }. Los errores se envuelven en { statusCode, timestamp, path, method, message, error }. Roles permitidos: SUPERADMIN.',
	})
	@ApiResponse({
		status: 201,
		description: 'Tenant creado.',
		type: TenantResponseDto,
	})
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	async create(
		@Body() dto: CreateTenantRequestDto,
		@CurrentUser() user: JwtPayload,
	) {
		return this.createTenantHandler.execute(
			new CreateTenantCommand(dto.name, dto.subdomain, dto.contactEmail),
		);
	}

	@Get()
	@ApiOperation({
		summary: 'Listar tenants',
		description:
			'Lista todos los tenants del sistema con paginación. URL: GET /tenants?page=1&limit=20. La respuesta exitosa se envuelve en { success, data: TenantResponseDto[], timeStamp }. Roles permitidos: SUPERADMIN.',
	})
	@ApiQuery({
		name: 'page',
		required: false,
		description: 'Número de página (por defecto 1).',
		type: Number,
		example: 1,
	})
	@ApiQuery({
		name: 'limit',
		required: false,
		description: 'Resultados por página (por defecto 20).',
		type: Number,
		example: 20,
	})
	@ApiResponse({
		status: 200,
		description: 'Lista de tenants.',
		type: TenantResponseDto,
		isArray: true,
	})
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	async list(@Query('page') page = 1, @Query('limit') limit = 20) {
		return this.listTenantsHandler.execute(new ListTenantsQuery(+page, +limit));
	}

	@Get(':id')
	@UseGuards(TenantGuard)
	@ApiOperation({
		summary: 'Obtener un tenant',
		description:
			'Devuelve los datos de un tenant por id. Además del JWT se aplica TenantGuard. URL: GET /tenants/2d4e0f5a-8c1b-4d3e-9a2f-6b8c0d1e2f3a. La respuesta exitosa se envuelve en { success, data: TenantResponseDto, timeStamp }. Roles permitidos: SUPERADMIN.',
	})
	@ApiParam({
		name: 'id',
		description: 'Identificador del tenant (UUID).',
		example: '2d4e0f5a-8c1b-4d3e-9a2f-6b8c0d1e2f3a',
	})
	@ApiResponse({
		status: 200,
		description: 'Datos del tenant.',
		type: TenantResponseDto,
	})
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@ApiResponse({ status: 404, description: 'Tenant no encontrado' })
	async getOne(@Param('id') id: string) {
		return this.getTenantHandler.execute(new GetTenantQuery(id));
	}

	@Put(':id')
	@UseGuards(TenantGuard)
	@ApiOperation({
		summary: 'Actualizar un tenant',
		description:
			'Actualiza el nombre y/o el email de contacto de un tenant. Además del JWT se aplica TenantGuard. URL: PUT /tenants/2d4e0f5a-8c1b-4d3e-9a2f-6b8c0d1e2f3a. Body de ejemplo: { "name": "Escuela Técnica N°1 - Turno Mañana", "contactEmail": "nuevo@tec1.edu.ar" }. La respuesta no devuelve datos (data es null). Roles permitidos: SUPERADMIN.',
	})
	@ApiParam({
		name: 'id',
		description: 'Identificador del tenant (UUID).',
		example: '2d4e0f5a-8c1b-4d3e-9a2f-6b8c0d1e2f3a',
	})
	@ApiResponse({
		status: 200,
		description:
			'Tenant actualizado. La respuesta no devuelve datos (data es null).',
	})
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@ApiResponse({ status: 404, description: 'Tenant no encontrado' })
	async update(@Param('id') id: string, @Body() dto: UpdateTenantRequestDto) {
		return this.updateTenantHandler.execute(
			new UpdateTenantCommand(id, dto.name, dto.contactEmail),
		);
	}

	@Patch(':id/status')
	@UseGuards(TenantGuard)
	@ApiOperation({
		summary: 'Activar o desactivar un tenant',
		description:
			'Cambia el estado de un tenant (activo/inactivo). El body es el booleano isActive. Además del JWT se aplica TenantGuard. URL: PATCH /tenants/2d4e0f5a-8c1b-4d3e-9a2f-6b8c0d1e2f3a/status. Body de ejemplo: { "isActive": false }. La respuesta no devuelve datos (data es null). Roles permitidos: SUPERADMIN.',
	})
	@ApiParam({
		name: 'id',
		description: 'Identificador del tenant (UUID).',
		example: '2d4e0f5a-8c1b-4d3e-9a2f-6b8c0d1e2f3a',
	})
	@ApiResponse({
		status: 200,
		description:
			'Estado del tenant actualizado. La respuesta no devuelve datos (data es null).',
	})
	@ApiResponse({ status: 400, description: 'Validación falló' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	@ApiResponse({ status: 404, description: 'Tenant no encontrado' })
	async toggleStatus(
		@Param('id') id: string,
		@Body('isActive') isActive: boolean,
	) {
		return this.toggleTenantStatusHandler.execute(
			new ToggleTenantStatusCommand(id, isActive),
		);
	}
}

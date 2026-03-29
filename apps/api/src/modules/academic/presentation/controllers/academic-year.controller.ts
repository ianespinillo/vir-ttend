import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	Put,
	UseGuards,
} from '@nestjs/common';
import { JwtPayload, ROLES } from '@repo/common';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { RolesDecorator } from '../../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../../common/guard/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guard/roles.guard';
import { CreateAcademicYearCommand } from '../../application/commands/create-academic-year/create-academic-year.command';
import { CreateAcademicYearHandler } from '../../application/commands/create-academic-year/create-academic-year.handler';
import { UpdateAcademicYearCommand } from '../../application/commands/update-academic-year/update-academic-year.command';
import { UpdateAcademicYearHandler } from '../../application/commands/update-academic-year/update-academic-year.handler';
import { CreateAcademicYearRequestDto } from '../../application/dtos/create-academic-year.request.dto';
import { UpdateAcademicYearRequestDto } from '../../application/dtos/update-academic-year.request.dto';
import { GetAcademicYearsHandler } from '../../application/queries/get-academic-years/get-academic-years.handler';
import { GetAcademicYearsQuery } from '../../application/queries/get-academic-years/get-academic-years.query';
import { GetActiveAcademicYearHandler } from '../../application/queries/get-active-academic-year/get-active-academic-year.handler';
import { GetActiveAcademicYearQuery } from '../../application/queries/get-active-academic-year/get-active-academic-year.query';
// academic-years.controller.ts
@Controller('academic-years')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AcademicYearsController {
	constructor(
		private readonly createAcademicYearHandler: CreateAcademicYearHandler,
		private readonly updateAcademicYearHandler: UpdateAcademicYearHandler,
		private readonly getAcademicYearsHandler: GetAcademicYearsHandler,
		private readonly getActiveAcademicYearHandler: GetActiveAcademicYearHandler,
	) {}

	@Post()
	@RolesDecorator(ROLES.ADMIN)
	async create(
		@Body() dto: CreateAcademicYearRequestDto,
		@CurrentUser() user: JwtPayload,
	) {
		return this.createAcademicYearHandler.execute(
			new CreateAcademicYearCommand(
				user.tenantId,
				dto.year,
				dto.startDate,
				dto.endDate,
				dto.nonWorkingDays,
				dto.absenceThresholdPercent,
				dto.lateCountAbscenseAfterMinutes,
			),
		);
	}

	@Get()
	@RolesDecorator(ROLES.ADMIN, ROLES.PRECEPTOR)
	async list(@CurrentUser() user: JwtPayload) {
		return this.getAcademicYearsHandler.execute(
			new GetAcademicYearsQuery(user.tenantId),
		);
	}

	@Get('active')
	@RolesDecorator(ROLES.ADMIN, ROLES.PRECEPTOR, ROLES.TEACHER)
	async getActive(@CurrentUser() user: JwtPayload) {
		return this.getActiveAcademicYearHandler.execute(
			new GetActiveAcademicYearQuery(user.tenantId),
		);
	}

	@Put(':id')
	@RolesDecorator(ROLES.ADMIN)
	async update(
		@Param('id') id: string,
		@Body() dto: UpdateAcademicYearRequestDto,
	) {
		return this.updateAcademicYearHandler.execute(
			new UpdateAcademicYearCommand(
				id,
				{
					absenceThresholdPercent: dto.absenceThresholdPercent,
					lateCountAbscenseAfterMinutes: dto.lateCountAbscenseAfterMinutes,
				},
				dto.nonWorkingDays,
			),
		);
	}
}

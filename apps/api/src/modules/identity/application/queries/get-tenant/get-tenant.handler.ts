import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../../../common/errors';
import { ITenantRepository } from '../../../domain/repositories/tenant.repository.interface';
import { TenantResponseDto } from '../../dto/tenant.response.dto';
import { GetTenantQuery } from './get-tenant.query';

@Injectable()
export class GetTenantHandler {
	constructor(
		@Inject('ITenantRepository')
		private readonly tenantRepo: ITenantRepository,
	) {}
	async execute(command: GetTenantQuery): Promise<TenantResponseDto> {
		const tenant = await this.tenantRepo.findById(command.tenantId);
		if (!tenant) throw new NotFoundError('Institución no encontrada.');
		return new TenantResponseDto(
			tenant.id,
			tenant.name,
			tenant.subdomain.getRaw(),
			tenant.contatEmail.getValue(),
			tenant.isActive,
			tenant.createdAt,
		);
	}
}

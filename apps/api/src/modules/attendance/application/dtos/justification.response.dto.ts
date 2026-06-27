// justification.response.dto.ts
import { Justification } from '../../domain/entities/justification.entity';

export class JustificationResponseDto {
	readonly id: string;
	readonly reason: string;
	readonly notes?: string;
	readonly createdBy: string;
	readonly createdAt: Date;

	constructor(justification: Justification) {
		this.id = justification.id;
		this.reason = justification.reason.getRaw();
		this.notes = justification.notes;
		this.createdBy = justification.createdBy;
		this.createdAt = justification.createdAt;
	}
}

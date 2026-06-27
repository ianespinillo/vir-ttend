import { Justification } from '../../../domain/entities/justification.entity';
import { JustificationOrmEntity } from '../entities/justification.orm-entity';

export class JustificationMapper {
	static toOrm(domain: Justification): JustificationOrmEntity {
		const justification = new JustificationOrmEntity();
		justification.notes = domain.notes ?? undefined;
		justification.createdAt = domain.createdAt;
		justification.createdBy = domain.createdBy;
		justification.attendanceRecordId = domain.attendanceRecordId.getRaw();
		justification.id = domain.id;
		justification.reason = domain.reason.getRaw();
		return justification;
	}
	static toDomain(orm: JustificationOrmEntity): Justification {
		return Justification.reconstitute(orm);
	}
}

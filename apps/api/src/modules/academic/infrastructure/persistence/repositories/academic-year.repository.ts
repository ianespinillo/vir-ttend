import { EntityRepository } from '@mikro-orm/postgresql';
import { AcademicYear } from '../../../domain/entities/academic-year.entity';
import { IAcademicYearRepository } from '../../../domain/repositories/academic-year.repository.interface';
import { AcademicYearOrmEntity } from '../entities/academic-year.orm-entity';
import { AcademicYearMapper } from '../mappers/academic-year.mapper';

export class AcademicYearRepository
	extends EntityRepository<AcademicYearOrmEntity>
	implements IAcademicYearRepository
{
	async findById(id: string): Promise<AcademicYear | null> {
		const orm = await this.findOne({ id });
		if (!orm) {
			return null;
		}
		return AcademicYearMapper.toDomain(orm);
	}
	async findBySchool(schoolId: string): Promise<AcademicYear[]> {
		const orms = await this.find({ schoolId });
		return orms.map((orm) => AcademicYearMapper.toDomain(orm));
	}
	async findBySchoolAndYear(
		schoolId: string,
		year: number,
	): Promise<AcademicYear | null> {
		const orm = await this.findOne({ schoolId, year });
		if (!orm) {
			return null;
		}
		return AcademicYearMapper.toDomain(orm);
	}
	async findActive(schoolId: string): Promise<AcademicYear | null> {
		const orm = await this.findOne({ schoolId, isActive: true });
		if (!orm) {
			return null;
		}
		return AcademicYearMapper.toDomain(orm);
	}
	async save(entity: AcademicYear): Promise<void> {
		if (entity.isActive) {
			const activeYears = await this.find({
				schoolId: entity.tenantId,
				isActive: true,
				id: { $ne: entity.id.getRaw() },
			});
			for (const ay of activeYears) {
				ay.isActive = false;
				ay.updatedAt = new Date();
			}
		}
		const existing = await this.findOne({ id: entity.id.getRaw() });
		if (existing) {
			existing.schoolId = entity.tenantId;
			existing.year = entity.year;
			existing.startDate = entity.startDate;
			existing.endDate = entity.endDate;
			existing.isActive = entity.isActive;
			existing.nonWorkingDays = entity.nonWorkingDays;
			existing.absenceThresholdPercent = entity.absenceThresholdPercent;
			existing.lateCountAbscenseAfterMinutes =
				entity.lateCountAbscenseAfterMinutes;
			existing.createdAt = entity.createdAt;
			existing.updatedAt = entity.updatedAt;
		} else {
			const orm = AcademicYearMapper.toOrm(entity);
			this.em.persist(orm);
		}
		await this.em.flush();
	}
}

import { EntityRepository } from '@mikro-orm/postgresql';
import { Subject } from '../../../domain/entities/subject.entity';
import { ISubjectRepository } from '../../../domain/repositories/subject.repository.interface';
import { SubjectOrmEntity } from '../entities/subject.orm-entity';
import { SubjectMapper } from '../mappers/subject.mapper';

export class SubjectRepository
	extends EntityRepository<SubjectOrmEntity>
	implements ISubjectRepository
{
	async findById(id: string): Promise<Subject | null> {
		const orm = await this.findOne({ id });
		if (!orm) {
			return null;
		}
		return SubjectMapper.toDomain(orm);
	}
	async findByTeacher(teacherId: string): Promise<Subject[]> {
		const orms = await this.find({ teacherId });
		return orms.map((orm) => SubjectMapper.toDomain(orm));
	}
	async findByCourse(courseId: string): Promise<Subject[]> {
		const orms = await this.find({ courseId });
		return orms.map((orm) => SubjectMapper.toDomain(orm));
	}
	async save(subject: Subject): Promise<void> {
		const orm = SubjectMapper.toOrm(subject);
		this.em.persist(orm);
		await this.em.flush();
	}
}

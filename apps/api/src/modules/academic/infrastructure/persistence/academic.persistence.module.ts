import { MikroOrmModule } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { Module } from '@nestjs/common';
import { AcademicYearOrmEntity } from './entities/academic-year.orm-entity';
import { CourseOrmEntity } from './entities/courses.orm-entity';
import { ScheduleSlotOrmEntity } from './entities/schedule-slot.orm-entity';
import { StudentOrmEntity } from './entities/student.orm-entity';
import { SubjectOrmEntity } from './entities/subject.orm-entity';
import { AcademicYearRepository } from './repositories/academic-year.repository';
import { CourseRepository } from './repositories/course.repository';
import { ScheduleSlotRepository } from './repositories/schedule-slot.repository';
import { StudentRepository } from './repositories/student.repository';
import { SubjectRepository } from './repositories/subject.repository';

@Module({
	imports: [
		MikroOrmModule.forFeature([
			AcademicYearOrmEntity,
			CourseOrmEntity,
			ScheduleSlotOrmEntity,
			SubjectOrmEntity,
			StudentOrmEntity,
		]),
	],
	providers: [
		{
			provide: AcademicYearRepository,
			useFactory: (em: EntityManager) => em.getRepository(AcademicYearOrmEntity),
			inject: [EntityManager],
		},
		{
			provide: CourseRepository,
			useFactory: (em: EntityManager) => em.getRepository(CourseOrmEntity),
			inject: [EntityManager],
		},
		{
			provide: ScheduleSlotRepository,
			useFactory: (em: EntityManager) => em.getRepository(ScheduleSlotOrmEntity),
			inject: [EntityManager],
		},
		{
			provide: StudentRepository,
			useFactory: (em: EntityManager) => em.getRepository(StudentOrmEntity),
			inject: [EntityManager],
		},
		{
			provide: SubjectRepository,
			useFactory: (em: EntityManager) => em.getRepository(SubjectOrmEntity),
			inject: [EntityManager],
		},
		{
			provide: 'IStudentRepository',
			useExisting: StudentRepository,
		},
		{
			provide: 'IAcademicYearRepository',
			useExisting: AcademicYearRepository,
		},
		{
			provide: 'IScheduleRepository',
			useExisting: ScheduleSlotRepository,
		},
		{
			provide: 'ICourseRepository',
			useExisting: CourseRepository,
		},
		{
			provide: 'ISubjectRepository',
			useExisting: SubjectRepository,
		},
	],
	exports: [
		AcademicYearRepository,
		CourseRepository,
		ScheduleSlotRepository,
		SubjectRepository,
		StudentRepository,
		'IStudentRepository',
		'IAcademicYearRepository',
		'IScheduleRepository',
		'ICourseRepository',
		'ISubjectRepository',
	],
})
export class AcademicPersistenceModule {}

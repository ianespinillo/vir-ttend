import { MikroOrmModule } from '@mikro-orm/nestjs';
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
		AcademicYearRepository,
		CourseRepository,
		ScheduleSlotRepository,
		SubjectRepository,
		StudentRepository,
	],
	exports: [
		AcademicYearRepository,
		CourseRepository,
		ScheduleSlotRepository,
		SubjectRepository,
		StudentRepository,
	],
})
export class AcademicPersistenceModule {}

import { Module } from '@nestjs/common';
import { AcademicYearsController } from './controllers/academic-year.controller';
import { CoursesController } from './controllers/course.controller';
import { ScheduleController } from './controllers/schedule-slot.controller';
import { StudentsController } from './controllers/students.controller';
import { SubjectsController } from './controllers/subjects.controller';

@Module({
	controllers: [
		AcademicYearsController,
		CoursesController,
		ScheduleController,
		SubjectsController,
		StudentsController,
	],
})
export class AcademicPresentationModule {}

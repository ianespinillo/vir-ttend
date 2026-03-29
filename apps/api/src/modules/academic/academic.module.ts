import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { AssignPreceptorHandler } from './application/commands/assign-preceptor/assign-preceptor.handler';
import { AssignTeacherHandler } from './application/commands/assign-teaher/assign-teacher.handler';
import { CreateAcademicYearHandler } from './application/commands/create-academic-year/create-academic-year.handler';
import { CreateCourseHandler } from './application/commands/create-course/create-course.handler';
import { CreateSubjectHandler } from './application/commands/create-subject/create-subject.handler';
import { DeleteCourseHandler } from './application/commands/delete-course/delete-course.handler';
import { DeleteSubjectHandler } from './application/commands/delete-subject/delete-subject.handler';
import { SetScheduleHandler } from './application/commands/set-schedule/set-schedule.handler';
import { UpdateAcademicYearHandler } from './application/commands/update-academic-year/update-academic-year.handler';
import { UpdateCourseHandler } from './application/commands/update-course/update-course.handler';
import { UpdateSubjectHandler } from './application/commands/update-subject/update-subject.handler';
import { GetAcademicYearsHandler } from './application/queries/get-academic-years/get-academic-years.handler';
import { GetActiveAcademicYearHandler } from './application/queries/get-active-academic-year/get-active-academic-year.handler';
import { GetCourseHandler } from './application/queries/get-course/get-course.handler';
import { GetCoursesByPreceptorHandler } from './application/queries/get-courses-by-preceptor/get-courses-by-preceptor.handler';
import { GetCoursesHandler } from './application/queries/get-courses/get-courses.handler';
import { GetScheduleHandler } from './application/queries/get-schedule/get-schedule.handler';
import { GetSubjectsByCourseHandler } from './application/queries/get-subjects-by-course/get-subjects-by-course.handler';
import { MembershipAdapter } from './infrastructure/adapters/membership.adapter';
import { AcademicPersistenceModule } from './infrastructure/persistence/academic.persistence.module';
import { AcademicPresentationModule } from './presentation/academic.presentation.module';

@Module({
	imports: [
		IdentityModule,
		AcademicPersistenceModule,
		AcademicPresentationModule,
	],
	providers: [
		// Handler
		AssignPreceptorHandler,
		AssignTeacherHandler,
		CreateAcademicYearHandler,
		CreateCourseHandler,
		CreateSubjectHandler,
		DeleteCourseHandler,
		DeleteSubjectHandler,
		SetScheduleHandler,
		UpdateAcademicYearHandler,
		UpdateCourseHandler,
		UpdateSubjectHandler,

		// Handler de queries
		GetAcademicYearsHandler,
		GetActiveAcademicYearHandler,
		GetCourseHandler,
		GetCoursesHandler,
		GetCoursesByPreceptorHandler,
		GetSubjectsByCourseHandler,
		GetScheduleHandler,

		// Adapters
		MembershipAdapter,
	],
})
export class AcademicModule {}

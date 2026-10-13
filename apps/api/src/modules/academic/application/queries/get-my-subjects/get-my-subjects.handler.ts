import { Inject, Injectable } from '@nestjs/common';
import { DAYOFWEEK } from '@repo/common';
import { ScheduleSlot } from '../../../domain/entities/schedule-slot.entity';
import { IAcademicYearRepository } from '../../../domain/repositories/academic-year.repository.interface';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { IScheduleRepository } from '../../../domain/repositories/schedule.repository.interface';
import { ISubjectRepository } from '../../../domain/repositories/subject.repository.interface';
import { CourseService } from '../../../domain/services/course.service';
import {
	MySubjectResponseDto,
	MySubjectSlotResponseDto,
} from '../../dtos/my-subject.response.dto';
import { GetMySubjectsQuery } from './get-my-subjects.query';

const DAY_ORDER: DAYOFWEEK[] = [
	DAYOFWEEK.MONDAY,
	DAYOFWEEK.TUESDAY,
	DAYOFWEEK.WEDNESDAY,
	DAYOFWEEK.THURSDAY,
	DAYOFWEEK.FRIDAY,
];

/**
 * Subjects a teacher gives in the tenant's active academic year, with their
 * whole-week schedule so clients can filter by weekday and preload offline.
 */
@Injectable()
export class GetMySubjectsHandler {
	constructor(
		@Inject('IAcademicYearRepository')
		private readonly academicYearRepo: IAcademicYearRepository,
		@Inject('ICourseRepository')
		private readonly courseRepo: ICourseRepository,
		@Inject('ISubjectRepository')
		private readonly subjectRepo: ISubjectRepository,
		@Inject('IScheduleRepository')
		private readonly scheduleRepo: IScheduleRepository,
	) {}

	async execute(query: GetMySubjectsQuery): Promise<MySubjectResponseDto[]> {
		const academicYear = await this.academicYearRepo.findActive(query.tenantId);
		if (!academicYear) return [];

		const courses = await this.courseRepo.findByAcademicYear(
			academicYear.id.getRaw(),
		);
		if (courses.length === 0) return [];

		const courseNames = new Map(
			courses.map((c) => [c.id.getRaw(), CourseService.calculateFulName(c)]),
		);
		const subjects = await this.subjectRepo.findByTeacherAndCourses(
			query.teacherId,
			[...courseNames.keys()],
		);

		const slotsBySubject = await Promise.all(
			subjects.map((s) => this.scheduleRepo.findBySubject(s.id.getRaw())),
		);

		return subjects.map(
			(subject, index) =>
				new MySubjectResponseDto({
					subjectId: subject.id.getRaw(),
					name: subject.name,
					area: subject.area,
					courseId: subject.courseId,
					courseName: courseNames.get(subject.courseId) ?? '',
					slots: this.sortSlots(slotsBySubject[index]).map(
						(slot) => new MySubjectSlotResponseDto(slot),
					),
				}),
		);
	}

	private sortSlots(slots: ScheduleSlot[]): ScheduleSlot[] {
		return [...slots].sort(
			(a, b) =>
				DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek) ||
				a.startTime.localeCompare(b.startTime),
		);
	}
}

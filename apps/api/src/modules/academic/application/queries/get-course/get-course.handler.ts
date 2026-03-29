import { Injectable } from '@nestjs/common';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { IScheduleRepository } from '../../../domain/repositories/schedule.repository.interface';
import { ISubjectRepository } from '../../../domain/repositories/subject.repository.interface';
import { CourseDetailResponseDto } from '../../dtos/course-detail.response.dto';
import { GetCourseQuery } from './get-course.query';

@Injectable()
export class GetCourseHandler {
	constructor(
		private readonly courseRepo: ICourseRepository,
		private readonly subjectRepo: ISubjectRepository,
		private readonly slotRepo: IScheduleRepository,
	) {}
	async execute(query: GetCourseQuery): Promise<CourseDetailResponseDto> {
		const course = await this.courseRepo.findById(query.courseId);
		if (!course) throw new Error('Course not found');
		const schedules = await this.slotRepo.findByCourse(course.id.getRaw());
		const subjects = await this.subjectRepo.findByCourse(course.id.getRaw());
		return new CourseDetailResponseDto(course, subjects, schedules);
	}
}

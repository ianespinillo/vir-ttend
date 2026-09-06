import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '../../../../identity/domain/repositories/user.repository.interface';
import { ICourseRepository } from '../../../domain/repositories/course.repository.interface';
import { IScheduleRepository } from '../../../domain/repositories/schedule.repository.interface';
import { ISubjectRepository } from '../../../domain/repositories/subject.repository.interface';
import { CourseDetailResponseDto } from '../../dtos/course-detail.response.dto';
import { GetCourseQuery } from './get-course.query';

@Injectable()
export class GetCourseHandler {
	constructor(
		@Inject('ICourseRepository')
		private readonly courseRepo: ICourseRepository,
		@Inject('ISubjectRepository')
		private readonly subjectRepo: ISubjectRepository,
		@Inject('IScheduleRepository')
		private readonly slotRepo: IScheduleRepository,
		@Inject('IUserRepository')
		private readonly userRepo: IUserRepository,
	) {}
	async execute(query: GetCourseQuery): Promise<CourseDetailResponseDto> {
		const course = await this.courseRepo.findById(query.courseId);
		if (!course) throw new Error('Course not found');
		const preceptor = await this.userRepo.findById(course.preceptorId);
		const schedules = await this.slotRepo.findByCourse(course.id.getRaw());
		const subjects = await this.subjectRepo.findByCourse(course.id.getRaw());
		return new CourseDetailResponseDto(
			course,
			subjects,
			schedules,
			preceptor.fullName,
		);
	}
}

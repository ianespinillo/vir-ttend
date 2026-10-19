import { Inject, Injectable } from '@nestjs/common';
import { CommissionNumber, DAYOFWEEK, SUBJECT_KIND } from '@repo/common';
import { Course as AcademicCourse } from '../../../academic/domain/entities/course.entity';
import { WorkshopCommission } from '../../../academic/domain/entities/workshop-commission.entity';
import { ICourseRepository } from '../../../academic/domain/repositories/course.repository.interface';
import { IScheduleRepository } from '../../../academic/domain/repositories/schedule.repository.interface';
import { IStudentRepository } from '../../../academic/domain/repositories/student.repository.interface';
import { ISubjectRepository } from '../../../academic/domain/repositories/subject.repository.interface';
import { IWorkshopCommissionRepository } from '../../../academic/domain/repositories/workshop-commission.repository.interface';
import { Student } from '../../domain/entities/student.entity';
import {
	IWorkshopCommissionPort,
	WorkshopCommissionInfo,
} from '../../domain/ports/workshop-commission.port.interface';

/** Reads workshop commissions, their students and slots from the academic module. */
@Injectable()
export class WorkshopCommissionAdapter implements IWorkshopCommissionPort {
	constructor(
		@Inject('IWorkshopCommissionRepository')
		private readonly commissionRepository: IWorkshopCommissionRepository,
		@Inject('ICourseRepository')
		private readonly courseRepository: ICourseRepository,
		@Inject('IStudentRepository')
		private readonly studentRepository: IStudentRepository,
		@Inject('ISubjectRepository')
		private readonly subjectRepository: ISubjectRepository,
		@Inject('IScheduleRepository')
		private readonly scheduleRepository: IScheduleRepository,
	) {}

	async findById(commissionId: string): Promise<WorkshopCommissionInfo | null> {
		const commission = await this.commissionRepository.findById(commissionId);
		if (!commission) return null;
		const course = await this.courseRepository.findById(commission.courseId);
		return course ? this.toInfo(commission, course) : null;
	}

	async findByStudent(
		studentId: string,
	): Promise<WorkshopCommissionInfo | null> {
		const student = await this.studentRepository.findById(studentId);
		return student?.workshopCommissionId
			? this.findById(student.workshopCommissionId)
			: null;
	}

	async findByCourse(courseId: string): Promise<WorkshopCommissionInfo[]> {
		const commissions = await this.commissionRepository.findByCourse(courseId);
		if (commissions.length === 0) return [];
		const course = await this.courseRepository.findById(courseId);
		return course ? commissions.map((c) => this.toInfo(c, course)) : [];
	}

	findByPreceptor(preceptorId: string): Promise<WorkshopCommissionInfo[]> {
		return this.withActiveCourses(
			this.commissionRepository.findByPreceptor(preceptorId),
		);
	}

	findByTenant(tenantId: string): Promise<WorkshopCommissionInfo[]> {
		return this.withActiveCourses(
			this.commissionRepository.findByTenant(tenantId),
		);
	}

	async getActiveStudents(commissionId: string): Promise<Student[]> {
		const students =
			await this.studentRepository.findActiveByCommission(commissionId);
		return [...students]
			.sort(
				(a, b) =>
					a.lastName.localeCompare(b.lastName) ||
					a.firstName.localeCompare(b.firstName),
			)
			.map((s) => Student.reconstitute(s.id, s.fullName));
	}

	async getWorkshopDays(
		courseId: string,
		commissionNumber: CommissionNumber,
	): Promise<DAYOFWEEK[]> {
		const workshopSubjectIds = new Set(
			(await this.subjectRepository.findByCourse(courseId))
				.filter((subject) => subject.kind === SUBJECT_KIND.WORKSHOP)
				.map((subject) => subject.id.getRaw()),
		);
		const slots = await this.scheduleRepository.findByCourse(courseId);
		return slots
			.filter(
				(slot) =>
					workshopSubjectIds.has(slot.subjectId) &&
					(slot.commissionNumber === null ||
						slot.commissionNumber === commissionNumber),
			)
			.map((slot) => slot.dayOfWeek);
	}

	private async withActiveCourses(
		pending: Promise<WorkshopCommission[]>,
	): Promise<WorkshopCommissionInfo[]> {
		const commissions = await pending;
		const courses = new Map<string, AcademicCourse | null>();
		const infos: WorkshopCommissionInfo[] = [];
		for (const commission of commissions) {
			if (!courses.has(commission.courseId)) {
				courses.set(
					commission.courseId,
					await this.courseRepository.findById(commission.courseId),
				);
			}
			const course = courses.get(commission.courseId);
			if (course?.isActive) infos.push(this.toInfo(commission, course));
		}
		return infos;
	}

	private toInfo(
		commission: WorkshopCommission,
		course: AcademicCourse,
	): WorkshopCommissionInfo {
		return {
			id: commission.id,
			tenantId: commission.tenantId,
			courseId: commission.courseId,
			courseName: `${course.yearNumber}° ${course.division}°`,
			number: commission.number,
			code: commission.code(course),
			preceptorId: commission.preceptorId,
		};
	}
}

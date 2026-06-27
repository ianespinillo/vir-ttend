export interface ISchedulePort {
	findByCourse(courseId: string): Promise<
		{
			subjectId: string;
			dayOfWeek: string;
			startTime: string;
			endTime: string;
		}[]
	>;
}

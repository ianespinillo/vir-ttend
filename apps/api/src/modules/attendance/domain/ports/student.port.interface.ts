import { StudentDataModel } from '../../application/models/student-data.model';

export interface IStudentPort {
	getByCourseId(courseId: string): Promise<StudentDataModel[]>;
}

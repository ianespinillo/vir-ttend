import {
	DAYOFWEEK,
	type ICourseDetailResponse,
	type IStudentResponse,
	LEVEL,
	SHIFT,
	STUDENTSTATUS,
} from '@repo/common';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CourseDetail } from './course-detail';

const course: ICourseDetailResponse = {
	id: 'course-1',
	level: LEVEL.PRIMARY,
	yearNumber: 6,
	division: 'A',
	shift: SHIFT.MORNING,
	fullName: '6° A - Mañana',
	preceptorName: 'Roberto López',
};

const students: IStudentResponse[] = [
	{
		id: 'student-1',
		fullName: 'Ana Pérez',
		firstName: 'Ana',
		lastName: 'Pérez',
		documentNumber: '40111222',
		birthDate: '2014-03-01',
		age: 12,
		courseId: 'course-1',
		status: STUDENTSTATUS.ACTIVE,
	},
	{
		id: 'student-2',
		fullName: 'Bruno Díaz',
		firstName: 'Bruno',
		lastName: 'Díaz',
		documentNumber: '40333444',
		birthDate: '2014-05-10',
		age: 12,
		courseId: 'course-1',
		status: STUDENTSTATUS.ACTIVE,
	},
];

function openStudentsTab() {
	fireEvent.mouseDown(screen.getByRole('tab', { name: 'Estudiantes' }));
}

describe('CourseDetail', () => {
	it('shows the given student count in the header', () => {
		render(<CourseDetail course={course} studentCount={2} />);
		expect(screen.getByText('2')).toBeInTheDocument();
	});

	it('lists the course students inside the Estudiantes tab', () => {
		render(<CourseDetail course={course} students={students} />);
		openStudentsTab();

		expect(screen.getByText('Pérez, Ana')).toBeInTheDocument();
		expect(screen.getByText('Díaz, Bruno')).toBeInTheDocument();
		expect(
			screen.queryByText('Ver estudiantes en el módulo de Alumnado'),
		).not.toBeInTheDocument();
	});

	it('allows schedule management when canManageSchedule is true even if canManage is false', () => {
		render(
			<CourseDetail course={course} canManage={false} canManageSchedule={true} />,
		);
		fireEvent.mouseDown(screen.getByRole('tab', { name: 'Horario' }));

		expect(
			screen.getByRole('button', { name: /Agregar Franja Horaria/i }),
		).toBeInTheDocument();
		expect(screen.queryByText('Editar Curso')).not.toBeInTheDocument();
	});

	it('labels commission slots with year, division and commission', () => {
		render(
			<CourseDetail
				course={{ ...course, yearNumber: 7, division: '1' }}
				subjects={[
					{ id: 'subject-1', name: 'Taller', area: 'Taller', weeklyHours: 4 },
				]}
				schedule={[
					{
						id: 'slot-1',
						subjectId: 'subject-1',
						dayOfWeek: DAYOFWEEK.MONDAY,
						startTime: '08:00',
						endTime: '10:00',
						commissionNumber: 1,
					},
				]}
			/>,
		);
		fireEvent.mouseDown(screen.getByRole('tab', { name: 'Horario' }));

		expect(screen.getByText('711')).toBeInTheDocument();
		expect(screen.queryByText('C1')).not.toBeInTheDocument();
	});
});

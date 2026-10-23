import {
	DAYOFWEEK,
	type ICourseDetailResponse,
	type IStudentResponse,
	LEVEL,
	SHIFT,
	STUDENTSTATUS,
} from '@repo/common';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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

	it('lets subjects be managed without managing the course', () => {
		render(
			<CourseDetail
				course={course}
				canManage={false}
				canManageSubjects={true}
				onAddSubject={() => {}}
			/>,
		);
		fireEvent.mouseDown(screen.getByRole('tab', { name: 'Materias' }));

		expect(
			screen.getAllByRole('button', { name: /Agregar Materia/i }).length,
		).toBeGreaterThan(0);
		expect(screen.queryByText('Editar Curso')).not.toBeInTheDocument();
	});

	it('shows the Comisiones tab whenever its content is given, without managing the course', () => {
		render(
			<CourseDetail
				course={course}
				canManage={false}
				commissionsTab={<p>Panel de comisiones</p>}
			/>,
		);

		expect(screen.getByRole('tab', { name: 'Comisiones' })).toBeInTheDocument();
	});

	it('shows the Inactivo badge only for inactive courses', () => {
		const { rerender } = render(
			<CourseDetail course={{ ...course, isActive: false }} />,
		);
		expect(screen.getByText('Inactivo')).toBeInTheDocument();

		rerender(<CourseDetail course={{ ...course, isActive: true }} />);
		expect(screen.queryByText('Inactivo')).not.toBeInTheDocument();

		rerender(<CourseDetail course={course} />);
		expect(screen.queryByText('Inactivo')).not.toBeInTheDocument();
	});

	it('deactivates an active course through onToggleActive(false)', () => {
		const onToggleActive = vi.fn();
		render(
			<CourseDetail
				course={{ ...course, isActive: true }}
				canManage
				onToggleActive={onToggleActive}
			/>,
		);

		fireEvent.click(screen.getByRole('button', { name: 'Desactivar' }));

		expect(onToggleActive).toHaveBeenCalledWith(false);
		expect(
			screen.queryByRole('button', { name: 'Activar' }),
		).not.toBeInTheDocument();
	});

	it('activates an inactive course through onToggleActive(true)', () => {
		const onToggleActive = vi.fn();
		render(
			<CourseDetail
				course={{ ...course, isActive: false }}
				canManage
				onToggleActive={onToggleActive}
			/>,
		);

		fireEvent.click(screen.getByRole('button', { name: 'Activar' }));

		expect(onToggleActive).toHaveBeenCalledWith(true);
	});

	it('hides the status action without onToggleActive', () => {
		render(<CourseDetail course={course} canManage />);

		expect(
			screen.queryByRole('button', { name: 'Desactivar' }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole('button', { name: 'Activar' }),
		).not.toBeInTheDocument();
	});

	it('hides the Comisiones tab when no content is given', () => {
		render(<CourseDetail course={course} canManage={true} />);

		expect(
			screen.queryByRole('tab', { name: 'Comisiones' }),
		).not.toBeInTheDocument();
	});
});

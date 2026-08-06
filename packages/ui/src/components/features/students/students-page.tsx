'use client';

import type { ICourseResponse, IStudentResponse } from '@repo/common';
import { ChevronLeft, ChevronRight, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../ui/button';
import { PageHeader } from '../../shared/page-header';
import { EnrollmentModal } from './enrollment-modal';
import { StudentFilters, type StudentFiltersState } from './student-filters';
import { StudentsTable } from './students-table';

export interface StudentsPageProps {
	students: IStudentResponse[];
	total: number;
	page: number;
	totalPages: number;
	isLoading?: boolean;
	filters: StudentFiltersState;
	onFiltersChange: (filters: StudentFiltersState) => void;
	onPageChange: (page: number) => void;
	courses: ICourseResponse[];
	onView: (id: string) => void;
	onCreate: () => void;
	onEdit: (id: string) => void;
	onEnrollSubmit?: (studentId: string, courseId: string) => Promise<void> | void;
	onTransferSubmit?: (
		studentId: string,
		courseId: string,
	) => Promise<void> | void;
	onDeactivate?: (student: IStudentResponse) => Promise<void> | void;
	isAdmin?: boolean;
	isPreceptor?: boolean;
}

export function StudentsPage({
	students,
	total,
	page,
	totalPages,
	isLoading = false,
	filters,
	onFiltersChange,
	onPageChange,
	courses,
	onView,
	onCreate,
	onEdit,
	onEnrollSubmit,
	onTransferSubmit,
	onDeactivate,
	isAdmin = false,
	isPreceptor = false,
}: StudentsPageProps) {
	const [modalState, setModalState] = useState<{
		open: boolean;
		student: IStudentResponse | null;
		mode: 'enroll' | 'transfer';
	}>({
		open: false,
		student: null,
		mode: 'enroll',
	});

	const [isSubmittingModal, setIsSubmittingModal] = useState(false);

	const handleOpenEnroll = (student: IStudentResponse) => {
		setModalState({ open: true, student, mode: 'enroll' });
	};

	const handleOpenTransfer = (student: IStudentResponse) => {
		setModalState({ open: true, student, mode: 'transfer' });
	};

	const handleModalSubmit = async (targetCourseId: string) => {
		if (!modalState.student) return;
		setIsSubmittingModal(true);
		try {
			if (modalState.mode === 'enroll' && onEnrollSubmit) {
				await onEnrollSubmit(modalState.student.id, targetCourseId);
			} else if (modalState.mode === 'transfer' && onTransferSubmit) {
				await onTransferSubmit(modalState.student.id, targetCourseId);
			}
			setModalState((prev) => ({ ...prev, open: false }));
		} finally {
			setIsSubmittingModal(false);
		}
	};

	return (
		<div className="space-y-6">
			<PageHeader
				title="Estudiantes"
				description="Gestión del alumnado, matriculación y transferencias"
				actions={
					(isAdmin || isPreceptor) && (
						<Button onClick={onCreate} className="gap-2">
							<UserPlus className="h-4 w-4" />
							Nuevo Estudiante
						</Button>
					)
				}
			/>

			<StudentFilters
				value={filters}
				onChange={onFiltersChange}
				courses={courses}
			/>

			<StudentsTable
				data={students}
				isLoading={isLoading}
				courses={courses}
				onView={onView}
				onEdit={onEdit}
				onEnroll={handleOpenEnroll}
				onTransfer={handleOpenTransfer}
				onDeactivate={onDeactivate}
				isAdmin={isAdmin}
				isPreceptor={isPreceptor}
			/>

			{/* Server/URL Pagination controls */}
			<div className="flex items-center justify-between px-2 py-3 border-t">
				<p className="text-sm text-muted-foreground">
					Total: <span className="font-semibold text-foreground">{total}</span>{' '}
					estudiantes
					{totalPages > 0 && ` • Página ${page} de ${totalPages}`}
				</p>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => onPageChange(Math.max(1, page - 1))}
						disabled={page <= 1 || isLoading}
					>
						<ChevronLeft className="h-4 w-4 mr-1" />
						Anterior
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => onPageChange(page + 1)}
						disabled={page >= totalPages || isLoading}
					>
						Siguiente
						<ChevronRight className="h-4 w-4 ml-1" />
					</Button>
				</div>
			</div>

			{modalState.student && (
				<EnrollmentModal
					open={modalState.open}
					onOpenChange={(open) => setModalState((prev) => ({ ...prev, open }))}
					studentName={modalState.student.fullName}
					currentCourseId={modalState.student.courseId}
					mode={modalState.mode}
					courses={courses}
					onSubmit={handleModalSubmit}
					isLoading={isSubmittingModal}
				/>
			)}
		</div>
	);
}

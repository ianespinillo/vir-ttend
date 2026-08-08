'use client';

import type { ISubjectResponse } from '@repo/common';
import { BookOpen } from 'lucide-react';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../../../ui/select';

export interface SubjectSelectorProps {
	subjects: ISubjectResponse[];
	selectedSubjectId?: string;
	onSubjectChange: (subjectId: string) => void;
	isLoading?: boolean;
	disabled?: boolean;
	allowedSubjectIds?: string[];
}

export function SubjectSelector({
	subjects,
	selectedSubjectId,
	onSubjectChange,
	isLoading,
	disabled,
	allowedSubjectIds,
}: SubjectSelectorProps) {
	return (
		<div className="w-full sm:w-60">
			<Select
				value={selectedSubjectId || ''}
				onValueChange={onSubjectChange}
				disabled={disabled || isLoading}
			>
				<SelectTrigger className="w-full bg-background/50 border-input hover:border-primary/50 transition-colors">
					<div className="flex items-center gap-2 truncate">
						<BookOpen className="h-4 w-4 text-primary shrink-0" />
						<SelectValue
							placeholder={
								isLoading ? 'Cargando materias...' : 'Seleccionar materia...'
							}
						/>
					</div>
				</SelectTrigger>
				<SelectContent>
					{subjects.map((subj) => {
						const isDayAllowed =
							!allowedSubjectIds || allowedSubjectIds.includes(subj.id);
						return (
							<SelectItem key={subj.id} value={subj.id} disabled={!isDayAllowed}>
								<div className="flex items-center justify-between gap-3 w-full">
									<span className="font-medium">{subj.name}</span>
									{!isDayAllowed && (
										<span className="text-xs text-muted-foreground italic">
											(Sin clase hoy)
										</span>
									)}
								</div>
							</SelectItem>
						);
					})}
				</SelectContent>
			</Select>
		</div>
	);
}

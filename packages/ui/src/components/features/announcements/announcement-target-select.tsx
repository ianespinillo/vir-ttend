'use client';

import { LevelTargetOption, levelTargets } from '@repo/common';
import type { AnnouncementTargetType, ICourseResponse } from '@repo/common';
import { Label } from '../../../ui/label';
import { RadioGroup, RadioGroupItem } from '../../../ui/radio-group';

export interface AnnouncementTargetSelectProps {
	targetType: AnnouncementTargetType;
	targetId?: string;
	courses: ICourseResponse[];
	disabled?: boolean;
	onTargetTypeChange: (value: AnnouncementTargetType) => void;
	onTargetIdChange: (value: string) => void;
}

const TARGET_OPTIONS: {
	value: AnnouncementTargetType;
	label: string;
}[] = [
	{ value: 'school', label: 'Toda la escuela' },
	{ value: 'course', label: 'Un curso' },
	{ value: 'level', label: 'Un nivel' },
];

const selectClass =
	'h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

export function AnnouncementTargetSelect({
	targetType,
	targetId,
	courses,
	disabled,
	onTargetTypeChange,
	onTargetIdChange,
}: Readonly<AnnouncementTargetSelectProps>) {
	return (
		<div className="space-y-3">
			<RadioGroup
				value={targetType}
				onValueChange={(v) => onTargetTypeChange(v as AnnouncementTargetType)}
				disabled={disabled}
				className="grid grid-cols-3 gap-2"
			>
				{TARGET_OPTIONS.map((option) => (
					<Label
						key={option.value}
						className="flex cursor-pointer items-center gap-2 rounded-md border p-3 font-normal has-[button[data-state=checked]]:border-primary"
					>
						<RadioGroupItem
							value={option.value}
							onClick={() => onTargetTypeChange(option.value)}
						/>
						{option.label}
					</Label>
				))}
			</RadioGroup>

			{targetType === 'course' && (
				<select
					aria-label="Curso destinatario"
					className={selectClass}
					value={targetId ?? ''}
					disabled={disabled}
					onChange={(e) => onTargetIdChange(e.target.value)}
				>
					<option value="">Seleccioná un curso...</option>
					{courses.map((course) => (
						<option key={course.id} value={course.id}>
							{course.fullName}
						</option>
					))}
				</select>
			)}

			{targetType === 'level' && (
				<select
					aria-label="Nivel destinatario"
					className={selectClass}
					value={targetId ?? ''}
					disabled={disabled}
					onChange={(e) => onTargetIdChange(e.target.value)}
				>
					<option value="">Seleccioná un nivel...</option>
					{levelTargets.map((level) => (
						<option key={level} value={level}>
							{LevelTargetOption[level]}
						</option>
					))}
				</select>
			)}
		</div>
	);
}
